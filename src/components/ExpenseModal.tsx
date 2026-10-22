import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { CashTransaction, Room } from '../types';
import { isoToVnDate, todayVN, vnToIsoDate } from '../utils/format';

const CATEGORIES: CashTransaction['category'][] = ['Bảo trì/Sửa chữa', 'Vệ sinh', 'Chi phí khác'];

/** Ghi một khoản chi vào sổ thu chi (thay cho 2 hộp prompt của trình duyệt). */
export const ExpenseModal: React.FC<{
  isOpen: boolean;
  propertyId: string;
  rooms: Room[];
  onClose: () => void;
  onSave: (tx: CashTransaction) => void;
}> = ({ isOpen, propertyId, rooms, onClose, onSave }) => {
  const blank = () => ({
    date: todayVN(),
    category: CATEGORIES[0],
    description: '',
    amount: 0,
    method: 'Tiền mặt' as CashTransaction['method'],
    roomCode: '',
  });
  const [form, setForm] = useState(blank);
  useEffect(() => {
    if (isOpen) setForm(blank());
  }, [isOpen]);
  if (!isOpen) return null;

  const error = !form.description.trim() ? 'Nhập nội dung khoản chi.' : form.amount <= 0 ? 'Nhập số tiền lớn hơn 0.' : '';
  const field = 'w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ghi khoản chi"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (error) return;
          onSave({
            id: `tx-manual-${Date.now()}`,
            propertyId,
            date: form.date,
            isoDate: vnToIsoDate(form.date),
            type: 'expense',
            category: form.category,
            roomCode: form.roomCode || undefined,
            description: form.description.trim(),
            amount: form.amount,
            method: form.method,
          });
        }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Ghi khoản chi</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 text-xs">
          <label className="space-y-1 col-span-2">
            <span className="font-semibold text-slate-600">Nội dung</span>
            <input
              autoFocus
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Thay bóng đèn hành lang"
              className={field}
            />
          </label>
          <label className="space-y-1">
            <span className="font-semibold text-slate-600">Số tiền (đ)</span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={form.amount || ''}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              className={`${field} tabular-nums`}
            />
          </label>
          <label className="space-y-1">
            <span className="font-semibold text-slate-600">Ngày chi</span>
            <input
              type="date"
              value={vnToIsoDate(form.date)}
              onChange={(e) => setForm({ ...form, date: isoToVnDate(e.target.value) })}
              className={field}
            />
          </label>
          <label className="space-y-1">
            <span className="font-semibold text-slate-600">Hạng mục</span>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as CashTransaction['category'] })}
              className={field}
            >
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="font-semibold text-slate-600">Trả bằng</span>
            <select
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value as CashTransaction['method'] })}
              className={field}
            >
              <option>Tiền mặt</option>
              <option>Chuyển khoản</option>
            </select>
          </label>
          <label className="space-y-1 col-span-2">
            <span className="font-semibold text-slate-600">Phòng (nếu chi cho 1 phòng)</span>
            <select value={form.roomCode} onChange={(e) => setForm({ ...form, roomCode: e.target.value })} className={field}>
              <option value="">Chi chung, không riêng phòng nào</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.code}>
                  {r.code}
                </option>
              ))}
            </select>
          </label>
          {error && form.description && <p className="col-span-2 text-rose-600 font-semibold">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-xs">
            Huỷ
          </button>
          <button
            type="submit"
            disabled={!!error}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40"
          >
            Ghi khoản chi
          </button>
        </div>
      </form>
    </div>
  );
};
