import React, { useEffect, useState } from 'react';
import { Pencil, Trash2, X } from 'lucide-react';
import type { Invoice } from '../types';
import { applyInvoiceEdit, type InvoiceEdit } from '../utils/billing';
import { formatVND } from '../utils/format';

const FIELDS: { key: keyof InvoiceEdit; label: string; unit: string }[] = [
  { key: 'rentAmount', label: 'Tiền phòng', unit: 'đ' },
  { key: 'elecOld', label: 'Điện cũ', unit: 'kWh' },
  { key: 'elecNew', label: 'Điện mới', unit: 'kWh' },
  { key: 'waterOld', label: 'Nước cũ', unit: 'm3' },
  { key: 'waterNew', label: 'Nước mới', unit: 'm3' },
  { key: 'trashAmount', label: 'Phí rác', unit: 'đ' },
  { key: 'internetAmount', label: 'Wifi', unit: 'đ' },
  { key: 'vehicleAmount', label: 'Gửi xe', unit: 'đ' },
];

const pick = (inv: Invoice): InvoiceEdit => ({
  rentAmount: inv.rentAmount,
  elecOld: inv.elecOld,
  elecNew: inv.elecNew,
  waterOld: inv.waterOld,
  waterNew: inv.waterNew,
  trashAmount: inv.trashAmount,
  internetAmount: inv.internetAmount,
  vehicleAmount: inv.vehicleAmount,
});

/** P1 #2: chủ trọ tự sửa / huỷ hóa đơn, không cần gọi hỗ trợ. */
export const InvoiceEditModal: React.FC<{
  invoice: Invoice | null;
  onClose: () => void;
  onSave: (inv: Invoice) => void;
  onCancelInvoice: (inv: Invoice) => void;
}> = ({ invoice, onClose, onSave, onCancelInvoice }) => {
  const [form, setForm] = useState<InvoiceEdit | null>(null);
  useEffect(() => setForm(invoice ? pick(invoice) : null), [invoice]);
  if (!invoice || !form) return null;

  const result = applyInvoiceEdit(invoice, form);
  const error = 'error' in result ? result.error : '';
  const preview = 'invoice' in result ? result.invoice : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div
        role="dialog"
        aria-label={`Sửa hóa đơn ${invoice.code}`}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Sửa hóa đơn {invoice.code} · Phòng {invoice.roomCode}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            {FIELDS.map((f) => (
              <label key={f.key} className="space-y-1">
                <span className="font-semibold text-slate-600">
                  {f.label} ({f.unit})
                </span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1 tabular-nums">
            <div className="flex justify-between">
              <span>Tổng cũ</span>
              <span>{formatVND(invoice.totalAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900">
              <span>Tổng mới</span>
              <span>{preview ? formatVND(preview.totalAmount) : '—'}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Khách đã trả</span>
              <span>{formatVND(invoice.paidAmount)}</span>
            </div>
          </div>
          {error && <p className="text-rose-600 font-semibold">{error}</p>}
          {preview && preview.totalAmount !== invoice.totalAmount && invoice.sentZalo && (
            <p className="text-amber-700">Phiếu đã gửi khách sẽ được đánh dấu "chưa gửi" để bạn gửi lại phiếu mới.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-t border-slate-100">
          <button
            type="button"
            disabled={invoice.paidAmount > 0}
            title={invoice.paidAmount > 0 ? 'Hóa đơn đã thu tiền, không huỷ được' : ''}
            onClick={() => {
              if (window.confirm(`Huỷ hóa đơn ${invoice.code}? Chỉ số đồng hồ của phòng sẽ quay về số cũ.`)) {
                onCancelInvoice(invoice);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 border border-rose-200 hover:bg-rose-50 font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Huỷ hóa đơn
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-xs">
              Đóng
            </button>
            <button
              type="button"
              disabled={!preview}
              onClick={() => preview && onSave(preview)}
              className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40"
            >
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
