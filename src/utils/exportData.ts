import type { AppSnapshot } from './cloudSync.ts';

type Col<T> = [header: string, get: (row: T) => unknown];

const table = <T,>(rows: T[], cols: Col<T>[]) => [
  cols.map(([h]) => h),
  ...rows.map((r) => cols.map(([, get]) => get(r) ?? '')),
];

/** P1 #4 Chủ quyền dữ liệu: toàn bộ sổ -> các bảng (mảng 2 chiều) để ghi ra file Excel. */
export function snapshotToSheets(s: AppSnapshot): { name: string; rows: unknown[][] }[] {
  return [
    {
      name: 'CoSo',
      rows: table(s.properties, [
        ['Mã cơ sở', (p) => p.id],
        ['Tên', (p) => p.name],
        ['Địa chỉ', (p) => p.address],
        ['Giá điện', (p) => p.electricityRate],
        ['Giá nước', (p) => p.waterRate],
        ['Phí rác', (p) => p.trashFee],
        ['Phí wifi', (p) => p.internetFee],
        ['Phí xe', (p) => p.vehicleFee],
        ['Ngân hàng', (p) => p.bankName],
        ['Số tài khoản', (p) => p.bankAccount],
        ['Chủ tài khoản', (p) => p.bankOwner],
      ]),
    },
    {
      name: 'Phong',
      rows: table(s.rooms, [
        ['Cơ sở', (r) => r.propertyId],
        ['Mã phòng', (r) => r.code],
        ['Tầng', (r) => r.floor],
        ['Giá thuê', (r) => r.price],
        ['Tiền cọc', (r) => r.deposit],
        ['Trạng thái', (r) => r.status],
        ['Khách đại diện', (r) => r.tenantName],
        ['SĐT', (r) => r.tenantPhone],
        ['Mã hợp đồng', (r) => r.contractCode],
        ['Chỉ số điện', (r) => r.elecIndex],
        ['Chỉ số nước', (r) => r.waterIndex],
        ['Số xe', (r) => r.vehicleCount],
        ['Ghi chú', (r) => r.notes],
      ]),
    },
    {
      name: 'KhachThue',
      rows: table(s.tenants, [
        ['Cơ sở', (t) => t.propertyId],
        ['Mã khách', (t) => t.code],
        ['Họ tên', (t) => t.name],
        ['SĐT', (t) => t.phone],
        ['CCCD', (t) => t.cccd],
        ['Ngày sinh', (t) => t.dob],
        ['Quê quán', (t) => t.hometown],
        ['Phòng', (t) => t.roomCode],
        ['Vai trò', (t) => (t.role === 'representative' ? 'Đại diện' : 'Ở cùng')],
        ['Trạng thái', (t) => t.status],
        ['Mã hợp đồng', (t) => t.contractCode],
        ['Đã khai tạm trú', (t) => (t.tempResidenceDeclared ? 'Có' : 'Chưa')],
      ]),
    },
    {
      name: 'Xe',
      rows: table(s.vehicles, [
        ['Cơ sở', (v) => v.propertyId],
        ['Phòng', (v) => v.roomCode],
        ['Biển số', (v) => v.plate],
        ['Chủ xe', (v) => v.ownerName],
        ['SĐT', (v) => v.phone],
        ['Loại xe', (v) => v.vehicleType],
      ]),
    },
    {
      name: 'HopDong',
      rows: table(s.contracts, [
        ['Cơ sở', (c) => c.propertyId],
        ['Mã hợp đồng', (c) => c.code],
        ['Phòng', (c) => c.roomCode],
        ['Khách đại diện', (c) => c.tenantName],
        ['SĐT', (c) => c.tenantPhone],
        ['Người ở cùng', (c) => c.coTenantNames.join(', ')],
        ['Ngày bắt đầu', (c) => c.startDate],
        ['Ngày kết thúc', (c) => c.endDate],
        ['Ngày ký', (c) => c.signDate],
        ['Tiền thuê', (c) => c.rentAmount],
        ['Tiền cọc', (c) => c.depositAmount],
        ['Trạng thái', (c) => c.status],
        ['Ngày trả phòng', (c) => c.moveOutDate],
        ['Khấu trừ cọc', (c) => c.depositDeducted],
        ['Đã hoàn cọc', (c) => (c.depositRefunded ? 'Có' : '')],
      ]),
    },
    {
      name: 'HoaDon',
      rows: table(s.invoices, [
        ['Cơ sở', (i) => i.propertyId],
        ['Mã hóa đơn', (i) => i.code],
        ['Kỳ', (i) => i.billingMonth],
        ['Nhãn kỳ', (i) => i.periodLabel],
        ['Phòng', (i) => i.roomCode],
        ['Khách', (i) => i.tenantName],
        ['Ngày lập', (i) => i.issueDate],
        ['Hạn trả', (i) => i.dueDate],
        ['Tiền phòng', (i) => i.rentAmount],
        ['Điện cũ', (i) => i.elecOld],
        ['Điện mới', (i) => i.elecNew],
        ['Tiền điện', (i) => i.elecAmount],
        ['Nước cũ', (i) => i.waterOld],
        ['Nước mới', (i) => i.waterNew],
        ['Tiền nước', (i) => i.waterAmount],
        ['Rác', (i) => i.trashAmount],
        ['Wifi', (i) => i.internetAmount],
        ['Gửi xe', (i) => i.vehicleAmount],
        ['Tổng', (i) => i.totalAmount],
        ['Đã trả', (i) => i.paidAmount],
        ['Còn nợ', (i) => Math.max(0, i.totalAmount - i.paidAmount)],
        ['Trạng thái', (i) => i.status],
      ]),
    },
    {
      name: 'SoThuChi',
      rows: table(s.transactions, [
        ['Cơ sở', (t) => t.propertyId],
        ['Ngày', (t) => t.date],
        ['Loại', (t) => (t.type === 'income' ? 'Thu' : 'Chi')],
        ['Danh mục', (t) => t.category],
        ['Phòng', (t) => t.roomCode],
        ['Mã hóa đơn', (t) => t.invoiceCode],
        ['Nội dung', (t) => t.description],
        ['Số tiền', (t) => t.amount],
        ['Hình thức', (t) => t.method],
      ]),
    },
  ];
}

/** Ghi file .xlsx; thư viện xlsx chỉ tải khi bấm nút để không làm nặng trang. */
export async function downloadSnapshotXlsx(s: AppSnapshot, fileName: string): Promise<void> {
  const XLSX = await import('xlsx');
  const wb = XLSX.utils.book_new();
  for (const sheet of snapshotToSheets(s)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sheet.rows), sheet.name);
  }
  XLSX.writeFile(wb, fileName);
}
