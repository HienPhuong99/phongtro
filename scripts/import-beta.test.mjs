import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import http from 'node:http';
import { TEMPLATE, buildSnapshot, mergeIntoState, pushToSupabase } from './import-beta.mjs';

const workbook = (patch = {}) => {
  const wb = XLSX.utils.book_new();
  for (const [name, rows] of Object.entries({ ...TEMPLATE, ...patch })) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), name);
  }
  // Đi vòng qua file thật để giống lúc đọc .xlsx của chủ trọ
  return XLSX.read(XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }), { cellDates: true });
};

test('import-beta: file mẫu -> phòng, hợp đồng, khách, xe, nợ cũ đúng kiểu dữ liệu web', () => {
  const { errors, snapshot } = buildSnapshot(workbook(), { propertyId: 'prop-1', today: '21/10/2026' });
  assert.deepEqual(errors, []);
  const [p101, p102] = snapshot.rooms;
  assert.equal(snapshot.properties[0].name, 'Nhà trọ An Phú');
  assert.equal(snapshot.properties[0].electricityRate, 3460);
  assert.equal(p101.status, 'occupied');
  assert.equal(p101.tenantName, 'Trần Văn Bình');
  assert.equal(p101.contractCode, 'HD-00001');
  assert.equal(p102.status, 'maintenance');
  assert.equal(snapshot.contracts[0].startDate, '01/03/2026');
  assert.equal(snapshot.contracts[0].daysRemaining, 130);
  assert.deepEqual(snapshot.contracts[0].coTenantNames, ['Lê Thị Cúc', 'Trần Văn Dũng']);
  assert.equal(snapshot.tenants.length, 3);
  assert.equal(snapshot.tenants.filter((t) => t.role === 'representative').length, 1);
  assert.equal(snapshot.vehicles[0].plate, '59X1-123.45');
  const debt = snapshot.invoices[0];
  assert.equal(debt.billingMonth, '2026-09');
  assert.equal(debt.totalAmount, 450000);
  assert.equal(debt.status, 'unpaid');
});

test('import-beta: ngày dạng ô Date của Excel và hợp đồng đã hết hạn', () => {
  const { errors, snapshot } = buildSnapshot(
    workbook({
      HopDong: [
        TEMPLATE.HopDong[0],
        ['P101', 'Khách Cũ', '0907654321', '', new Date(2025, 0, 1), new Date(2025, 11, 31), '', '', ''],
      ],
    }),
    { today: '21/10/2026' }
  );
  assert.deepEqual(errors, []);
  assert.equal(snapshot.contracts[0].endDate, '31/12/2025');
  assert.equal(snapshot.contracts[0].status, 'ended');
  assert.equal(snapshot.rooms[0].status, 'vacant');
  assert.equal(snapshot.contracts[0].rentAmount, 2500000);
});

test('import-beta: báo lỗi phòng không tồn tại, SĐT sai, thiếu ngày, trùng mã phòng', () => {
  const { errors } = buildSnapshot(
    workbook({
      Phong: [TEMPLATE.Phong[0], ['P101', 1, 1, 1], ['p101', 1, 1, 1]],
      HopDong: [TEMPLATE.HopDong[0], ['P999', 'A', '0901', '', '', '', '', '', '']],
    })
  );
  assert.ok(errors.some((e) => e.includes('trùng mã phòng P101')));
  assert.ok(errors.some((e) => e.includes('P999')));
  assert.ok(errors.some((e) => e.includes('SĐT')));
  assert.ok(errors.some((e) => e.includes('ngày bắt đầu')));
});

test('mergeIntoState: thay sổ trống lúc đăng ký, chặn ghi đè cơ sở đã có phòng nếu thiếu --replace', () => {
  const { snapshot } = buildSnapshot(workbook(), { propertyId: 'prop-2', today: '21/10/2026' });
  const fresh = { properties: [{ id: 'prop-1', name: 'trống' }], rooms: [], tenants: [], vehicles: [], contracts: [], invoices: [], transactions: [] };
  const merged = mergeIntoState(fresh, snapshot);
  assert.deepEqual(merged.properties.map((p) => p.id), ['prop-2']);
  assert.equal(merged.rooms.length, 2);
  assert.throws(() => mergeIntoState(merged, snapshot), /--replace/);
  const again = mergeIntoState(merged, snapshot, { replace: true });
  assert.equal(again.rooms.length, 2);
  assert.equal(mergeIntoState(null, snapshot), snapshot);
});

test('import-beta: đẩy lên Supabase tìm đúng tài khoản, gộp với sổ cũ, upsert theo owner_id', async () => {
  const calls = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, prefer: req.headers.prefer, body });
      res.setHeader('Content-Type', 'application/json');
      if (req.url.startsWith('/auth/v1/admin/users')) {
        return res.end(JSON.stringify({ users: [{ id: 'u-other', email: 'x@tro.vn' }, { id: 'u-1', email: 'Chu@Tro.vn' }] }));
      }
      if (req.method === 'GET') {
        return res.end(JSON.stringify([{ state: { properties: [{ id: 'old', name: 'Nhà cũ' }], rooms: [], invoices: [], transactions: [] } }]));
      }
      res.statusCode = 201;
      res.end();
    });
  });
  await new Promise((r) => server.listen(0, r));
  process.env.SUPABASE_URL = `http://127.0.0.1:${server.address().port}`;
  process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
  const { snapshot } = buildSnapshot(workbook(), { propertyId: 'prop-1', today: '21/10/2026' });
  try {
    await pushToSupabase(snapshot, { email: 'chu@tro.vn', replace: false });
    await assert.rejects(pushToSupabase(snapshot, { email: 'khong-co@tro.vn' }), /Chưa có tài khoản/);
  } finally {
    server.close();
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  }
  assert.equal(calls[0].auth, 'Bearer test-key');
  assert.equal(calls[1].url, '/rest/v1/user_app_state?owner_id=eq.u-1&select=state');
  const post = calls[2];
  assert.equal(post.method, 'POST');
  assert.match(post.prefer, /resolution=merge-duplicates/);
  const row = JSON.parse(post.body);
  assert.equal(row.owner_id, 'u-1');
  assert.deepEqual(row.state.properties.map((p) => p.name), ['Nhà cũ', 'Nhà trọ An Phú']);
  assert.equal(row.state.rooms.length, snapshot.rooms.length);
});
