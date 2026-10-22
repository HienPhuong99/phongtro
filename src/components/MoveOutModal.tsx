import React, { useEffect, useState } from 'react';
import { DoorOpen, X } from 'lucide-react';
import type { Contract, Invoice, Property, Room } from '../types';
import { planMoveOut, suggestFinalRent, type MoveOutInput } from '../utils/billing';
import { formatVND, isoToVnDate, todayVN, vnToIsoDate } from '../utils/format';

type Plan = Exclude<ReturnType<typeof planMoveOut>, { error: string }>;

/** Trả phòng / thanh lý: chốt điện nước, tiền phòng ngày cuối, khoản khấu trừ; cọc còn lại vào mục chờ hoàn. */
export const MoveOutModal: React.FC<{
  contract: Contract | null;
  room: Room | undefined;
  roomInvoices: Invoice[];
  property: Property;
  finalInvoiceCode: string;
  onClose: () => void;
  onConfirm: (plan: Plan) => void;
}> = ({ contract, room, roomInvoices, property, finalInvoiceCode, onClose, onConfirm }) => {
  const [form, setForm] = useState<MoveOutInput | null>(null);
  useEffect(() => {
    if (!contract || !room) return setForm(null);
    const date = todayVN();
    const ym = `${date.slice(6)}-${date.slice(3, 5)}`;
    const billed = roomInvoices.filter((i) => i.status !== 'draft' && i.billingMonth <= ym);
    setForm({
      moveOutDate: date,
      elecNew: Math.max(room.elecIndex, ...billed.map((i) => i.elecNew)),
      waterNew: Math.max(room.waterIndex, ...billed.map((i) => i.waterNew)),
      finalRent: suggestFinalRent({
        rentAmount: contract.rentAmount,
        moveOutDate: date,
        startDate: contract.startDate,
        monthAlreadyBilled: billed.some((i) => i.billingMonth === ym),
      }),
      otherCharges: 0,
      refundBankAccount: contract.refundBankAccount || '',
      refundBankName: contract.refundBankName || '',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.id]);
  if (!contract || !room || !form) return null;

  const plan = planMoveOut({
    contract,
    room,
    roomInvoices,
    elecRate: property.electricityRate,
    waterRate: property.waterRate,
    finalInvoiceCode,
    input: form,
  });
  const num = (key: keyof MoveOutInput, label: string) => (
    <label className="space-y-1">
      <span className="font-semibold text-slate-600">{label}</span>
      <input
        type="number"
        min={0}
        inputMode="numeric"
        value={form[key] as number}
        onChange={(e) => setForm({ ...form, [key]: Number(e.target.value) })}
        className="w-full px-3 py-2 rounded-xl border border-slate-200 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
  const row = (label: string, value: string, cls = '') => (
    <div className={`flex justify-between ${cls}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div role="dialog" aria-label={`Trả phòng ${contract.roomCode}`} className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-rose-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Trả phòng {contract.roomCode} · {contract.tenantName} · {contract.code}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="font-semibold text-slate-600">Ngày trả phòng</span>
              <input
                type="date"
                value={vnToIsoDate(form.moveOutDate)}
                onChange={(e) => setForm({ ...form, moveOutDate: isoToVnDate(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
            {num('finalRent', 'Tiền phòng những ngày cuối (đ)')}
            {num('elecNew', 'Số điện chốt (kWh)')}
            {num('waterNew', 'Số nước chốt (m3)')}
            {num('otherCharges', 'Trừ thêm: hư hỏng, dọn dẹp (đ)')}
            <span />
            <label className="space-y-1">
              <span className="font-semibold text-slate-600">Số tài khoản nhận lại cọc</span>
              <input
                value={form.refundBankAccount}
                onChange={(e) => setForm({ ...form, refundBankAccount: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
            <label className="space-y-1">
              <span className="font-semibold text-slate-600">Ngân hàng</span>
              <input
                value={form.refundBankName}
                onChange={(e) => setForm({ ...form, refundBankName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
          </div>

          {'error' in plan ? (
            <p className="text-rose-600 font-semibold">{plan.error}</p>
          ) : (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 tabular-nums">
              {row('Tiền cọc', formatVND(contract.depositMode === 'pending' ? 0 : contract.depositAmount))}
              {plan.finalInvoice &&
                row(`Hóa đơn quyết toán ${plan.finalInvoice.code}`, formatVND(plan.finalInvoice.totalAmount))}
              {row('Trừ vào cọc (nợ cũ + quyết toán + khoản khác)', `– ${formatVND(plan.deducted)}`, 'text-rose-600')}
              {row('Hoàn lại cho khách', formatVND(plan.refund), 'font-bold text-slate-900')}
              {plan.extraDue > 0 && row('Khách còn phải trả thêm', formatVND(plan.extraDue), 'font-bold text-rose-600')}
            </div>
          )}
          <p className="text-slate-500">
            Phòng chuyển về Trống, khách chuyển sang Đã dọn đi. Tiền hoàn hiện ở Tài chính → Cọc phải trả, bấm "Đã chuyển trả"
            khi chuyển xong.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-xs">
            Huỷ
          </button>
          <button
            type="button"
            disabled={'error' in plan}
            onClick={() => !('error' in plan) && onConfirm(plan)}
            className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-40"
          >
            Xác nhận trả phòng
          </button>
        </div>
      </div>
    </div>
  );
};
