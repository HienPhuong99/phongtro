#!/usr/bin/env node
/**
 * Tự động khởi tạo 7 trang tính (Phong, KhachThue, DanhSachXe, HopDong, HoaDon, SoThuChi, CaiDat)
 * trực tiếp lên Google Sheets (19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g) thông qua Google Drive API v3
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import * as XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CODE_GS_PATH = path.join(ROOT_DIR, 'apps-script', 'Code.gs');
const SPREADSHEET_ID = '19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g';
const SCRIPT_ID = '1F8VbvEXaKWRxLeHQ5MpQXxdWt32tJicY36mz8GTJ-wR5ecg7hT74FhtL';

async function getAccessToken() {
  const clasprcPath = path.join(os.homedir(), '.clasprc.json');
  const rc = JSON.parse(fs.readFileSync(clasprcPath, 'utf8')).tokens.default;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: rc.client_id,
      client_secret: rc.client_secret,
      refresh_token: rc.refresh_token,
      grant_type: 'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token;
}

function loadSeedFromCodeGs() {
  const codeGs = fs.readFileSync(CODE_GS_PATH, 'utf8');
  const sandbox = {};
  vm.createContext(sandbox);
  vm.runInContext(codeGs, sandbox);
  return sandbox.getDefaultSeedData();
}

async function main() {
  console.log('=== ĐỒNG BỘ 7 BẢNG DỮ LIỆU LÊN GOOGLE SHEETS QUA DRIVE API V3 ===');
  const seed = loadSeedFromCodeGs();
  const wb = XLSX.utils.book_new();

  // 1. Phong
  const roomRows = [
    [
      'Mã Phòng', 'Tên Phòng', 'Tầng', 'Cơ Sở', 'Trạng Thái',
      'Giá Thuê (VNĐ)', 'Tiền Cọc (VNĐ)', 'Khách Đại Diện', 'SĐT',
      'Số Người Ở', 'Tối Đa', 'Số Xe', 'Mã Hợp Đồng', 'Hạn Hợp Đồng', 'Công Nợ (VNĐ)', 'Ghi Chú'
    ],
    ...seed.rooms.map((r) => [
      r.id, r.name, r.floor, r.building || 'Nhà trọ Bình An', r.status,
      r.price, r.deposit, r.tenantName || '', r.tenantPhone || '',
      r.occupantsCount || 0, r.maxOccupants || 3, r.vehiclesCount || 0,
      r.contractCode || '', r.contractEnd || '', r.debt || 0, r.note || ''
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(roomRows), 'Phong');

  // 2. KhachThue
  const tenantRows = [
    [
      'ID', 'Mã Khách', 'Họ Tên', 'Số Điện Thoại', 'CCCD',
      'Mã Phòng', 'Tên Phòng', 'Cơ Sở', 'Vai Trò', 'Trạng Thái',
      'Mã Hợp Đồng', 'Đã Thanh Toán (VNĐ)', 'Còn Nợ (VNĐ)', 'Ngày Vào Ở'
    ],
    ...seed.tenants.map((t) => [
      t.id, t.code, t.name, t.phone, t.cccd,
      t.roomId || '', t.roomName || '', t.building || 'Nhà trọ Bình An',
      t.role, t.status, t.contractCode || '', t.totalPaid || 0, t.debt || 0, t.moveInDate || ''
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(tenantRows), 'KhachThue');

  // 3. DanhSachXe
  const vehicleRows = [
    ['ID', 'Mã Phòng', 'Tên Phòng', 'Cơ Sở', 'Mã Khách', 'Chủ Xe', 'Loại Xe', 'Biển Số', 'Ghi Chú'],
    ...seed.vehicles.map((v) => [
      v.id, v.roomId, v.roomName, v.building || 'Nhà trọ Bình An',
      v.tenantId, v.tenantName, v.type, v.licensePlate, v.note || ''
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vehicleRows), 'DanhSachXe');

  // 4. HopDong
  const contractRows = [
    [
      'ID', 'Mã Hợp Đồng', 'Mã Phòng', 'Tên Phòng', 'Cơ Sở',
      'Mã Khách', 'Khách Đại Diện', 'SĐT', 'Ngày Bắt Đầu', 'Ngày Kết Thúc',
      'Giá Thuê (VNĐ)', 'Tiền Cọc (VNĐ)', 'Trạng Thái', 'Cọc Phải Trả (VNĐ)', 'Ghi Chú Hoàn Cọc'
    ],
    ...seed.contracts.map((c) => [
      c.id, c.code, c.roomId, c.roomName, c.building || 'Nhà trọ Bình An',
      c.tenantId, c.tenantName, c.tenantPhone, c.startDate, c.endDate,
      c.rentPrice, c.deposit, c.status, c.refundDue || 0, c.refundNote || ''
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(contractRows), 'HopDong');

  // 5. HoaDon
  const invoiceRows = [
    [
      'ID', 'Mã Hóa Đơn', 'Kỳ (YYYY-MM)', 'Nhãn Kỳ', 'Mã Phòng', 'Tên Phòng', 'Cơ Sở',
      'Khách Đại Diện', 'SĐT', 'Tiền Phòng', 'Điện Cũ', 'Điện Mới', 'Số kWh', 'Tiền Điện',
      'Nước Cũ', 'Nước Mới', 'Số m3', 'Tiền Nước', 'Phí Dịch Vụ',
      'Tổng Cộng', 'Đã Trả', 'Còn Lại', 'Hạn Thanh Toán', 'Trạng Thái'
    ],
    ...seed.invoices.map((inv) => [
      inv.id, inv.code, inv.period, inv.periodLabel, inv.roomId, inv.roomName,
      inv.building || 'Nhà trọ Bình An', inv.tenantName, inv.tenantPhone,
      inv.rentAmount, inv.oldElec, inv.newElec, inv.elecUsage, inv.elecAmount,
      inv.oldWater, inv.newWater, inv.waterUsage, inv.waterAmount, inv.serviceAmount,
      inv.totalAmount, inv.paidAmount, inv.remainingAmount, inv.dueDate, inv.status
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(invoiceRows), 'HoaDon');

  // 6. SoThuChi
  const txRows = [
    [
      'ID', 'Mã Giao Dịch', 'Ngày', 'Loại (income/expense)', 'Danh Mục',
      'Nội Dung', 'Phòng', 'Khách Thuê', 'Cơ Sở', 'Số Tiền (VNĐ)',
      'Phương Thức', 'Quỹ', 'Mã Hóa Đơn', 'Ghi Chú'
    ],
    ...seed.transactions.map((tx) => [
      tx.id, tx.code, tx.date, tx.type, tx.category, tx.title,
      tx.roomName || '', tx.tenantName || '', tx.building || 'Nhà trọ Bình An',
      tx.amount, tx.paymentMethod, tx.fund, tx.invoiceCode || '', tx.note || ''
    ]),
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(txRows), 'SoThuChi');

  // 7. CaiDat
  const settingsRows = [
    ['Khóa Cấu Hình', 'Giá Trị', 'Mô Tả'],
    ['TEN_CO_SO', 'Nhà trọ Bình An', 'Tên nhà trọ chính'],
    ['DIA_CHI', '128 Nguyễn Văn Thương, Bình Thạnh, TP.HCM', 'Địa chỉ cơ sở'],
    ['GIA_DIEN_KWH', 3500, 'Đơn giá điện (VNĐ/kWh)'],
    ['GIA_NUOC_M3', 18000, 'Đơn giá nước (VNĐ/m3)'],
    ['PHI_RAC_THANG', 30000, 'Phí rác sinh hoạt (VNĐ/tháng)'],
    ['PHI_WIFI_THANG', 100000, 'Phí Internet/Wifi (VNĐ/tháng)'],
    ['NGAN_HANG_VIETQR', 'Vietcombank - 1029384756 - NGUYEN QUAN LY TRO', 'Tài khoản nhận thanh toán QR'],
    ['CAP_NHAT_CUOI', new Date().toISOString(), 'Thời điểm đồng bộ gần nhất'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(settingsRows), 'CaiDat');

  const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  const localXlsxPath = path.join(ROOT_DIR, 'apps-script', 'QuanLyPhongTro-Database.xlsx');
  fs.writeFileSync(localXlsxPath, xlsxBuffer);
  console.log(`Đã xuất file Excel 7 trang tính tại: ${localXlsxPath}`);

  const token = await getAccessToken();

  // Upload nội dung 7 sheet lên Google Spreadsheet
  const uploadRes = await fetch(
    `https://www.googleapis.com/upload/drive/v3/files/${SPREADSHEET_ID}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
      body: xlsxBuffer,
    }
  );
  console.log('Upload 7 sheets lên Google Spreadsheet status:', uploadRes.status, await uploadRes.text());

  // Đảm bảo quyền đọc công khai cho Spreadsheet & Script
  for (const fileId of [SPREADSHEET_ID, SCRIPT_ID]) {
    await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
  }

  console.log('✅ Đã đồng bộ hoàn tất 7 bảng dữ liệu lên Google Sheets!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
