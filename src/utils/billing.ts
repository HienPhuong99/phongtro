import type { Contract, FifoAllocatedItem, Invoice, Room, RoomPriceUpdateItem } from '../types.ts';
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


/** Các ô chủ trọ được tự sửa trên hóa đơn đã lập. */
export type InvoiceEdit = Pick<
  Invoice,
  | 'rentAmount'
  | 'elecOld'
  | 'elecNew'
  | 'waterOld'
  | 'waterNew'
  | 'trashAmount'
  | 'internetAmount'
  | 'vehicleAmount'
>;

/**
 * 7. Sửa hóa đơn đã lập: tính lại điện nước + tổng, đánh dấu cần gửi lại phiếu.
 * Không cho tổng mới nhỏ hơn số khách đã trả (phải hoàn tiền trước).
 */
export function applyInvoiceEdit(
  inv: Invoice,
  edit: InvoiceEdit
): { invoice: Invoice } | { error: string } {
  const vals = Object.values(edit);
  if (vals.some((v) => !Number.isFinite(v) || v < 0)) return { error: 'Số tiền và chỉ số không được âm.' };
  if (edit.elecNew < edit.elecOld) return { error: 'Chỉ số điện mới nhỏ hơn chỉ số cũ.' };
  if (edit.waterNew < edit.waterOld) return { error: 'Chỉ số nước mới nhỏ hơn chỉ số cũ.' };
  const calc = calculateInvoiceFromReadings({ ...inv, ...edit }, edit);
  if (calc.totalAmount < inv.paidAmount) {
    return { error: 'Tổng mới nhỏ hơn số khách đã trả. Hoàn lại phần thừa cho khách trước khi giảm.' };
  }
  const changed = calc.totalAmount !== inv.totalAmount;
  return {
    invoice: {
      ...inv,
      ...edit,
      ...calc,
      status: inv.status === 'draft' ? 'draft' : calc.status,
      sentZalo: changed ? false : inv.sentZalo,
    },
  };
}

/**
 * 8. Tính lại cơ cấu giá khi hạ giá điện về đúng giá bán lẻ (NĐ 133/2026):
 * số kWh trung bình mỗi phòng (tối đa `months` hóa đơn gần nhất) × phần giá bị hạ
 * được bù vào tiền phòng (làm tròn lên `roundTo`), để thu nhập gần như không đổi.
 */
export function planElectricityRestructure(params: {
  rooms: Pick<Room, 'code' | 'price' | 'status'>[];
  invoices: Pick<Invoice, 'roomCode' | 'billingMonth' | 'elecUsage' | 'status'>[];
  oldRate: number;
  newRate: number;
  months?: number;
  roundTo?: number;
}) {
  const { rooms, invoices, oldRate, newRate, months = 3, roundTo = 10000 } = params;
  const cut = Math.max(0, oldRate - newRate);
  const items = rooms
    .filter((r) => r.status !== 'maintenance')
    .map((r) => {
      const recent = invoices
        .filter((i) => i.roomCode === r.code && i.status !== 'draft')
        .sort((a, b) => b.billingMonth.localeCompare(a.billingMonth))
        .slice(0, months);
      const avgKwh = recent.length
        ? Math.round(recent.reduce((s, i) => s + i.elecUsage, 0) / recent.length)
        : 0;
      const lost = avgKwh * cut;
      const rentIncrease = lost > 0 ? Math.ceil(lost / roundTo) * roundTo : 0;
      return {
        roomCode: r.code,
        avgKwh,
        oldElec: avgKwh * oldRate,
        newElec: avgKwh * newRate,
        rentIncrease,
        oldRent: r.price,
        newRent: r.price + rentIncrease,
      };
    });
  const sum = (k: 'oldElec' | 'newElec' | 'rentIncrease') => items.reduce((s, i) => s + i[k], 0);
  return {
    items,
    totalOldElec: sum('oldElec'),
    totalNewElec: sum('newElec'),
    totalRentIncrease: sum('rentIncrease'),
    /** Thu nhập tháng thay đổi (dương = nhiều hơn trước một chút do làm tròn). */
    incomeDelta: sum('newElec') + sum('rentIncrease') - sum('oldElec'),
  };
}

/** Tiền phòng gợi ý cho những ngày ở cuối: từ đầu tháng (hoặc ngày vào ở nếu muộn hơn) tới ngày trả phòng. */
export function suggestFinalRent(params: {
  rentAmount: number;
  moveOutDate: string;
  startDate: string;
  monthAlreadyBilled: boolean;
}): number {
  const out = parseDateVN(params.moveOutDate);
  if (!out || params.monthAlreadyBilled) return 0;
  const start = parseDateVN(params.startDate);
  const from =
    start && start.getFullYear() === out.getFullYear() && start.getMonth() === out.getMonth() ? start.getDate() : 1;
  const daysInMonth = new Date(out.getFullYear(), out.getMonth() + 1, 0).getDate();
  const days = Math.max(0, out.getDate() - from + 1);
  return Math.round((params.rentAmount * days) / daysInMonth);
}

export interface MoveOutInput {
  moveOutDate: string; // DD/MM/YYYY
  elecNew: number;
  waterNew: number;
  finalRent: number;
  otherCharges: number;
  refundBankAccount: string;
  refundBankName: string;
}

/**
 * 7. Trả phòng / thanh lý hợp đồng.
 * Cọc trừ vào nợ theo FIFO (gồm hóa đơn quyết toán cuối), rồi tới khoản khác (hư hỏng, dọn dẹp);
 * phần còn lại phải hoàn cho khách. Không ghi sổ thu: cọc đã ghi thu lúc nhận, phần hoàn ghi chi khi chuyển trả.
 */
export function planMoveOut(params: {
  contract: Contract;
  room: Room;
  roomInvoices: Invoice[];
  elecRate: number;
  waterRate: number;
  finalInvoiceCode: string;
  input: MoveOutInput;
}):
  | { error: string }
  | {
      contract: Contract;
      room: Room;
      finalInvoice: Invoice | null;
      invoiceUpdates: Record<string, { addPaid: number; newStatus: Invoice['status'] }>;
      removeInvoiceIds: string[];
      deducted: number;
      refund: number;
      extraDue: number;
    } {
  const { contract, room, roomInvoices, input } = params;
  const out = parseDateVN(input.moveOutDate);
  if (!out) return { error: 'Ngày trả phòng không hợp lệ.' };
  const ymOut = `${out.getFullYear()}-${String(out.getMonth() + 1).padStart(2, '0')}`;
  // Nháp và hóa đơn chưa thu đồng nào của các tháng sau ngày trả phòng: khách không ở nữa, bỏ đi.
  const dropped = (i: Invoice) => i.paidAmount === 0 && (i.status === 'draft' || i.billingMonth > ymOut);
  // Cọc chỉ trừ vào hóa đơn tới tháng trả phòng; hóa đơn tháng sau đã thu một phần thì để chủ trọ tự xử lý.
  const billed = roomInvoices.filter((i) => i.status !== 'draft' && i.billingMonth <= ymOut);
  const elecOld = Math.max(room.elecIndex, ...billed.map((i) => i.elecNew));
  const waterOld = Math.max(room.waterIndex, ...billed.map((i) => i.waterNew));
  if (input.elecNew < elecOld) return { error: `Số điện chốt phải từ ${elecOld} trở lên.` };
  if (input.waterNew < waterOld) return { error: `Số nước chốt phải từ ${waterOld} trở lên.` };
  if (input.finalRent < 0 || input.otherCharges < 0) return { error: 'Số tiền không được âm.' };

  const elecUsage = input.elecNew - elecOld;
  const waterUsage = input.waterNew - waterOld;
  const finalTotal = input.finalRent + elecUsage * params.elecRate + waterUsage * params.waterRate;
  const finalInvoice: Invoice | null =
    finalTotal > 0
      ? {
          id: `inv-moveout-${contract.id}`,
          code: params.finalInvoiceCode,
          propertyId: contract.propertyId,
          roomCode: contract.roomCode,
          floor: room.floor,
          tenantName: contract.tenantName,
          tenantPhone: contract.tenantPhone,
          contractCode: contract.code,
          billingMonth: ymOut,
          periodLabel: `Quyết toán trả phòng ${input.moveOutDate}`,
          issueDate: input.moveOutDate,
          dueDate: input.moveOutDate,
          rentAmount: input.finalRent,
          elecOld,
          elecNew: input.elecNew,
          elecUsage,
          elecRate: params.elecRate,
          elecAmount: elecUsage * params.elecRate,
          waterOld,
          waterNew: input.waterNew,
          waterUsage,
          waterRate: params.waterRate,
          waterAmount: waterUsage * params.waterRate,
          trashAmount: 0,
          internetAmount: 0,
          vehicleCount: 0,
          vehicleAmount: 0,
          totalAmount: finalTotal,
          paidAmount: 0,
          status: 'unpaid',
          sentZalo: false,
          isOverdue: false,
        }
      : null;

  const removeInvoiceIds = roomInvoices.filter(dropped).map((i) => i.id);
  const open = [...billed, ...(finalInvoice ? [finalInvoice] : [])];
  const deposit = contract.depositMode === 'pending' ? 0 : Math.max(0, contract.depositAmount);
  const fifo = allocatePaymentFIFO(open, deposit);
  const allocated = deposit - fifo.remainingMoney;
  const fromOther = Math.min(input.otherCharges, fifo.remainingMoney);
  const deducted = allocated + fromOther;
  const refund = deposit - deducted;
  const invoiceDebtLeft = open.reduce((s, i) => s + i.totalAmount - i.paidAmount, 0) - allocated;
  const extraDue = invoiceDebtLeft + (input.otherCharges - fromOther);
  // Phần cọc trừ vào hóa đơn quyết toán ghi luôn vào hóa đơn mới, không để App phải tìm id chưa tồn tại.
  const finalUp = finalInvoice ? fifo.updatedMap[finalInvoice.id] : undefined;
  const invoiceUpdates = { ...fifo.updatedMap };
  if (finalInvoice) delete invoiceUpdates[finalInvoice.id];
  const finalInvoiceOut =
    finalInvoice && finalUp
      ? { ...finalInvoice, paidAmount: finalUp.addPaid, status: finalUp.newStatus }
      : finalInvoice;

  return {
    contract: {
      ...contract,
      status: 'terminated',
      moveOutDate: input.moveOutDate,
      daysRemaining: 0,
      depositDeducted: deducted,
      depositRefundAmount: refund,
      depositRefunded: refund === 0,
      refundBankAccount: input.refundBankAccount.trim(),
      refundBankName: input.refundBankName.trim(),
    },
    room: {
      ...room,
      status: 'vacant',
      tenantId: undefined,
      tenantName: undefined,
      tenantPhone: undefined,
      contractCode: undefined,
      vehicleCount: 0,
      elecIndex: input.elecNew,
      waterIndex: input.waterNew,
    },
    finalInvoice: finalInvoiceOut,
    invoiceUpdates,
    removeInvoiceIds,
    deducted,
    refund,
    extraDue,
  };
}

/** Mã kế tiếp theo số lớn nhất đang có (đếm số lượng thì trùng mã khi đã xoá bớt hoặc nhập từ file). */
export function nextCode(prefix: string, codes: string[], min = 1): string {
  const re = new RegExp(`^${prefix}([0-9]+)$`);
  const max = codes.reduce((m, c) => Math.max(m, Number(re.exec(c)?.[1] ?? 0)), min - 1);
  return `${prefix}${String(max + 1).padStart(5, '0')}`;
}
