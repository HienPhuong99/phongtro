import test from 'node:test';
import assert from 'node:assert/strict';
import { planMoveOut, suggestFinalRent } from './billing.ts';
import type { Contract, Invoice, Room } from '../types.ts';

const contract = {
  id: 'c1', code: 'HD-1', propertyId: 'p1', roomCode: 'P101', tenantName: 'A', tenantPhone: '09',
  startDate: '01/03/2026', depositAmount: 3000000, depositMode: 'received_today', status: 'active',
} as Contract;
const room = { id: 'r1', propertyId: 'p1', code: 'P101', floor: 1, elecIndex: 100, waterIndex: 10, status: 'occupied', tenantName: 'A', contractCode: 'HD-1', vehicleCount: 1 } as Room;
const inv = (id: string, month: string, total: number, paid: number, status: Invoice['status'], elecNew = 100, waterNew = 10) =>
  ({ id, code: id, billingMonth: month, totalAmount: total, paidAmount: paid, status, elecNew, waterNew }) as Invoice;
const input = { moveOutDate: '15/11/2026', elecNew: 150, waterNew: 12, finalRent: 1500000, otherCharges: 200000, refundBankAccount: ' 0123 ', refundBankName: 'VCB' };
const run = (over: Partial<typeof input> = {}, invoices: Invoice[] = []) =>
  planMoveOut({ contract, room, roomInvoices: invoices, elecRate: 3000, waterRate: 20000, finalInvoiceCode: 'HD-IV-9', input: { ...input, ...over } });

test('trả phòng: cọc trừ nợ cũ trước, rồi hóa đơn quyết toán, rồi khoản khác; còn lại hoàn khách', () => {
  const old = inv('i-old', '2026-10', 500000, 0, 'unpaid', 120, 11);
  const r = run({}, [old, inv('i-draft', '2026-12', 0, 0, 'draft'), inv('i-dec', '2026-12', 2000000, 0, 'unpaid'), inv('i-dec-paid', '2026-12', 2000000, 100, 'partial')]);
  assert.ok(!('error' in r));
  // quyết toán: 1.500.000 + (150-120)*3000 + (12-11)*20000 = 1.610.000
  assert.equal(r.finalInvoice!.totalAmount, 1610000);
  assert.equal(r.finalInvoice!.elecOld, 120);
  assert.equal(r.finalInvoice!.status, 'paid');
  assert.deepEqual(r.invoiceUpdates['i-old'], { addPaid: 500000, newStatus: 'paid' });
  assert.equal(r.deducted, 500000 + 1610000 + 200000);
  assert.equal(r.refund, 3000000 - 2310000);
  assert.equal(r.extraDue, 0);
  assert.deepEqual(r.removeInvoiceIds, ['i-draft', 'i-dec']);
  assert.equal(r.contract.status, 'terminated');
  assert.equal(r.contract.depositRefundAmount, 690000);
  assert.equal(r.contract.refundBankAccount, '0123');
  assert.equal(r.room.status, 'vacant');
  assert.equal(r.room.tenantName, undefined);
  assert.equal(r.room.elecIndex, 150);
});

test('trả phòng: nợ vượt cọc thì không hoàn, ghi phần khách còn thiếu', () => {
  const r = run({ otherCharges: 1000000 }, [inv('i-old', '2026-10', 2000000, 0, 'unpaid')]);
  assert.ok(!('error' in r));
  assert.equal(r.refund, 0);
  assert.equal(r.deducted, 3000000);
  // nợ: 2.000.000 + quyết toán 1.500.000+150.000+40.000 = 3.690.000; cọc trừ 3.000.000 -> còn 690.000 + khoản khác 1.000.000
  assert.equal(r.extraDue, 690000 + 1000000);
  assert.equal(r.finalInvoice!.status, 'partial');
});

test('trả phòng: chặn số điện/nước lùi, ngày sai; cọc chưa nhận thì không trừ được', () => {
  assert.ok('error' in run({ elecNew: 99 }));
  assert.ok('error' in run({ moveOutDate: '31/02/2026x' }));
  const r = planMoveOut({ contract: { ...contract, depositMode: 'pending' }, room, roomInvoices: [], elecRate: 3000, waterRate: 20000, finalInvoiceCode: 'X', input: { ...input, otherCharges: 0 } });
  assert.ok(!('error' in r));
  assert.equal(r.refund, 0);
  assert.equal(r.extraDue, r.finalInvoice!.totalAmount);
});

test('suggestFinalRent: tính theo ngày ở trong tháng trả phòng', () => {
  assert.equal(suggestFinalRent({ rentAmount: 3000000, moveOutDate: '15/11/2026', startDate: '01/03/2026', monthAlreadyBilled: false }), 1500000);
  assert.equal(suggestFinalRent({ rentAmount: 3000000, moveOutDate: '15/11/2026', startDate: '11/11/2026', monthAlreadyBilled: false }), 500000);
  assert.equal(suggestFinalRent({ rentAmount: 3000000, moveOutDate: '15/11/2026', startDate: '01/03/2026', monthAlreadyBilled: true }), 0);
});

test('nextCode: lấy số lớn nhất + 1, không đếm số lượng', async () => {
  const { nextCode } = await import('./billing.ts');
  assert.equal(nextCode('HD-IV-', ['HD-IV-00128', 'HD-IV-00101', 'NO-P101'], 100), 'HD-IV-00129');
  assert.equal(nextCode('HD-IV-', [], 100), 'HD-IV-00100');
  assert.equal(nextCode('HD-', ['HD-00002', 'HD-IV-00500']), 'HD-00003');
});
