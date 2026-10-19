import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDateVN,
  vnToIsoDate,
  isoToVnDate,
  daysBetweenVN,
} from './format.ts';
import {
  calculateFirstPeriodProRata,
  calculateInvoiceFromReadings,
  calculateInvoicePayable,
  allocatePaymentFIFO,
  applyRoomPricingToInvoice,
  calculateDepositRefund,
  computeDaysRemaining,
  extractBillingMonth,
} from './billing.ts';
import type { Invoice } from '../types.ts';

function makeMockInvoice(overrides: Partial<Invoice>): Invoice {
  return {
    id: 'inv-1',
    code: 'HD-IV-00001',
    propertyId: 'prop-binh-an',
    roomCode: 'P101',
    floor: 1,
    tenantName: 'Nguyễn Văn An',
    tenantPhone: '0910000000',
    contractCode: 'HD-00001',
    billingMonth: '2026-09',
    periodLabel: '01/09 → 30/09',
    issueDate: '01/09/2026',
    dueDate: '10/09/2026',
    rentAmount: 2350000,
    elecOld: 1000,
    elecNew: 1050,
    elecUsage: 50,
    elecRate: 3500,
    elecAmount: 175000,
    waterOld: 50,
    waterNew: 55,
    waterUsage: 5,
    waterRate: 15000,
    waterAmount: 75000,
    trashAmount: 30000,
    internetAmount: 100000,
    vehicleCount: 1,
    vehicleAmount: 120000,
    totalAmount: 2850000,
    paidAmount: 0,
    status: 'unpaid',
    sentZalo: false,
    isOverdue: false,
    ...overrides,
  };
}

test('parseDateVN: đọc đúng DD/MM/YYYY và YYYY-MM-DD, chặn ngày không tồn tại', () => {
  const d1 = parseDateVN('11/10/2026');
  assert.ok(d1);
  assert.equal(d1.getFullYear(), 2026);
  assert.equal(d1.getMonth(), 9);
  assert.equal(d1.getDate(), 11);

  const d2 = parseDateVN('2026-10-11');
  assert.ok(d2);
  assert.equal(vnToIsoDate('11/10/2026'), '2026-10-11');
  assert.equal(isoToVnDate('2026-10-11'), '11/10/2026');

  // Chặn ngày không tồn tại
  assert.equal(parseDateVN('31/11/2026'), null);
  assert.equal(parseDateVN('29/02/2026'), null); // 2026 không nhuận
  assert.ok(parseDateVN('29/02/2028')); // 2028 năm nhuận
  assert.equal(parseDateVN('abc'), null);
  assert.equal(parseDateVN('2026-11-31'), null);
  assert.equal(daysBetweenVN('01/10/2026', '11/10/2026'), 10);
});

test('calculateFirstPeriodProRata: tính đúng tiền phòng kỳ đầu theo ngày ở thực tế', () => {
  // Vào ở 11/10/2026 (tháng 10 có 31 ngày -> ở 21/31 ngày), giá 2.500.000đ
  const oct = calculateFirstPeriodProRata({
    startDate: '11/10/2026',
    rentAmount: 2500000,
    billingCycle: 'calendar_month',
  });
  assert.equal(oct.stayDays, 21);
  assert.equal(oct.daysInMonth, 31);
  assert.equal(oct.firstAmount, Math.round((2500000 * 21) / 31)); // 1.693.548
  assert.equal(oct.periodText, '11/10 → 31/10');

  // Vào ở ngày 16/11/2026 (tháng 11 có 30 ngày -> ở 15/30 ngày = đúng nửa tháng)
  const nov = calculateFirstPeriodProRata({
    startDate: '16/11/2026',
    rentAmount: 3000000,
    billingCycle: 'calendar_month',
  });
  assert.equal(nov.stayDays, 15);
  assert.equal(nov.daysInMonth, 30);
  assert.equal(nov.firstAmount, 1500000);

  // Chế độ chốt theo ngày vào ở (move_in_date) -> thu tròn tháng
  const moveIn = calculateFirstPeriodProRata({
    startDate: '16/11/2026',
    rentAmount: 3000000,
    billingCycle: 'move_in_date',
  });
  assert.equal(moveIn.firstAmount, 3000000);
});

test('calculateInvoiceFromReadings: tính đúng điện nước, tổng tiền và trạng thái', () => {
  const baseInv = makeMockInvoice({
    rentAmount: 2400000,
    elecOld: 1000,
    elecRate: 3500,
    waterOld: 50,
    waterRate: 15000,
    trashAmount: 30000,
    internetAmount: 100000,
    vehicleAmount: 120000,
    paidAmount: 1000000,
  });

  const res = calculateInvoiceFromReadings(baseInv, { elecNew: 1060, waterNew: 54 });
  assert.equal(res.elecUsage, 60);
  assert.equal(res.elecAmount, 210000);
  assert.equal(res.waterUsage, 4);
  assert.equal(res.waterAmount, 60000);
  assert.equal(res.totalAmount, 2400000 + 210000 + 60000 + 30000 + 100000 + 120000); // 2.920.000
  assert.equal(res.status, 'partial');
});

test('calculateInvoicePayable: trừ đúng paidAmount của kỳ hiện tại và cộng nợ kỳ trước', () => {
  // Hóa đơn 2.928.000đ, khách đã trả trước 966.200đ qua FIFO, nợ kỳ trước = 0
  const payable = calculateInvoicePayable(
    { totalAmount: 2928000, paidAmount: 966200 },
    0
  );
  assert.equal(payable.currentRemaining, 1961800);
  assert.equal(payable.grandTotal, 1961800);

  // Có thêm nợ kỳ trước 1.200.000đ
  const withDebt = calculateInvoicePayable(
    { totalAmount: 2928000, paidAmount: 966200 },
    1200000
  );
  assert.equal(withDebt.grandTotal, 3161800);
});

test('allocatePaymentFIFO: phân bổ từ hóa đơn cũ nhất trước và bỏ qua hóa đơn nháp', () => {
  const invNov = makeMockInvoice({
    id: 'inv-11',
    code: 'HD-IV-00089',
    billingMonth: '2026-11',
    totalAmount: 2928000,
    paidAmount: 0,
    status: 'unpaid',
  });
  const invSep = makeMockInvoice({
    id: 'inv-09',
    code: 'HD-IV-00052',
    billingMonth: '2026-09',
    totalAmount: 2800000,
    paidAmount: 1666200, // Còn nợ 1.133.800
    status: 'partial',
  });
  const invOct = makeMockInvoice({
    id: 'inv-10',
    code: 'HD-IV-00070',
    billingMonth: '2026-10',
    totalAmount: 2900000,
    paidAmount: 0, // Còn nợ 2.900.000
    status: 'unpaid',
  });
  const invDraft = makeMockInvoice({
    id: 'inv-draft',
    code: 'HD-IV-00099',
    billingMonth: '2026-08',
    totalAmount: 2500000,
    paidAmount: 0,
    status: 'draft',
  });

  // Khách đóng 5.000.000đ (truyền mảng lộn xộn thứ tự tháng)
  const { allocatedItems, updatedMap, remainingMoney } = allocatePaymentFIFO(
    [invNov, invDraft, invOct, invSep],
    5000000
  );

  assert.equal(remainingMoney, 0);
  assert.equal(allocatedItems.length, 3);

  // 1. Trả dứt kỳ 09/2026 trước (1.133.800đ)
  assert.equal(allocatedItems[0].invoiceId, 'inv-09');
  assert.equal(allocatedItems[0].amountAllocated, 1133800);
  assert.equal(allocatedItems[0].fullyPaid, true);
  assert.equal(updatedMap['inv-09'].newStatus, 'paid');

  // 2. Trả dứt kỳ 10/2026 tiếp theo (2.900.000đ)
  assert.equal(allocatedItems[1].invoiceId, 'inv-10');
  assert.equal(allocatedItems[1].amountAllocated, 2900000);
  assert.equal(allocatedItems[1].fullyPaid, true);
  assert.equal(updatedMap['inv-10'].newStatus, 'paid');

  // 3. Phần dư 966.200đ trừ một phần vào kỳ 11/2026
  assert.equal(allocatedItems[2].invoiceId, 'inv-11');
  assert.equal(allocatedItems[2].amountAllocated, 966200);
  assert.equal(allocatedItems[2].fullyPaid, false);
  assert.equal(updatedMap['inv-11'].newStatus, 'partial');
});

test('applyRoomPricingToInvoice: đồng bộ giá thuê, phí xe và cập nhật lại trạng thái hóa đơn', () => {
  const inv = makeMockInvoice({
    rentAmount: 2500000,
    elecAmount: 200000,
    waterAmount: 60000,
    trashAmount: 30000,
    internetAmount: 100000,
    vehicleCount: 1,
    vehicleAmount: 120000,
    totalAmount: 3010000,
    paidAmount: 2900000,
    status: 'partial',
  });

  // Giảm giá phòng xuống 2.300.000đ -> tổng mới = 2.810.000đ <= paidAmount (2.900.000đ) -> chuyển sang 'paid'
  const updated = applyRoomPricingToInvoice(
    inv,
    {
      roomCode: 'P101',
      price: 2300000,
      deposit: 2300000,
      trashFee: 30000,
      internetFee: 100000,
      vehicleCount: 1,
      status: 'occupied',
    },
    120000,
    2500000
  );

  assert.equal(updated.totalAmount, 2810000);
  assert.equal(updated.status, 'paid');

  // Hóa đơn kỳ đầu 21/31 ngày (1.693.548đ trên giá 2.500.000đ): tăng giá lên 3.100.000đ thì giữ tỷ lệ 21/31
  const proRata = makeMockInvoice({ rentAmount: 1693548, status: 'unpaid', paidAmount: 0 });
  const repriced = applyRoomPricingToInvoice(
    proRata,
    {
      roomCode: 'P101',
      price: 3100000,
      deposit: 3100000,
      trashFee: 30000,
      internetFee: 100000,
      vehicleCount: 1,
      status: 'occupied',
    },
    120000,
    2500000
  );
  assert.equal(repriced.rentAmount, Math.round((3100000 * 21) / 31));
});

test('computeDaysRemaining & extractBillingMonth: hoạt động chính xác với mốc APP_TODAY', () => {
  assert.equal(computeDaysRemaining('01/12/2026', '11/10/2026'), 51);
  assert.equal(computeDaysRemaining('01/10/2026', '11/10/2026'), 0);
  assert.equal(extractBillingMonth('15/11/2026'), '2026-11');
  assert.equal(extractBillingMonth('2026-12-05'), '2026-12');
});

test('calculateDepositRefund: quyết toán hoàn cọc, khấu trừ hư hỏng/công nợ và chặn âm', () => {
  // Trường hợp 1: cọc 2.500.000đ, khấu trừ vệ sinh/sửa chữa 300.000đ -> hoàn trả 2.200.000đ
  const normal = calculateDepositRefund(2500000, 300000);
  assert.equal(normal.validDeposit, 2500000);
  assert.equal(normal.actualDeducted, 300000);
  assert.equal(normal.refundAmount, 2200000);
  assert.equal(normal.extraDue, 0);

  // Trường hợp 2: không khấu trừ -> hoàn trả đủ 100% cọc
  const full = calculateDepositRefund(2400000, 0);
  assert.equal(full.refundAmount, 2400000);
  assert.equal(full.actualDeducted, 0);
  assert.equal(full.extraDue, 0);

  // Trường hợp 3: khấu trừ vượt tiền cọc (cọc 2.000.000đ, nợ/hư hỏng 2.650.000đ) -> hoàn 0đ, khách còn thiếu 650.000đ
  const over = calculateDepositRefund(2000000, 2650000);
  assert.equal(over.refundAmount, 0);
  assert.equal(over.actualDeducted, 2000000);
  assert.equal(over.extraDue, 650000);
});

