import type { FifoAllocatedItem, Invoice, RoomPriceUpdateItem } from '../types.ts';
import { parseDateVN, todayVN } from './format.ts';

/**
 * Tính số ngày còn lại của hợp đồng tính từ `todayStr` (mặc định `todayVN()`).
 * Nếu ngày không hợp lệ thì trả về 365; nếu đã quá hạn thì trả về 0.
 */
export function computeDaysRemaining(endDateStr: string, todayStr: string = todayVN()): number {
  const end = parseDateVN(endDateStr);
  const today = parseDateVN(todayStr);
  if (!end || !today) return 365;
  const diffMs = end.getTime() - today.getTime();
  return Math.max(0, Math.round(diffMs / 86400000));
}

/**
 * Rút trích kỳ hóa đơn 'YYYY-MM' từ chuỗi ngày 'DD/MM/YYYY' hoặc 'YYYY-MM-DD'.
 */
export function extractBillingMonth(dateStr: string, fallbackMonth?: string): string {
  const d = parseDateVN(dateStr) ?? (fallbackMonth ? null : parseDateVN(todayVN()));
  if (!d) return fallbackMonth ?? '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

/**
 * 1. Tính tiền phòng kỳ đầu theo số ngày ở thực tế (Pro-rata).
 */
export function calculateFirstPeriodProRata(params: {
  startDate: string;
  rentAmount: number;
  billingCycle: 'calendar_month' | 'move_in_date';
  fallbackDate?: Date;
}): {
  periodText: string;
  daysText: string;
  stayDays: number;
  daysInMonth: number;
  firstAmount: number;
} {
  const start = parseDateVN(params.startDate) || params.fallbackDate || new Date(2026, 9, 11);
  const day = start.getDate();
  const month = start.getMonth() + 1;
  const year = start.getFullYear();
  const daysInMonth = new Date(year, month, 0).getDate();
  const stayDays = Math.max(1, daysInMonth - day + 1);
  const firstAmount =
    params.billingCycle === 'calendar_month'
      ? Math.round((params.rentAmount * stayDays) / daysInMonth)
      : params.rentAmount;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    periodText: `${pad(day)}/${pad(month)} → ${pad(daysInMonth)}/${pad(month)}`,
    daysText: `${stayDays}/${daysInMonth} ngày`,
    stayDays,
    daysInMonth,
    firstAmount,
  };
}

/**
 * 2. Tính sản lượng điện/nước, thành tiền, tổng hóa đơn và trạng thái thu tiền.
 */
export function calculateInvoiceFromReadings(
  inv: Pick<
    Invoice,
    | 'rentAmount'
    | 'elecOld'
    | 'elecRate'
    | 'waterOld'
    | 'waterRate'
    | 'trashAmount'
    | 'internetAmount'
    | 'vehicleAmount'
    | 'paidAmount'
  >,
  reading: { elecNew: number; waterNew: number }
): {
  elecUsage: number;
  elecAmount: number;
  waterUsage: number;
  waterAmount: number;
  totalAmount: number;
  status: Invoice['status'];
} {
  const elecUsage = Math.max(0, reading.elecNew - inv.elecOld);
  const waterUsage = Math.max(0, reading.waterNew - inv.waterOld);
  const elecAmount = elecUsage * inv.elecRate;
  const waterAmount = waterUsage * inv.waterRate;
  const totalAmount =
    inv.rentAmount +
    elecAmount +
    waterAmount +
    inv.trashAmount +
    inv.internetAmount +
    inv.vehicleAmount;
  const status: Invoice['status'] =
    inv.paidAmount >= totalAmount ? 'paid' : inv.paidAmount > 0 ? 'partial' : 'unpaid';

  return {
    elecUsage,
    elecAmount,
    waterUsage,
    waterAmount,
    totalAmount,
    status,
  };
}

/**
 * 3. Tính số tiền còn phải trả trên phiếu báo Zalo & mã VietQR
 * (đã trừ phần khách thanh toán trước của kỳ hiện tại + cộng nợ các kỳ trước).
 */
export function calculateInvoicePayable(
  invoice: Pick<Invoice, 'totalAmount' | 'paidAmount'>,
  previousDebtAmount: number
): {
  currentRemaining: number;
  grandTotal: number;
} {
  const currentRemaining = Math.max(0, invoice.totalAmount - invoice.paidAmount);
  const prevDebt = Math.max(0, previousDebtAmount);
  return {
    currentRemaining,
    grandTotal: currentRemaining + prevDebt,
  };
}

/**
 * 4. Phân bổ tiền thu theo nguyên tắc FIFO (trừ vào hóa đơn kỳ cũ nhất trước).
 */
export function allocatePaymentFIFO(
  invoices: Invoice[],
  paymentAmount: number
): {
  allocatedItems: FifoAllocatedItem[];
  updatedMap: Record<string, { addPaid: number; newStatus: Invoice['status'] }>;
  remainingMoney: number;
} {
  const sortedUnpaid = invoices
    .filter((i) => i.status !== 'draft' && i.totalAmount - i.paidAmount > 0)
    .slice()
    .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));

  let remainingMoney = Math.max(0, Math.round(paymentAmount));
  const allocatedItems: FifoAllocatedItem[] = [];
  const updatedMap: Record<string, { addPaid: number; newStatus: Invoice['status'] }> = {};

  for (const inv of sortedUnpaid) {
    if (remainingMoney <= 0) break;
    const needed = Math.max(0, inv.totalAmount - inv.paidAmount);
    const take = Math.min(remainingMoney, needed);
    if (take > 0) {
      remainingMoney -= take;
      const newPaid = inv.paidAmount + take;
      const fullyPaid = newPaid >= inv.totalAmount;
      updatedMap[inv.id] = {
        addPaid: take,
        newStatus: fullyPaid ? 'paid' : 'partial',
      };
      allocatedItems.push({
        invoiceId: inv.id,
        invoiceCode: inv.code,
        monthLabel: inv.billingMonth.replace('-', '/'),
        amountAllocated: take,
        fullyPaid,
      });
    }
  }

  return { allocatedItems, updatedMap, remainingMoney };
}

/**
 * 5. Đồng bộ lại hóa đơn chưa thu đủ khi điều chỉnh bảng giá phòng.
 */
export function applyRoomPricingToInvoice(
  inv: Invoice,
  update: RoomPriceUpdateItem,
  vehicleFee: number,
  oldPrice: number
): Invoice {
  const vehicleAmount = update.vehicleCount * vehicleFee;
  // Hóa đơn kỳ đầu tính theo ngày ở (tiền phòng < giá cũ) thì giữ đúng tỷ lệ ngày ở, không đổi thành nguyên tháng.
  // ponytail: suy tỷ lệ từ rentAmount/giá cũ; khi có Supabase nên lưu stayDays trên hóa đơn.
  const rentAmount =
    oldPrice > 0 && inv.rentAmount < oldPrice
      ? Math.round((inv.rentAmount * update.price) / oldPrice)
      : update.price;
  const newTotal =
    rentAmount +
    inv.elecAmount +
    inv.waterAmount +
    update.trashFee +
    update.internetFee +
    vehicleAmount;
  const newStatus: Invoice['status'] =
    inv.status === 'draft'
      ? 'draft'
      : inv.paidAmount >= newTotal
        ? 'paid'
        : inv.paidAmount > 0
          ? 'partial'
          : 'unpaid';

  return {
    ...inv,
    rentAmount,
    trashAmount: update.trashFee,
    internetAmount: update.internetFee,
    vehicleCount: update.vehicleCount,
    vehicleAmount,
    totalAmount: newTotal,
    status: newStatus,
  };
}

/**
 * 6. Tính toán quyết toán & hoàn trả tiền cọc khi thanh lý hợp đồng:
 * - Tiền cọc hoàn lại = max(0, depositAmount - depositDeducted)
 * - Khoản khấu trừ thực tế vào cọc = min(depositAmount, max(0, depositDeducted))
 * - Nếu khoản nợ/khấu trừ vượt quá tiền cọc thì ghi nhận phần khách còn phải bù thêm (extraDue).
 */
export function calculateDepositRefund(
  depositAmount: number,
  depositDeducted: number = 0
): {
  validDeposit: number;
  actualDeducted: number;
  refundAmount: number;
  extraDue: number;
} {
  const validDeposit = Math.max(0, Math.round(depositAmount || 0));
  const rawDeducted = Math.max(0, Math.round(depositDeducted || 0));
  const actualDeducted = Math.min(validDeposit, rawDeducted);
  const refundAmount = Math.max(0, validDeposit - rawDeducted);
  const extraDue = Math.max(0, rawDeducted - validDeposit);
  return {
    validDeposit,
    actualDeducted,
    refundAmount,
    extraDue,
  };
}

