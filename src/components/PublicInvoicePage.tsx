import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Home, Loader2 } from 'lucide-react';
import { supabase } from '../utils/supabase';
import { formatVND, getVietQrUrl } from '../utils/format';

/** Dữ liệu RPC `get_public_invoice` trả về (đã bỏ SĐT, CCCD, tên khách). */
interface PublicInvoice {
  invoice: {
    code: string;
    roomCode: string;
    billingMonth: string;
    periodLabel: string;
    issueDate: string;
    dueDate: string;
    rentAmount: number;
    elecOld: number;
    elecNew: number;
    elecUsage: number;
    elecAmount: number;
    waterOld: number;
    waterNew: number;
    waterUsage: number;
    waterAmount: number;
    trashAmount: number;
    internetAmount: number;
    vehicleCount: number;
    vehicleAmount: number;
    totalAmount: number;
    paidAmount: number;
    meterPhoto?: string;
  };
  property: {
    name: string;
    address: string;
    bankBin: string;
    bankName: string;
    bankAccount: string;
    bankOwner: string;
  } | null;
  payments: { date: string; amount: number }[];
  reports: { amount: number; createdAt: string; status: string }[];
}

const ERRORS: Record<string, string> = {
  INVOICE_NOT_FOUND: 'Không tìm thấy hóa đơn. Link có thể đã hết hiệu lực, hãy hỏi lại chủ trọ.',
  TOO_MANY_REPORTS: 'Bạn đã báo nhiều lần trong hôm nay. Chủ trọ sẽ kiểm tra và xác nhận.',
  NOTE_TOO_LONG: 'Ghi chú tối đa 40 ký tự.',
  INVALID_AMOUNT: 'Số tiền không hợp lệ.',
};
const readError = (msg: string) =>
  Object.entries(ERRORS).find(([code]) => msg.includes(code))?.[1] ||
  'Không kết nối được máy chủ, vui lòng thử lại sau.';

/**
 * P1 #1: trang hóa đơn người thuê mở từ Zalo (`?hd=<mã ngẫu nhiên>`).
 * "Tôi đã chuyển" chỉ là lời báo, chủ trọ đối chiếu số dư rồi mới xác nhận gạch nợ.
 */
export const PublicInvoicePage: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<PublicInvoice | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    const { data: res, error: err } = await supabase.rpc('get_public_invoice', { p_token: token });
    setLoading(false);
    if (err) return setError(readError(err.message));
    if (!res) return setError(ERRORS.INVOICE_NOT_FOUND);
    const inv = res as PublicInvoice;
    setData(inv);
    setAmount(Math.max(0, inv.invoice.totalAmount - inv.invoice.paidAmount));
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const report = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    const { data: res, error: err } = await supabase.rpc('report_invoice_paid', {
      p_token: token,
      p_amount: Math.round(amount),
      p_note: note.trim() || null,
    });
    setSending(false);
    if (err) return setError(readError(err.message));
    setData(res as PublicInvoice);
    setSent(true);
  };

  if (loading && !data) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-slate-50 text-slate-500 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Đang tải hóa đơn...
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-slate-50 p-6 text-center gap-3">
        <p className="text-sm text-rose-700">{error}</p>
        <button type="button" onClick={load} className="px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold">
          Tải lại
        </button>
      </div>
    );
  }

  const inv = data.invoice;
  const p = data.property;
  const remaining = Math.max(0, inv.totalAmount - inv.paidAmount);
  const [y, m] = inv.billingMonth.split('-');
  const lines: [string, number][] = [
    ['Tiền phòng', inv.rentAmount],
    [`Điện ${inv.elecUsage} kWh (${inv.elecOld} → ${inv.elecNew})`, inv.elecAmount],
    [`Nước ${inv.waterUsage} m3 (${inv.waterOld} → ${inv.waterNew})`, inv.waterAmount],
    ['Rác', inv.trashAmount],
    ['Internet', inv.internetAmount],
    [`Gửi xe (${inv.vehicleCount} xe)`, inv.vehicleAmount],
  ];
  const pendingReports = data.reports.filter((r) => r.status === 'pending');

  return (
    <main className="min-h-dvh bg-slate-50 px-4 py-6 text-slate-900">
      <div className="max-w-md mx-auto space-y-4">
        <header className="flex items-center gap-2">
          <Home className="w-5 h-5 text-blue-600" />
          <div>
            <h1 className="text-base font-bold">
              Hóa đơn phòng {inv.roomCode} · tháng {m}/{y}
            </h1>
            <p className="text-xs text-slate-500">
              {p?.name}
              {p?.address ? ` · ${p.address}` : ''}
            </p>
          </div>
        </header>

        <section className="bg-white rounded-2xl border border-slate-200 p-4 text-sm space-y-1.5 tabular-nums">
          <div className="text-xs text-slate-500 mb-1">
            {inv.code} · {inv.periodLabel} · Hạn {inv.dueDate}
          </div>
          {lines
            .filter(([, v]) => v > 0)
            .map(([label, v]) => (
              <div key={label} className="flex justify-between gap-3">
                <span className="text-slate-600">{label}</span>
                <span>{formatVND(v)}</span>
              </div>
            ))}
          <div className="flex justify-between font-semibold border-t border-slate-100 pt-1.5">
            <span>Tổng</span>
            <span>{formatVND(inv.totalAmount)}</span>
          </div>
          {inv.paidAmount > 0 && (
            <div className="flex justify-between text-emerald-700">
              <span>Đã trả</span>
              <span>-{formatVND(inv.paidAmount)}</span>
            </div>
          )}
          <div className={`flex justify-between text-base font-extrabold ${remaining > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            <span>{remaining > 0 ? 'Còn phải trả' : 'Đã thanh toán đủ'}</span>
            <span>{formatVND(remaining)}</span>
          </div>
        </section>

        {remaining > 0 && p && p.bankAccount && (
          <section className="bg-white rounded-2xl border border-slate-200 p-4 text-center space-y-2">
            <img
              src={getVietQrUrl({
                bankBin: p.bankBin,
                bankAccount: p.bankAccount,
                bankOwner: p.bankOwner,
                amount: remaining,
                addInfo: `Thanh toan ${inv.roomCode} ${inv.code}`,
              })}
              alt="Mã VietQR chuyển khoản"
              className="w-56 h-56 mx-auto"
            />
            <p className="text-xs text-slate-600">
              {p.bankName} · {p.bankAccount} · {p.bankOwner}
              <br />
              Nội dung: <strong>Thanh toan {inv.roomCode} {inv.code}</strong>
            </p>
          </section>
        )}

        {inv.meterPhoto && (
          <section className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="text-xs font-semibold mb-2">Ảnh đồng hồ</div>
            <img src={inv.meterPhoto} alt="Ảnh đồng hồ điện nước" className="w-full rounded-xl" />
          </section>
        )}

        {(data.payments.length > 0 || data.reports.length > 0) && (
          <section className="bg-white rounded-2xl border border-slate-200 p-4 text-xs space-y-1 tabular-nums">
            <div className="font-semibold mb-1">Lịch sử</div>
            {data.payments.map((pm, i) => (
              <div key={`p${i}`} className="flex justify-between">
                <span>{pm.date} · Chủ trọ đã xác nhận</span>
                <span className="text-emerald-700">{formatVND(pm.amount)}</span>
              </div>
            ))}
            {data.reports.map((r, i) => (
              <div key={`r${i}`} className="flex justify-between text-slate-500">
                <span>
                  {new Date(r.createdAt).toLocaleDateString('vi-VN')} · Bạn báo đã chuyển
                  {r.status === 'pending' ? ' (chờ chủ trọ xác nhận)' : r.status === 'confirmed' ? ' (đã xác nhận)' : ''}
                </span>
                <span>{formatVND(r.amount)}</span>
              </div>
            ))}
          </section>
        )}

        {remaining > 0 && (
          <form onSubmit={report} className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3 text-sm">
            {sent || pendingReports.length > 0 ? (
              <p className="flex items-center gap-2 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Đã báo chủ trọ. Hóa đơn được gạch khi chủ trọ xác nhận đã nhận tiền.
              </p>
            ) : (
              <p className="text-xs text-slate-500">Chuyển khoản xong? Báo cho chủ trọ biết để họ kiểm tra.</p>
            )}
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Số tiền đã chuyển (đ)</span>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 tabular-nums"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold">Người chuyển hộ (không bắt buộc)</span>
              <input
                type="text"
                maxLength={40}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Mẹ chuyển hộ"
                className="w-full px-3 py-2 rounded-xl border border-slate-200"
              />
            </label>
            {error && <p className="text-xs text-rose-700">{error}</p>}
            <button
              type="submit"
              disabled={sending || amount <= 0}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold disabled:opacity-50"
            >
              {sending ? 'Đang gửi...' : 'Tôi đã chuyển'}
            </button>
          </form>
        )}
      </div>
    </main>
  );
};
