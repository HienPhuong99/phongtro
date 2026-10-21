import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCalendarEvents, buildMonthlyChart } from './insights.ts';
import type { CashTransaction, Contract, Invoice, Room } from '../types.ts';

test('buildMonthlyChart: 5 kỳ gần nhất, qua năm, kỳ không có giao dịch = 0', () => {
  const tx = [
    { isoDate: '2027-01-05', type: 'income', amount: 3000000 },
    { isoDate: '2027-01-09', type: 'expense', amount: 500000 },
    { isoDate: '2026-12-31', type: 'income', amount: 1000000 },
    { isoDate: '2026-08-01', type: 'income', amount: 9 },
  ] as CashTransaction[];
  const chart = buildMonthlyChart(tx, '2027-01');
  assert.deepEqual(chart.map((c) => c.month), ['T9/2026', 'T10/2026', 'T11/2026', 'T12/2026', 'T1/2027']);
  assert.deepEqual(chart[4], { month: 'T1/2027', income: 3000000, expense: 500000, profit: 2500000 });
  assert.equal(chart[3].income, 1000000);
  assert.equal(chart[0].income, 0);
});

test('buildCalendarEvents: ghi số, hạn thu gom theo ngày, hợp đồng sắp hết hạn, phòng sửa; xếp theo ngày', () => {
  const rooms = [
    { id: 'r1', code: 'P101', status: 'occupied' },
    { id: 'r2', code: 'P102', status: 'occupied' },
    { id: 'r3', code: 'P103', status: 'maintenance', notes: 'Thay ống nước' },
  ] as Room[];
  const invoices = [
    { roomCode: 'P101', billingMonth: '2026-10', status: 'unpaid', totalAmount: 3000000, paidAmount: 1000000, dueDate: '10/10/2026' },
    { roomCode: 'P102', billingMonth: '2026-09', status: 'unpaid', totalAmount: 5, paidAmount: 0, dueDate: '10/09/2026' },
  ] as Invoice[];
  const contracts = [
    { id: 'c1', code: 'HD-1', roomCode: 'P101', tenantName: 'An', status: 'active', endDate: '15/11/2026' },
    { id: 'c2', code: 'HD-2', roomCode: 'P102', tenantName: 'Bình', status: 'active', endDate: '15/06/2027' },
  ] as Contract[];
  const ev = buildCalendarEvents({ today: '11/10/2026', curMonth: '2026-10', rooms, invoices, contracts });
  assert.deepEqual(ev.map((e) => e.type), ['meter', 'due', 'maintenance', 'contract']);
  assert.match(ev[0].subtitle, /1\/2 phòng đã lập hóa đơn · còn P102/);
  assert.match(ev[1].subtitle, /2\.000\.000/);
  assert.equal(ev[3].title, 'Hết hạn hợp đồng HD-1 (Phòng P101)');
  assert.match(ev[3].subtitle, /Còn 35 ngày/);
});
