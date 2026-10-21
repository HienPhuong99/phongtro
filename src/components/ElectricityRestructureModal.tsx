import React, { useEffect, useMemo, useState } from 'react';
import { Printer, X, Zap } from 'lucide-react';
import type { Contract, Invoice, Property, Room } from '../types';
import { planElectricityRestructure } from '../utils/billing';
import { formatVND } from '../utils/format';

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** P1 #3: hạ giá điện về đúng giá bán lẻ, bù vào tiền phòng, in phụ lục hợp đồng. */
export const ElectricityRestructureModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  rooms: Room[];
  invoices: Invoice[];
  contracts: Contract[];
  rateCap: number;
  effectiveDate: string; // DD/MM/YYYY
  onApply: (newRate: number, rentIncreaseByRoom: Record<string, number>) => void;
}> = ({ isOpen, onClose, property, rooms, invoices, contracts, rateCap, effectiveDate, onApply }) => {
  const [newRate, setNewRate] = useState(Math.min(rateCap, property.electricityRate));
  const [roundTo, setRoundTo] = useState(10000);
  useEffect(() => {
    if (isOpen) setNewRate(Math.min(rateCap, property.electricityRate));
  }, [isOpen, property.id, property.electricityRate, rateCap]);

  const plan = useMemo(
    () =>
      planElectricityRestructure({
        rooms,
        invoices,
        oldRate: property.electricityRate,
        newRate,
        roundTo,
      }),
    [rooms, invoices, property.electricityRate, newRate, roundTo]
  );
  if (!isOpen) return null;

  const increaseByRoom = Object.fromEntries(plan.items.map((i) => [i.roomCode, i.rentIncrease]));
  const active = contracts.filter((c) => c.status === 'active');

  const printAnnex = () => {
    const pages = active
      .map((c) => {
        const inc = increaseByRoom[c.roomCode] || 0;
        return `<section>
<h2>PHỤ LỤC HỢP ĐỒNG THUÊ PHÒNG</h2>
<p class="c">(Kèm theo hợp đồng số ${esc(c.code)})</p>
<p>Bên cho thuê: ${esc(property.bankOwner || property.name)} — ${esc(property.name)}${property.address ? ', ' + esc(property.address) : ''}</p>
<p>Bên thuê: ${esc(c.tenantName)} — Phòng ${esc(c.roomCode)}</p>
<p>Hai bên thống nhất điều chỉnh từ ngày <b>${esc(effectiveDate)}</b>:</p>
<ol>
<li>Giá điện: <b>${formatVND(newRate)}/kWh</b> (trước đây ${formatVND(property.electricityRate)}/kWh), không cao hơn giá bán lẻ điện sinh hoạt theo quy định.</li>
<li>Tiền thuê phòng: <b>${formatVND(c.rentAmount + inc)}/tháng</b> (trước đây ${formatVND(c.rentAmount)}/tháng).</li>
<li>Các điều khoản khác của hợp đồng giữ nguyên.</li>
</ol>
<table><tr><td>BÊN CHO THUÊ<br/><br/><br/><br/></td><td>BÊN THUÊ<br/><br/><br/><br/>${esc(c.tenantName)}</td></tr></table>
</section>`;
      })
      .join('');
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Phụ lục hợp đồng — ${esc(property.name)}</title>
<style>body{font-family:'Times New Roman',serif;font-size:14pt;margin:2cm}h2{text-align:center;margin:0}.c{text-align:center;margin-top:4px}
section{page-break-after:always}table{width:100%;margin-top:32px;text-align:center}</style></head><body>${pages}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div role="dialog" aria-label="Tính lại cơ cấu giá điện" className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-slate-900">Tính lại cơ cấu giá điện · {property.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng" className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs overflow-y-auto">
          <p className="text-slate-600">
            Hạ giá điện về đúng giá bán lẻ (tránh phạt 20–30 triệu theo NĐ 133/2026). Phần chênh lệch tính theo số kWh trung bình 3 kỳ gần nhất của từng phòng và cộng vào tiền phòng, để thu nhập gần như không đổi. Áp dụng từ {effectiveDate}, không đổi hóa đơn đã lập.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="font-semibold text-slate-600 mb-1">Giá điện hiện tại</div>
              <div className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 font-bold tabular-nums">{formatVND(property.electricityRate)}</div>
            </div>
            <label>
              <div className="font-semibold text-slate-600 mb-1">Giá điện mới (đ/kWh)</div>
              <input
                type="number"
                min={0}
                value={newRate}
                onChange={(e) => setNewRate(Number(e.target.value))}
                className={`w-full px-3 py-2 rounded-xl border tabular-nums ${newRate > rateCap ? 'border-amber-400' : 'border-slate-200'}`}
              />
            </label>
            <label>
              <div className="font-semibold text-slate-600 mb-1">Làm tròn tiền phòng</div>
              <select value={roundTo} onChange={(e) => setRoundTo(Number(e.target.value))} className="w-full px-3 py-2 rounded-xl border border-slate-200">
                <option value={1000}>1.000 đ</option>
                <option value={10000}>10.000 đ</option>
                <option value={50000}>50.000 đ</option>
              </select>
            </label>
          </div>
          {newRate > rateCap && (
            <p className="text-amber-700">Vẫn cao hơn giá bán lẻ bậc cao nhất {formatVND(rateCap)}/kWh.</p>
          )}

          <table className="w-full tabular-nums">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-100">
                <th className="py-2">Phòng</th>
                <th className="py-2 text-right">kWh TB</th>
                <th className="py-2 text-right">Tiền điện cũ</th>
                <th className="py-2 text-right">Tiền điện mới</th>
                <th className="py-2 text-right">Tiền phòng mới</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plan.items.map((i) => (
                <tr key={i.roomCode}>
                  <td className="py-1.5 font-bold">{i.roomCode}</td>
                  <td className="py-1.5 text-right">{i.avgKwh}</td>
                  <td className="py-1.5 text-right">{formatVND(i.oldElec)}</td>
                  <td className="py-1.5 text-right">{formatVND(i.newElec)}</td>
                  <td className="py-1.5 text-right">
                    {formatVND(i.newRent)}
                    {i.rentIncrease > 0 && <span className="text-emerald-600"> (+{formatVND(i.rentIncrease)})</span>}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold border-t-2 border-slate-200">
                <td className="py-2" colSpan={2}>Mỗi tháng</td>
                <td className="py-2 text-right">{formatVND(plan.totalOldElec)}</td>
                <td className="py-2 text-right">{formatVND(plan.totalNewElec)}</td>
                <td className="py-2 text-right">+{formatVND(plan.totalRentIncrease)}</td>
              </tr>
            </tfoot>
          </table>
          <p className="font-semibold text-slate-700" data-testid="income-delta">
            Thu nhập thay đổi: {plan.incomeDelta >= 0 ? '+' : ''}
            {formatVND(plan.incomeDelta)}/tháng · {active.length} hợp đồng cần ký phụ lục
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button
            type="button"
            onClick={printAnnex}
            disabled={active.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-xs disabled:opacity-40"
          >
            <Printer className="w-3.5 h-3.5" /> In phụ lục hợp đồng
          </button>
          <button
            type="button"
            disabled={newRate >= property.electricityRate}
            onClick={() => {
              if (window.confirm(`Áp dụng giá điện ${formatVND(newRate)}/kWh và tiền phòng mới cho ${plan.items.length} phòng?`)) {
                onApply(newRate, increaseByRoom);
              }
            }}
            className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs disabled:opacity-40"
          >
            Áp dụng giá mới
          </button>
        </div>
      </div>
    </div>
  );
};
