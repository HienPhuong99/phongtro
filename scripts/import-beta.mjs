#!/usr/bin/env node
/**
 * Nhập liệu hộ cho chủ trọ Beta (P0 #5): file Excel theo mẫu -> sổ đám mây của chủ trọ trên Supabase.
 *
 *   node scripts/import-beta.mjs --template mau-nhap-lieu.xlsx          # tạo file mẫu để chép dữ liệu vào
 *   node scripts/import-beta.mjs so-cua-chu-tro.xlsx --dry-run          # kiểm tra, xuất .snapshot.json, không ghi gì
 *   node scripts/import-beta.mjs so-cua-chu-tro.xlsx --email chu@tro.vn [--property-id prop-2] [--replace]
 *
 * Cần `.env.local` (không commit) có SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY.
 * service_role bỏ qua RLS: chỉ để trên máy quản trị, không bao giờ đặt tên bắt đầu bằng VITE_.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as XLSX from 'xlsx';
import { computeDaysRemaining, extractBillingMonth } from '../src/utils/billing.ts';
import { formatDateVN, parseDateVN } from '../src/utils/format.ts';

const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export const TEMPLATE = {
  CoSo: [
    ['Khóa', 'Giá trị', 'Ghi chú'],
    ['TEN', 'Nhà trọ An Phú', 'Tên khu trọ'],
    ['DIA_CHI', '12 Lê Lợi, Thủ Đức', ''],
    ['GIA_DIEN', 3460, 'đ/kWh (trần 2026: không vượt giá bán lẻ bậc cao nhất)'],
    ['GIA_NUOC', 18000, 'đ/m3'],
    ['PHI_RAC', 30000, 'đ/phòng/tháng'],
    ['PHI_WIFI', 100000, 'đ/phòng/tháng'],
    ['PHI_XE', 100000, 'đ/xe/tháng'],
    ['NGAN_HANG_BIN', '970436', 'Mã BIN VietQR (Vietcombank 970436, MB 970422, Techcombank 970407...)'],
    ['NGAN_HANG', 'Vietcombank', ''],
    ['SO_TAI_KHOAN', '0123456789', ''],
    ['CHU_TAI_KHOAN', 'NGUYEN VAN CHU', 'Viết hoa không dấu'],
  ],
  Phong: [
    ['Mã phòng', 'Tầng', 'Giá thuê', 'Tiền cọc', 'Chỉ số điện', 'Chỉ số nước', 'Số xe', 'Ghi chú'],
    ['P101', 1, 2500000, 2500000, 1250, 340, 1, ''],
    ['P102', 1, 2600000, 2600000, 980, 210, 0, 'Đang sửa'],
  ],
  HopDong: [
    ['Mã phòng', 'Khách đại diện', 'SĐT', 'CCCD', 'Ngày bắt đầu', 'Ngày kết thúc', 'Giá thuê', 'Tiền cọc', 'Người ở cùng'],
    ['P101', 'Trần Văn Bình', '0901234567', '079200001234', '01/03/2026', '28/02/2027', 2500000, 2500000, 'Lê Thị Cúc, Trần Văn Dũng'],
  ],
  Xe: [
    ['Mã phòng', 'Biển số', 'Chủ xe', 'Loại xe'],
    ['P101', '59X1-123.45', 'Trần Văn Bình', 'Xe máy'],
  ],
  NoCu: [
    ['Mã phòng', 'Số tiền nợ', 'Ghi chú'],
    ['P101', 450000, 'Nợ tiền điện tháng trước'],
  ],
};

const num = (v) => {
  if (typeof v === 'number') return Math.round(v);
  const n = Number(String(v ?? '').replace(/[^\d-]/g, ''));
  return Number.isFinite(n) ? n : 0;
};
const str = (v) => String(v ?? '').trim();
const dateVN = (v) => {
  if (v instanceof Date) return formatDateVN(v);
  const d = parseDateVN(str(v));
  return d ? formatDateVN(d) : '';
};

function rowsOf(wb, name) {
  const ws = wb.Sheets[name];
  if (!ws) return [];
  return XLSX.utils
    .sheet_to_json(ws, { header: 1, defval: '', blankrows: false })
    .slice(1)
    .filter((r) => r.some((c) => str(c) !== ''));
}

/**
 * Đọc workbook theo mẫu -> phần dữ liệu của 1 cơ sở (đúng kiểu AppSnapshot của web).
 * Trả kèm danh sách lỗi để người nhập sửa file trước khi đẩy lên.
 */
export function buildSnapshot(wb, { propertyId = 'prop-1', today = formatDateVN(new Date()) } = {}) {
  const errors = [];
  const cfg = Object.fromEntries(rowsOf(wb, 'CoSo').map((r) => [str(r[0]).toUpperCase(), r[1]]));
  if (!str(cfg.TEN)) errors.push('CoSo: thiếu TEN (tên khu trọ)');

  const property = {
    id: propertyId,
    name: str(cfg.TEN),
    address: str(cfg.DIA_CHI),
    electricityRate: num(cfg.GIA_DIEN) || 3460,
    waterRate: num(cfg.GIA_NUOC) || 18000,
    trashFee: num(cfg.PHI_RAC),
    internetFee: num(cfg.PHI_WIFI),
    vehicleFee: num(cfg.PHI_XE),
    bankBin: str(cfg.NGAN_HANG_BIN) || '970436',
    bankName: str(cfg.NGAN_HANG),
    bankAccount: str(cfg.SO_TAI_KHOAN),
    bankOwner: str(cfg.CHU_TAI_KHOAN).toUpperCase(),
  };

  const rooms = [];
  for (const [i, r] of rowsOf(wb, 'Phong').entries()) {
    const code = str(r[0]).toUpperCase();
    if (!code) {
      errors.push(`Phong dòng ${i + 2}: thiếu mã phòng`);
      continue;
    }
    if (rooms.some((x) => x.code === code)) errors.push(`Phong dòng ${i + 2}: trùng mã phòng ${code}`);
    const notes = str(r[7]);
    rooms.push({
      id: `${propertyId}-room-${code}`,
      propertyId,
      code,
      floor: num(r[1]) || 1,
      price: num(r[2]),
      deposit: num(r[3]),
      status: /sửa/i.test(notes) ? 'maintenance' : 'vacant',
      elecIndex: num(r[4]),
      waterIndex: num(r[5]),
      trashFee: property.trashFee,
      internetFee: property.internetFee,
      vehicleCount: num(r[6]),
      notes: notes || undefined,
    });
  }
  const roomByCode = new Map(rooms.map((r) => [r.code, r]));
  const needRoom = (sheet, i, code) => {
    const room = roomByCode.get(code);
    if (!room) errors.push(`${sheet} dòng ${i + 2}: phòng ${code || '(trống)'} không có trong sheet Phong`);
    return room;
  };

  const tenants = [];
  const contracts = [];
  for (const [i, r] of rowsOf(wb, 'HopDong').entries()) {
    const code = str(r[0]).toUpperCase();
    const room = needRoom('HopDong', i, code);
    const name = str(r[1]);
    const phone = str(r[2]).replace(/\D/g, '');
    const startDate = dateVN(r[4]);
    const endDate = dateVN(r[5]);
    if (!name) errors.push(`HopDong dòng ${i + 2}: thiếu tên khách`);
    if (phone && !/^0\d{9}$/.test(phone)) errors.push(`HopDong dòng ${i + 2}: SĐT ${phone} không đủ 10 số`);
    if (!startDate || !endDate) errors.push(`HopDong dòng ${i + 2}: ngày bắt đầu/kết thúc sai (DD/MM/YYYY)`);
    if (!room || !name) continue;

    const n = contracts.length + 1;
    const contractCode = `HD-${String(n).padStart(5, '0')}`;
    const tenantId = `${propertyId}-t-${n}`;
    const rent = num(r[6]) || room.price;
    const deposit = num(r[7]) || room.deposit;
    const coNames = str(r[8]).split(/[,;\n]/).map((x) => x.trim()).filter(Boolean);
    const active = !endDate || computeDaysRemaining(endDate, today) > 0;

    contracts.push({
      id: `${propertyId}-c-${n}`,
      code: contractCode,
      propertyId,
      roomCode: room.code,
      tenantId,
      tenantName: name,
      tenantPhone: phone,
      coTenantNames: coNames,
      startDate,
      endDate,
      signDate: startDate,
      paymentCycle: 'Hàng tháng',
      billingCycle: 'calendar_month',
      rentAmount: rent,
      depositAmount: deposit,
      depositMode: 'received_before',
      status: active ? 'active' : 'ended',
      daysRemaining: endDate ? computeDaysRemaining(endDate, today) : 365,
    });
    const tenantBase = {
      propertyId,
      roomCode: room.code,
      contractCode,
      contractEndDate: endDate,
      status: active ? 'active' : 'moved_out',
      hasCccdPhoto: false,
      tempResidenceDeclared: false,
    };
    tenants.push({ ...tenantBase, id: tenantId, code: `KH-${String(tenants.length + 1).padStart(5, '0')}`, name, phone, cccd: str(r[3]), role: 'representative' });
    for (const co of coNames) {
      tenants.push({ ...tenantBase, id: `${tenantId}-${tenants.length + 1}`, code: `KH-${String(tenants.length + 1).padStart(5, '0')}`, name: co, phone: '', cccd: '', role: 'co_tenant' });
    }
    if (active) {
      Object.assign(room, { status: 'occupied', price: rent, deposit, tenantId, tenantName: name, tenantPhone: phone, contractCode });
    }
  }

  const vehicles = rowsOf(wb, 'Xe').flatMap((r, i) => {
    const room = needRoom('Xe', i, str(r[0]).toUpperCase());
    if (!room) return [];
    return [{
      id: `${propertyId}-v-${i + 1}`,
      propertyId,
      plate: str(r[1]).toUpperCase(),
      ownerName: str(r[2]) || room.tenantName || '',
      phone: room.tenantPhone || '',
      roomCode: room.code,
      vehicleType: str(r[3]) || 'Xe máy',
    }];
  });
  for (const room of rooms) {
    const count = vehicles.filter((v) => v.roomCode === room.code).length;
    if (count > room.vehicleCount) room.vehicleCount = count;
  }

  // Nợ cũ: 1 hóa đơn "Nợ đầu kỳ" ở kỳ trước để màn Công nợ và thu FIFO trừ vào trước.
  const prevMonth = (() => {
    const [y, m] = extractBillingMonth(today).split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  })();
  const invoices = rowsOf(wb, 'NoCu').flatMap((r, i) => {
    const room = needRoom('NoCu', i, str(r[0]).toUpperCase());
    const amount = num(r[1]);
    if (!room || amount <= 0) return [];
    return [{
      id: `${propertyId}-inv-open-${room.code}`,
      code: `NO-${room.code}`,
      propertyId,
      roomCode: room.code,
      floor: room.floor,
      tenantName: room.tenantName || '',
      tenantPhone: room.tenantPhone || '',
      contractCode: room.contractCode || '',
      billingMonth: prevMonth,
      periodLabel: `Nợ đầu kỳ${str(r[2]) ? ' — ' + str(r[2]) : ''}`,
      issueDate: today,
      dueDate: today,
      rentAmount: amount,
      elecOld: 0, elecNew: 0, elecUsage: 0, elecRate: 0, elecAmount: 0,
      waterOld: 0, waterNew: 0, waterUsage: 0, waterRate: 0, waterAmount: 0,
      trashAmount: 0,
      internetAmount: 0,
      vehicleCount: 0,
      vehicleAmount: 0,
      totalAmount: amount,
      paidAmount: 0,
      status: 'unpaid',
      sentZalo: true,
      isOverdue: true,
    }];
  });

  return { errors, snapshot: { properties: [property], rooms, tenants, vehicles, contracts, invoices, transactions: [] } };
}

/** Gộp dữ liệu 1 cơ sở vào sổ hiện có. Cơ sở đã có phòng thì phải `replace` mới ghi đè. */
export function mergeIntoState(existing, imported, { replace = false } = {}) {
  const pid = imported.properties[0].id;
  const base = existing && Array.isArray(existing.properties) ? existing : null;
  if (!base) return imported;
  if (!replace && (base.rooms || []).some((r) => r.propertyId === pid)) {
    throw new Error(`Cơ sở ${pid} đã có phòng trên mây. Thêm --replace để ghi đè hoặc --property-id khác để thêm cơ sở mới.`);
  }
  const keep = (arr) => (arr || []).filter((x) => x.propertyId !== pid);
  const out = {};
  for (const key of ['rooms', 'tenants', 'vehicles', 'contracts', 'invoices', 'transactions']) {
    out[key] = [...keep(base[key]), ...imported[key]];
  }
  out.properties = [...(base.properties || []).filter((p) => p.id !== pid), imported.properties[0]];
  // Cơ sở trống tự tạo lúc đăng ký (prop-1, chưa có phòng) bị thay bằng cơ sở vừa nhập
  if (pid !== 'prop-1' && !out.rooms.some((r) => r.propertyId === 'prop-1')) {
    out.properties = out.properties.filter((p) => p.id !== 'prop-1');
  }
  return out;
}

function loadEnv() {
  const env = { ...process.env };
  for (const f of ['.env.local', '.env']) {
    const p = path.join(ROOT_DIR, f);
    if (!fs.existsSync(p)) continue;
    for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*"?(.*?)"?\s*$/.exec(line);
      if (m && !env[m[1]]) env[m[1]] = m[2];
    }
  }
  return env;
}

export async function pushToSupabase(snapshot, { email, replace }) {
  const env = loadEnv();
  // Cùng project với web (src/utils/supabase.ts); .env.local chỉ cần khóa
  const url = env.SUPABASE_URL || env.VITE_SUPABASE_URL || 'https://ymdnvpdgdpdjnqnraklg.supabase.co';
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Thiếu SUPABASE_SERVICE_ROLE_KEY trong .env.local');
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

  let user = null;
  for (let page = 1; !user; page++) {
    const res = await fetch(`${url}/auth/v1/admin/users?page=${page}&per_page=200`, { headers });
    if (!res.ok) throw new Error(`Không đọc được danh sách tài khoản: ${res.status} ${await res.text()}`);
    const { users } = await res.json();
    user = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (users.length < 200) break;
  }
  if (!user) throw new Error(`Chưa có tài khoản ${email}. Nhờ chủ trọ đăng ký trên web trước.`);

  const cur = await fetch(`${url}/rest/v1/user_app_state?owner_id=eq.${user.id}&select=state`, { headers });
  if (!cur.ok) throw new Error(`Không đọc được sổ hiện tại: ${cur.status} ${await cur.text()}`);
  const [row] = await cur.json();
  const state = mergeIntoState(row?.state, snapshot, { replace });
  const res = await fetch(`${url}/rest/v1/user_app_state?on_conflict=owner_id`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify({ owner_id: user.id, state, schema_version: 'quanlyphongtro-web-v1', updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`Ghi sổ thất bại: ${res.status} ${await res.text()}`);
  return state;
}

async function main(argv) {
  const arg = (name) => {
    const i = argv.indexOf(name);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const templateOut = arg('--template');
  if (templateOut) {
    const wb = XLSX.utils.book_new();
    for (const [name, rows] of Object.entries(TEMPLATE)) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
    }
    fs.writeFileSync(templateOut, XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }));
    console.log(`Đã tạo file mẫu: ${templateOut}`);
    return;
  }
  const file = argv.find((a) => !a.startsWith('--') && a !== arg('--email') && a !== arg('--property-id'));
  if (!file) {
    console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0]);
    process.exitCode = 1;
    return;
  }
  const wb = XLSX.read(fs.readFileSync(file), { cellDates: true });
  const { errors, snapshot } = buildSnapshot(wb, { propertyId: arg('--property-id') || 'prop-1' });
  const owed = snapshot.invoices.reduce((s, i) => s + i.totalAmount, 0);
  console.log(
    `Cơ sở "${snapshot.properties[0].name}": ${snapshot.rooms.length} phòng, ${snapshot.contracts.length} hợp đồng, ` +
      `${snapshot.tenants.length} khách, ${snapshot.vehicles.length} xe, nợ cũ ${owed.toLocaleString('vi-VN')}đ`
  );
  if (errors.length) {
    console.error('Lỗi trong file, sửa rồi chạy lại:\n- ' + errors.join('\n- '));
    process.exitCode = 1;
    return;
  }
  if (argv.includes('--dry-run')) {
    const out = file.replace(/\.xlsx?$/i, '') + '.snapshot.json';
    fs.writeFileSync(out, JSON.stringify(snapshot, null, 2));
    console.log(`--dry-run: không ghi lên mây. Đã xuất ${out}`);
    return;
  }
  const email = arg('--email');
  if (!email) throw new Error('Thiếu --email của chủ trọ (hoặc dùng --dry-run)');
  await pushToSupabase(snapshot, { email, replace: argv.includes('--replace') });
  console.log(`✅ Đã nhập vào sổ đám mây của ${email}. Chủ trọ tải lại trang để thấy dữ liệu.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main(process.argv.slice(2)).catch((err) => {
    console.error('❌ ' + err.message);
    process.exit(1);
  });
}
