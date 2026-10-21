import type { CalendarEventItem, CashTransaction, Contract, Invoice, Property, Room } from '../types.ts';
import { daysBetweenVN, parseDateVN, shiftMonth } from './format.ts';

const monthLabel = (ym: string) => `T${Number(ym.slice(5))}/${ym.slice(0, 4)}`;

/** Thu / chi / lợi nhuận `n` kỳ gần nhất (tới `curMonth`) theo sổ thu chi. */
export function buildMonthlyChart(transactions: CashTransaction[], curMonth: string, n = 5) {
  return Array.from({ length: n }, (_, i) => {
    const ym = shiftMonth(curMonth, i - n + 1);
    const tx = transactions.filter((t) => (t.isoDate || '').startsWith(ym));
    const income = tx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = tx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    return { month: monthLabel(ym), income, expense, profit: income - expense };
  });
}

/** Lịch vận hành tháng hiện tại từ dữ liệu thật: ghi số, hạn thu, hợp đồng sắp hết hạn, phòng đang sửa. */
export function buildCalendarEvents(params: {
  today: string;
  curMonth: string;
  rooms: Room[];
  invoices: Invoice[];
  contracts: Contract[];
}): CalendarEventItem[] {
  const { today, curMonth, rooms, invoices, contracts } = params;
  const [y, m] = curMonth.split('-');
  const monthYear = `${m}/${y}`;
  const fmt = (vn: string) => {
    const d = parseDateVN(vn);
    return d ? { dayOfMonth: d.getDate(), monthYear: `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}` } : null;
  };
  const events: CalendarEventItem[] = [];

  const occupied = rooms.filter((r) => r.status === 'occupied');
  if (occupied.length > 0) {
    const billed = new Set(invoices.filter((i) => i.billingMonth === curMonth && i.status !== 'draft').map((i) => i.roomCode));
    const left = occupied.filter((r) => !billed.has(r.code)).map((r) => r.code);
    events.push({
      id: `meter-${curMonth}`,
      date: `01/${monthYear}`,
      dayOfMonth: 1,
      monthYear,
      title: 'Ghi chỉ số điện nước định kỳ (Mùng 1)',
      subtitle: left.length
        ? `${occupied.length - left.length}/${occupied.length} phòng đã lập hóa đơn · còn ${left.slice(0, 6).join(', ')}${left.length > 6 ? '…' : ''}`
        : `Đã lập hóa đơn đủ ${occupied.length} phòng`,
      type: 'meter',
      actionTab: 'invoices',
    });
  }

  const unpaidByDue = new Map<string, Invoice[]>();
  for (const inv of invoices) {
    if (inv.status === 'draft' || inv.totalAmount - inv.paidAmount <= 0 || inv.billingMonth < curMonth) continue;
    unpaidByDue.set(inv.dueDate, [...(unpaidByDue.get(inv.dueDate) || []), inv]);
  }
  for (const [due, list] of unpaidByDue) {
    const f = fmt(due);
    if (!f) continue;
    const owed = list.reduce((s, i) => s + i.totalAmount - i.paidAmount, 0);
    events.push({
      id: `due-${due}`,
      date: due,
      ...f,
      title: `Hạn thanh toán ${list.length} hóa đơn kỳ ${list[0].billingMonth.slice(5)}/${list[0].billingMonth.slice(0, 4)}`,
      subtitle: `Còn phải thu: ${owed.toLocaleString('vi-VN')} đ · Gửi nhắc Zalo kèm mã VietQR`,
      type: 'due',
      actionTab: 'invoices',
    });
  }

  for (const c of contracts) {
    if (c.status !== 'active') continue;
    const left = daysBetweenVN(today, c.endDate);
    const f = fmt(c.endDate);
    if (!f || left < 0 || left > 60) continue;
    events.push({
      id: `contract-${c.id}`,
      date: c.endDate,
      ...f,
      title: `Hết hạn hợp đồng ${c.code} (Phòng ${c.roomCode})`,
      subtitle: `Khách đại diện: ${c.tenantName} · Còn ${left} ngày`,
      type: 'contract',
      roomCode: c.roomCode,
      actionTab: 'contracts',
    });
  }

  for (const r of rooms.filter((x) => x.status === 'maintenance')) {
    const f = fmt(today)!;
    events.push({
      id: `maint-${r.id}`,
      date: today,
      ...f,
      title: `Phòng ${r.code} đang sửa chữa`,
      subtitle: r.notes || 'Ghi chi phí sửa chữa vào sổ thu chi khi xong',
      type: 'maintenance',
      roomCode: r.code,
      actionTab: 'rooms',
    });
  }

  const key = (e: CalendarEventItem) => parseDateVN(e.date)?.getTime() ?? 0;
  return events.sort((a, b) => key(a) - key(b));
}

/** P1 #5: một dòng tóm tắt cho mỗi khu (đã thu kỳ này / còn nợ tới kỳ hiện tại / phòng trống). */
export function summarizeProperties(params: {
  properties: Property[];
  rooms: Room[];
  invoices: Invoice[];
  transactions: CashTransaction[];
  curMonth: string;
}) {
  const { properties, rooms, invoices, transactions, curMonth } = params;
  return properties.map((p) => {
    const pr = rooms.filter((r) => r.propertyId === p.id);
    const occupied = pr.filter((r) => r.status === 'occupied').length;
    return {
      id: p.id,
      name: p.name,
      rooms: pr.length,
      occupied,
      vacant: pr.filter((r) => r.status === 'vacant').length,
      collected: transactions
        .filter((t) => t.propertyId === p.id && t.type === 'income' && (t.isoDate || '').startsWith(curMonth))
        .reduce((s, t) => s + t.amount, 0),
      debt: invoices
        .filter((i) => i.propertyId === p.id && i.status !== 'draft' && i.billingMonth <= curMonth)
        .reduce((s, i) => s + Math.max(0, i.totalAmount - i.paidAmount), 0),
    };
  });
}
