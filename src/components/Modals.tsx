import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Zap,
  Droplets,
  Camera,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Share2,
  Printer,
  MessageCircle,
  Upload,
  CheckCircle2,
  Plus,
  FileText,
} from 'lucide-react';
import {
  Property,
  Room,
  Tenant,
  Contract,
  Invoice,
  FifoAllocatedItem,
  RoomPriceUpdateItem,
} from '../types';
import {
  formatVND,
  formatNumberInput,
  readMoneyWordsVN,
  getVietQrUrl,
  parseDateVN,
  vnToIsoDate,
  isoToVnDate,
} from '../utils/format';
import {
  calculateFirstPeriodProRata,
  calculateInvoicePayable,
} from '../utils/billing';

// ============================================================================
// 1. MODAL TẠO HỢP ĐỒNG MỚI
// ============================================================================
interface CreateContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  rooms: Room[];
  tenants: Tenant[];
  initialRoomCode?: string;
  onCreateContract: (payload: {
    roomCode: string;
    tenantName: string;
    tenantPhone: string;
    tenantCccd: string;
    startDate: string;
    endDate: string;
    signDate: string;
    paymentCycle: string;
    billingCycle: 'calendar_month' | 'move_in_date';
    rentAmount: number;
    depositAmount: number;
    depositMode: 'received_today' | 'received_before' | 'pending';
    coTenantNames: string[];
    firstPeriodRent: number;
    firstPeriodLabel: string;
  }) => void;
}

export const CreateContractModal: React.FC<CreateContractModalProps> = ({
  isOpen,
  onClose,
  property,
  rooms,
  tenants,
  initialRoomCode,
  onCreateContract,
}) => {
  const vacantOrAvailableRooms = useMemo(() => {
    const vacant = rooms.filter((r) => r.status === 'vacant');
    return vacant.length > 0 ? vacant : rooms;
  }, [rooms]);

  const defaultRoom =
    rooms.find((r) => r.code === initialRoomCode) ||
    vacantOrAvailableRooms.find((r) => r.code === 'P202') ||
    vacantOrAvailableRooms[0];

  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(
    defaultRoom?.code || 'P202'
  );
  const [tenantName, setTenantName] = useState<string>('');
  const [tenantPhone, setTenantPhone] = useState<string>('');
  const [tenantCccd, setTenantCccd] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('11/10/2026');
  const [endDate, setEndDate] = useState<string>('11/10/2027');
  const [signDate, setSignDate] = useState<string>('11/10/2026');
  const [paymentCycle, setPaymentCycle] = useState<string>('Hàng tháng');
  const [billingCycle, setBillingCycle] = useState<'calendar_month' | 'move_in_date'>(
    'calendar_month'
  );
  const [rentAmount, setRentAmount] = useState<number>(defaultRoom?.price || 2500000);
  const [depositAmount, setDepositAmount] = useState<number>(
    defaultRoom?.deposit || 2500000
  );
  const [depositMode, setDepositMode] = useState<
    'received_today' | 'received_before' | 'pending'
  >('received_today');
  const [coTenantSearch, setCoTenantSearch] = useState<string>('');
  const [selectedCoTenants, setSelectedCoTenants] = useState<string[]>([]);

  const isDateOrderInvalid = useMemo(() => {
    const start = parseDateVN(startDate);
    const end = parseDateVN(endDate);
    if (!start || !end) return false;
    return end.getTime() <= start.getTime();
  }, [startDate, endDate]);

  // Tính toán kỳ đầu tự động chia theo số ngày ở thật (ví dụ 11/10 -> 31/10 = 21/31 ngày = 1.693.548 đ)
  const proRataInfo = useMemo(
    () =>
      calculateFirstPeriodProRata({
        startDate,
        rentAmount,
        billingCycle,
      }),
    [startDate, rentAmount, billingCycle]
  );

  if (!isOpen) return null;

  const currentRoom =
    rooms.find((r) => r.code === selectedRoomCode) || defaultRoom;

  const handleRoomChange = (code: string) => {
    setSelectedRoomCode(code);
    const found = rooms.find((r) => r.code === code);
    if (found) {
      setRentAmount(found.price);
      setDepositAmount(found.deposit);
    }
  };

  const handleTenantNameChange = (val: string) => {
    setTenantName(val);
    const matched = tenants.find(
      (t) => t.name.trim().toLowerCase() === val.trim().toLowerCase()
    );
    if (matched) {
      setTenantPhone(matched.phone);
      setTenantCccd(matched.cccd);
    }
  };

  const fixedMonthlyService =
    (currentRoom?.trashFee ?? property.trashFee) +
    (currentRoom?.internetFee ?? property.internetFee);

  const suggestedTenants = tenants
    .filter(
      (t) =>
        !selectedCoTenants.includes(`${t.name} · ${t.phone}`) &&
        (coTenantSearch.trim() === '' ||
          t.name.toLowerCase().includes(coTenantSearch.toLowerCase()) ||
          t.phone.includes(coTenantSearch))
    )
    .slice(0, 4);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = tenantName.trim();
    if (
      !finalName ||
      currentRoom?.status === 'occupied' ||
      isDateOrderInvalid ||
      !parseDateVN(startDate) ||
      !parseDateVN(endDate)
    )
      return;
    onCreateContract({
      roomCode: selectedRoomCode,
      tenantName: finalName,
      tenantPhone: tenantPhone.trim(),
      tenantCccd: tenantCccd.trim(),
      startDate,
      endDate,
      signDate,
      paymentCycle,
      billingCycle,
      rentAmount,
      depositAmount,
      depositMode,
      coTenantNames: selectedCoTenants,
      firstPeriodRent: proRataInfo.firstAmount,
      firstPeriodLabel: proRataInfo.periodText,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden ui-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Tạo hợp đồng mới</h2>
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5">
          {/* Chọn phòng */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">
              Phòng *
            </label>
            <select
              value={selectedRoomCode}
              onChange={(e) => handleRoomChange(e.target.value)}
              className="w-full sm:w-1/2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-600 focus:outline-none"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.code} disabled={r.status === 'occupied'}>
                  {r.code} · {formatVND(r.price)}{' '}
                  {r.status === 'vacant' ? '(Trống)' : `(${r.tenantName || 'Đang thuê'})`}
                </option>
              ))}
            </select>
          </div>

          {/* Khách thuê đại diện, SĐT & CCCD */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Khách thuê đại diện *
              </label>
              <input
                type="text"
                list="tenant-suggestions"
                required
                value={tenantName}
                onChange={(e) => handleTenantNameChange(e.target.value)}
                placeholder="Chọn hoặc gõ tên khách..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <datalist id="tenant-suggestions">
                <option value="Đoàn Minh Khang" />
                {tenants.map((t) => (
                  <option key={t.id} value={t.name} />
                ))}
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Số điện thoại *
              </label>
              <input
                type="tel"
                required
                pattern="0\d{9}"
                value={tenantPhone}
                onChange={(e) => setTenantPhone(e.target.value)}
                placeholder="0912345678"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Số CCCD/CMND
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\d{12}"
                value={tenantCccd}
                onChange={(e) => setTenantCccd(e.target.value)}
                placeholder="079201008899 (12 số)"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-mono text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Ngày bắt đầu, Ngày kết thúc & Chu kỳ thanh toán */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ngày bắt đầu *
              </label>
              <input
                type="date"
                required
                value={vnToIsoDate(startDate)}
                onChange={(e) => setStartDate(isoToVnDate(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ngày kết thúc *
              </label>
              <input
                type="date"
                required
                value={vnToIsoDate(endDate)}
                onChange={(e) => setEndDate(isoToVnDate(e.target.value))}
                className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-slate-900 focus:outline-none ${
                  isDateOrderInvalid
                    ? 'border-rose-500 bg-rose-50/40 focus:border-rose-600'
                    : 'border-slate-200 focus:border-blue-600'
                }`}
              />
              {isDateOrderInvalid && (
                <p className="text-[11px] font-semibold text-rose-600 mt-1">
                  Ngày kết thúc phải sau ngày bắt đầu
                </p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Chu kỳ thanh toán
              </label>
              <select
                value={paymentCycle}
                onChange={(e) => setPaymentCycle(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="Hàng tháng">Hàng tháng</option>
                <option value="3 tháng/lần">3 tháng/lần</option>
                <option value="6 tháng/lần">6 tháng/lần</option>
              </select>
            </div>
          </div>

          {/* Ngày ký & Giá thuê */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ngày ký
              </label>
              <input
                type="date"
                required
                value={vnToIsoDate(signDate)}
                onChange={(e) => setSignDate(isoToVnDate(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Giá thuê (đ)
              </label>
              <input
                type="text"
                value={formatNumberInput(rentAmount)}
                onChange={(e) => {
                  const raw = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                  setRentAmount(raw);
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-right text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Tiền cọc & Chu kỳ tính tiền */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Tiền cọc (đ)
              </label>
              <input
                type="text"
                value={formatNumberInput(depositAmount)}
                onChange={(e) => {
                  const raw = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                  setDepositAmount(raw);
                }}
                className="w-full rounded-xl border border-amber-300 bg-amber-50/20 px-3.5 py-2.5 text-sm font-bold text-right text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Chu kỳ tính tiền
              </label>
              <select
                value={billingCycle}
                onChange={(e) =>
                  setBillingCycle(e.target.value as 'calendar_month' | 'move_in_date')
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="calendar_month">
                  Theo tháng dương lịch — kỳ từ mùng 1 tới cuối tháng
                </option>
                <option value="move_in_date">
                  Theo ngày vào ở — tròn tháng kể từ ngày nhận phòng
                </option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Đi đọc đồng hồ một lượt cho cả dãy như bình thường.
              </p>
            </div>
          </div>

          {/* Khung Kỳ đầu tiên chia theo số ngày ở */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Kỳ đầu tiên</span>
              <span className="font-semibold text-slate-900">
                {proRataInfo.periodText}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Số ngày ở</span>
              <span className="font-semibold text-slate-900">
                {proRataInfo.daysText}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Tiền phòng kỳ đầu</span>
              <span className="text-sm font-bold text-emerald-600">
                {formatVND(proRataInfo.firstAmount)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1 border-t border-amber-200/60">
              Kỳ đầu ngắn hơn một kỳ đầy đủ nên tiền phòng chia theo số ngày ở thật. Từ kỳ
              sau tính đủ {formatVND(rentAmount)}.
            </p>
          </div>

          {/* Khung Giá áp dụng cho phòng */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-800">
              Giá áp dụng cho phòng {selectedRoomCode}
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Tiền điện</span>
              <span className="font-semibold text-slate-900">
                {formatNumberInput(property.electricityRate)} đ/kWh
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Tiền nước</span>
              <span className="font-semibold text-slate-900">
                {formatNumberInput(property.waterRate)} đ/m3
              </span>
            </div>
            <div className="text-[11px] font-medium text-slate-500 pt-1">
              Dịch vụ hàng tháng
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Rác</span>
              <span className="font-semibold text-slate-900">
                {formatNumberInput(currentRoom?.trashFee ?? property.trashFee)} đ/phòng/tháng
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Internet</span>
              <span className="font-semibold text-slate-900">
                {formatNumberInput(currentRoom?.internetFee ?? property.internetFee)}{' '}
                đ/phòng/tháng
              </span>
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-200">
              <div>
                <div className="font-bold text-slate-800">Cố định mỗi tháng</div>
                <div className="text-[11px] text-slate-500">chưa gồm điện nước</div>
              </div>
              <span className="font-bold text-slate-900">
                {formatVND(fixedMonthlyService)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Đổi giá điện nước ở Cài đặt chung; đổi dịch vụ của riêng phòng này ở trang
              phòng.
            </p>
          </div>

          {/* Trạng thái nhận tiền cọc */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">Tiền cọc</div>
            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                depositMode === 'received_today'
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="depositMode"
                checked={depositMode === 'received_today'}
                onChange={() => setDepositMode('received_today')}
                className="mt-0.5 text-blue-600"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">Vừa nhận hôm nay</div>
                <div className="text-[11px] text-slate-500">
                  Ghi một khoản Thu tiền cọc vào sổ quỹ
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                depositMode === 'received_before'
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="depositMode"
                checked={depositMode === 'received_before'}
                onChange={() => setDepositMode('received_before')}
                className="mt-0.5 text-blue-600"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Đã nhận từ trước khi dùng phần mềm
                </div>
                <div className="text-[11px] text-slate-500">
                  Không ghi sổ quỹ — tiền vào két từ trước, ghi lại là sai doanh thu tháng này
                </div>
              </div>
            </label>

            <label
              className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                depositMode === 'pending'
                  ? 'border-blue-600 bg-blue-50/40'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="depositMode"
                checked={depositMode === 'pending'}
                onChange={() => setDepositMode('pending')}
                className="mt-0.5 text-blue-600"
              />
              <div>
                <div className="text-xs font-bold text-slate-900">Chưa nhận</div>
                <div className="text-[11px] text-slate-500">
                  Hợp đồng sẽ hiện cảnh báo "chưa thu cọc" cho tới khi bấm{' '}
                  <strong>Đã nhận cọc</strong>
                </div>
              </div>
            </label>
          </div>

          {/* Khách ở cùng (tuỳ chọn) */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-slate-700">
              Khách ở cùng (tuỳ chọn)
            </div>
            <div className="rounded-xl border border-slate-200 p-3 space-y-2.5">
              {selectedCoTenants.length === 0 ? (
                <div className="text-xs text-slate-400">Chưa chọn ai</div>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedCoTenants.map((ct) => (
                    <span
                      key={ct}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium"
                    >
                      {ct}
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedCoTenants((prev) => prev.filter((x) => x !== ct))
                        }
                        className="text-blue-400 hover:text-blue-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <input
                type="text"
                value={coTenantSearch}
                onChange={(e) => setCoTenantSearch(e.target.value)}
                placeholder="Gõ tên để tìm rồi bấm chọn..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none"
              />
              <div className="space-y-1">
                {suggestedTenants.map((t) => {
                  const label = `${t.name} · ${t.phone}`;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() =>
                        setSelectedCoTenants((prev) => [...prev, label])
                      }
                      className="w-full text-left px-2 py-1.5 rounded-lg text-xs text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition"
                    >
                      <Plus className="w-3.5 h-3.5 text-slate-400" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 text-xs font-semibold text-white hover:bg-blue-700 shadow-sm transition"
            >
              Tạo hợp đồng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 2. MODAL GHI CHỈ SỐ ĐIỆN NƯỚC HÀNG LOẠT
// ============================================================================
interface MeterReadingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  invoicesForMonth: Invoice[];
  initialRoomCode?: string;
  onSaveReadingsAndCreateInvoices: (
    readings: Record<string, { elecNew: number; waterNew: number; photo?: string }>
  ) => void;
}

export const MeterReadingModal: React.FC<MeterReadingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  invoicesForMonth,
  initialRoomCode,
  onSaveReadingsAndCreateInvoices,
}) => {
  const activeRooms = useMemo(
    () => rooms.filter((r) => r.status === 'occupied' || r.code === initialRoomCode),
    [rooms, initialRoomCode]
  );

  const [currentIndex, setCurrentIndex] = useState<number>(() => {
    if (initialRoomCode) {
      const idx = activeRooms.findIndex((r) => r.code === initialRoomCode);
      if (idx >= 0) return idx;
    }
    return 0;
  });

  const buildReadings = () => {
    const map: Record<
      string,
      { elecOld: number; elecNew: number; waterOld: number; waterNew: number; photo?: string }
    > = {};
    activeRooms.forEach((r) => {
      const inv = invoicesForMonth.find((i) => i.roomCode === r.code);
      if (inv) {
        map[r.code] = {
          elecOld: inv.elecOld,
          elecNew: inv.elecNew,
          waterOld: inv.waterOld,
          waterNew: inv.waterNew,
        };
      } else {
        map[r.code] = {
          elecOld: r.elecIndex,
          elecNew: r.elecIndex + 68,
          waterOld: r.waterIndex,
          waterNew: r.waterIndex + 6,
        };
      }
    });
    return map;
  };

  const [readings, setReadings] = useState(buildReadings);
  const [enteredRooms, setEnteredRooms] = useState<Record<string, boolean>>({});
  const [saveError, setSaveError] = useState<string | null>(null);

  // Mỗi lần mở lại modal phải lấy chỉ số theo kỳ đang chọn, tránh dùng số cũ của kỳ khác
  React.useEffect(() => {
    if (!isOpen) return;
    setReadings(buildReadings());
    setEnteredRooms({});
    setSaveError(null);
    const idx = initialRoomCode ? activeRooms.findIndex((r) => r.code === initialRoomCode) : -1;
    setCurrentIndex(idx >= 0 ? idx : 0);
  }, [isOpen]);

  if (!isOpen || activeRooms.length === 0) return null;

  const currentRoom = activeRooms[currentIndex] || activeRooms[0];
  const currentReading = readings[currentRoom.code] || {
    elecOld: currentRoom.elecIndex,
    elecNew: currentRoom.elecIndex + 68,
    waterOld: currentRoom.waterIndex,
    waterNew: currentRoom.waterIndex + 6,
  };

  const isElecInvalid = currentReading.elecNew < currentReading.elecOld;
  const isWaterInvalid = currentReading.waterNew < currentReading.waterOld;
  const elecUsage = Math.max(0, currentReading.elecNew - currentReading.elecOld);
  const waterUsage = Math.max(0, currentReading.waterNew - currentReading.waterOld);

  const updateReading = (field: 'elecNew' | 'waterNew', val: number) => {
    setReadings((prev) => ({
      ...prev,
      [currentRoom.code]: {
        ...currentReading,
        [field]: val,
      },
    }));
    setEnteredRooms((prev) => ({ ...prev, [currentRoom.code]: true }));
    setSaveError(null);
  };

  const validateAndSaveReadings = () => {
    const invalidRoom = activeRooms.find((r) => {
      const rd = readings[r.code];
      return rd && (rd.elecNew < rd.elecOld || rd.waterNew < rd.waterOld);
    });
    if (invalidRoom) {
      const badIdx = activeRooms.findIndex((r) => r.code === invalidRoom.code);
      if (badIdx >= 0) setCurrentIndex(badIdx);
      setSaveError(
        `Phòng ${invalidRoom.code}: Chỉ số mới nhỏ hơn chỉ số cũ. Vui lòng kiểm tra lại.`
      );
      return;
    }
    setSaveError(null);
    onSaveReadingsAndCreateInvoices(readings);
    onClose();
  };

  const handleNext = () => {
    setEnteredRooms((prev) => ({ ...prev, [currentRoom.code]: true }));
    if (currentIndex < activeRooms.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      validateAndSaveReadings();
    }
  };

  const enteredCount = Object.keys(enteredRooms).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Ghi chỉ số điện nước</h3>
            <p className="text-xs text-slate-500">
              Đi từng phòng cho dễ bấm · Tự tính tiêu thụ và lập hóa đơn
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Room title */}
          <div className="text-center">
            <div className="text-2xl font-extrabold text-slate-900">
              {currentRoom.code}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              Phòng {currentIndex + 1} / {activeRooms.length}
              {currentRoom.tenantName ? ` · ${currentRoom.tenantName}` : ''}
            </div>
          </div>

          {saveError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-semibold text-rose-700 text-center">
              {saveError}
            </div>
          )}

          {/* Điện */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Zap className="w-4 h-4 text-amber-500" />
                Điện
              </span>
              <span className="text-slate-500">
                Chỉ số cũ:{' '}
                <strong className="inline-block ml-1 px-2.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800">
                  {currentReading.elecOld}
                </strong>
              </span>
            </div>
            <input
              type="number"
              value={currentReading.elecNew}
              onChange={(e) =>
                updateReading('elecNew', parseInt(e.target.value, 10) || 0)
              }
              className={`w-full rounded-xl py-3 px-4 text-center text-2xl font-extrabold text-slate-900 focus:outline-none ${
                isElecInvalid
                  ? 'border-2 border-rose-500 bg-rose-50/40'
                  : 'border border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
              }`}
            />
            {isElecInvalid ? (
              <div className="text-center text-xs font-semibold text-rose-600">
                Chỉ số mới nhỏ hơn chỉ số cũ ({currentReading.elecOld})
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500">
                Tiêu thụ: <strong className="text-slate-700">{elecUsage} kWh</strong>
              </div>
            )}
          </div>

          {/* Nước */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
                <Droplets className="w-4 h-4 text-blue-500" />
                Nước
              </span>
              <span className="text-slate-500">
                Chỉ số cũ:{' '}
                <strong className="inline-block ml-1 px-2.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-800">
                  {currentReading.waterOld}
                </strong>
              </span>
            </div>
            <input
              type="number"
              value={currentReading.waterNew}
              onChange={(e) =>
                updateReading('waterNew', parseInt(e.target.value, 10) || 0)
              }
              className={`w-full rounded-xl py-3 px-4 text-center text-2xl font-extrabold text-slate-900 focus:outline-none ${
                isWaterInvalid
                  ? 'border-2 border-rose-500 bg-rose-50/40'
                  : 'border-2 border-blue-500'
              }`}
            />
            {isWaterInvalid ? (
              <div className="text-center text-xs font-semibold text-rose-600">
                Chỉ số mới nhỏ hơn chỉ số cũ ({currentReading.waterOld})
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500">
                Tiêu thụ: <strong className="text-slate-700">{waterUsage} m³</strong>
              </div>
            )}
          </div>

          {/* Chụp ảnh đồng hồ */}
          <button
            type="button"
            onClick={() =>
              setReadings((prev) => ({
                ...prev,
                [currentRoom.code]: {
                  ...currentReading,
                  photo: `meter-${currentRoom.code}.jpg`,
                },
              }))
            }
            className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition"
          >
            <Camera className="w-4 h-4 text-slate-600" />
            {currentReading.photo
              ? `Đã đính kèm ảnh (${currentReading.photo})`
              : 'Chụp ảnh đồng hồ'}
          </button>

          {/* Trước / Phòng sau */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center justify-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Trước
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white flex items-center justify-center gap-1.5 shadow-sm transition"
            >
              <span>
                {currentIndex < activeRooms.length - 1
                  ? 'Phòng sau'
                  : 'Lập hóa đơn cả dãy'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Progress indicator */}
          <div className="text-center space-y-2 pt-1">
            <div className="text-[11px] text-slate-500">
              Đã nhập {enteredCount}/{activeRooms.length} phòng
            </div>
            <div className="flex items-center justify-center gap-1.5">
              {activeRooms.map((r, idx) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition ${
                    idx === currentIndex
                      ? 'bg-blue-600 scale-125'
                      : enteredRooms[r.code]
                      ? 'bg-emerald-500'
                      : 'bg-slate-200'
                  }`}
                  title={r.code}
                />
              ))}
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={validateAndSaveReadings}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
              >
                Lưu & Lập hóa đơn tất cả phòng ngay
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. MODAL XEM PHIẾU BÁO & GỬI ZALO KÈM VIETQR
// ============================================================================
interface InvoiceZaloModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  property: Property;
  previousDebtAmount: number;
  depositHeld: number;
  onMarkSentZalo: (invoiceId: string) => void;
}

export const InvoiceZaloModal: React.FC<InvoiceZaloModalProps> = ({
  isOpen,
  onClose,
  invoice,
  property,
  previousDebtAmount,
  depositHeld,
  onMarkSentZalo,
}) => {
  const [subTab, setSubTab] = useState<'image' | 'message'>('image');
  const [copied, setCopied] = useState(false);

  if (!isOpen || !invoice) return null;

  // Phải trả = phần còn thiếu của kỳ này (đã trừ tiền khách trả trước) + nợ các kỳ cũ
  const { grandTotal } = calculateInvoicePayable(invoice, previousDebtAmount);
  const qrUrl = getVietQrUrl({
    bankBin: property.bankBin,
    bankAccount: property.bankAccount,
    bankOwner: property.bankOwner,
    amount: grandTotal,
    addInfo: `Thanh toan ${invoice.roomCode} ${invoice.code}`,
  });

  const zaloMessage = `🏠 THÔNG BÁO TIỀN PHÒNG ${invoice.roomCode} (${property.name})
Kỳ hóa đơn: ${invoice.billingMonth.split('-').reverse().join('/')} (${invoice.periodLabel})
Khách thuê: ${invoice.tenantName}
--------------------------------
1. Tiền phòng: ${formatVND(invoice.rentAmount)}
2. Tiền điện (${invoice.elecUsage} kWh: ${invoice.elecOld} → ${invoice.elecNew}): ${formatVND(invoice.elecAmount)}
3. Tiền nước (${invoice.waterUsage} m3: ${invoice.waterOld} → ${invoice.waterNew}): ${formatVND(invoice.waterAmount)}
4. Rác: ${formatVND(invoice.trashAmount)}
5. Internet: ${formatVND(invoice.internetAmount)}
6. Gửi xe máy (${invoice.vehicleCount} xe): ${formatVND(invoice.vehicleAmount)}
--------------------------------
• Tổng tiền hóa đơn kỳ này: ${formatVND(invoice.totalAmount)}${
    invoice.paidAmount > 0 ? `\n• Đã trả kỳ này: -${formatVND(invoice.paidAmount)}` : ''
  }
• Nợ kỳ trước: ${formatVND(previousDebtAmount)}
👉 TỔNG PHẢI TRẢ: ${formatVND(grandTotal)}
--------------------------------
🏦 Chuyển khoản: ${property.bankName} - ${property.bankAccount} (${property.bankOwner})
Nội dung CK: Thanh toan ${invoice.roomCode} ${invoice.code}
📷 Mã QR chuyển khoản (đã điền sẵn số tiền): ${qrUrl}
Hạn thanh toán: ${invoice.dueDate}`;

  // Chỉ đánh dấu "đã gửi Zalo" khi sao chép / chia sẻ thật sự thành công
  const handleCopyZalo = async () => {
    try {
      await navigator.clipboard.writeText(zaloMessage);
    } catch {
      return;
    }
    setCopied(true);
    onMarkSentZalo(invoice.id);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShare = async () => {
    if (!navigator.share) return handleCopyZalo();
    try {
      await navigator.share({ text: zaloMessage });
      onMarkSentZalo(invoice.id);
    } catch {
      // Người dùng đóng bảng chia sẻ: không đánh dấu đã gửi
    }
  };

  const handleOpenZalo = () => {
    window.open(`https://zalo.me/${invoice.tenantPhone}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/55 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[94vh] flex flex-col overflow-hidden">
        {/* Top Action Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-100 bg-slate-50/60">
          <div className="text-sm font-bold text-slate-900">
            Phòng {invoice.roomCode} · {invoice.tenantName}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleOpenZalo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Mở Zalo {invoice.tenantPhone}
            </button>
            <button
              type="button"
              onClick={handleCopyZalo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Đã sao chép!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Sao chép tin nhắn</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition"
            >
              <Printer className="w-3.5 h-3.5" />
              In
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              Chia sẻ
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-6 px-6 border-b border-slate-100 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setSubTab('image')}
            className={`py-3 border-b-2 transition ${
              subTab === 'image'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Ảnh hóa đơn
          </button>
          <button
            type="button"
            onClick={() => setSubTab('message')}
            className={`py-3 border-b-2 transition ${
              subTab === 'message'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tin nhắn Zalo
          </button>
        </div>

        {/* Invoice Content */}
        <div className="p-6 overflow-y-auto bg-slate-100/70 flex-1">
          {subTab === 'image' ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-xl mx-auto space-y-5">
              {/* Top Brand & Title */}
              <div className="flex items-start justify-between border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-gradient-to-br from-blue-600 to-teal-500 text-white shadow-sm">
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current" strokeWidth="2.2">
                        <path d="M3 10.5L12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M5.5 9v11h13V9" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M10 20v-5h4v5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-base font-extrabold text-slate-900">
                      Quản lý phòng trọ
                    </span>
                  </div>
                  <div className="text-xs font-medium text-slate-600 mt-1">
                    {property.name}
                  </div>
                  <div className="text-[11px] text-slate-500">{property.address}</div>
                </div>
                <div className="text-right">
                  <div className="text-base font-extrabold tracking-tight text-slate-900">
                    THÔNG BÁO THANH TOÁN
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Kỳ hóa đơn: {invoice.billingMonth.split('-').reverse().join('/')}
                  </div>
                </div>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Phòng:</span>
                    <span className="font-bold text-slate-900">
                      {invoice.roomCode} (Tầng {invoice.floor})
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Khách thuê:</span>
                    <span className="font-bold text-slate-900">{invoice.tenantName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Số điện thoại:</span>
                    <span className="font-semibold text-slate-800">
                      {invoice.tenantPhone}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cọc đang giữ:</span>
                    <span className="font-semibold text-slate-800">
                      {formatVND(depositHeld)}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Mã hóa đơn:</span>
                    <span className="font-bold text-slate-900">{invoice.code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Ngày phát hành:</span>
                    <span className="font-semibold text-slate-800">
                      {invoice.issueDate}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hạn thanh toán:</span>
                    <span className="font-bold text-slate-900">{invoice.dueDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Kỳ sử dụng:</span>
                    <span className="font-semibold text-slate-800">
                      {invoice.periodLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="border-t border-b border-slate-200 py-2">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-[11px] font-bold text-slate-400 uppercase border-b border-slate-100">
                      <th className="py-2 text-left w-8">STT</th>
                      <th className="py-2 text-left">KHOẢN MỤC</th>
                      <th className="py-2 text-right">SỐ LƯỢNG</th>
                      <th className="py-2 text-right">ĐƠN GIÁ</th>
                      <th className="py-2 text-right">THÀNH TIỀN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-800">
                    <tr>
                      <td className="py-2.5 text-slate-500">1</td>
                      <td className="py-2.5 font-medium">Tiền phòng</td>
                      <td className="py-2.5 text-right">1</td>
                      <td className="py-2.5 text-right">
                        {formatNumberInput(invoice.rentAmount)}/kỳ
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatVND(invoice.rentAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-slate-500">2</td>
                      <td className="py-2.5">
                        <div className="font-medium">
                          Tiền điện ({invoice.elecUsage} kWh)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {formatNumberInput(invoice.elecOld)} →{' '}
                          {formatNumberInput(invoice.elecNew)}
                        </div>
                      </td>
                      <td className="py-2.5 text-right">{invoice.elecUsage}</td>
                      <td className="py-2.5 text-right">
                        {formatNumberInput(invoice.elecRate)}/kWh
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatVND(invoice.elecAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-slate-500">3</td>
                      <td className="py-2.5">
                        <div className="font-medium">
                          Tiền nước ({invoice.waterUsage} m3)
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {invoice.waterOld} → {invoice.waterNew}
                        </div>
                      </td>
                      <td className="py-2.5 text-right">{invoice.waterUsage}</td>
                      <td className="py-2.5 text-right">
                        {formatNumberInput(invoice.waterRate)}/m3
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatVND(invoice.waterAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-slate-500">4</td>
                      <td className="py-2.5 font-medium">Rác</td>
                      <td className="py-2.5 text-right">1</td>
                      <td className="py-2.5 text-right">
                        {formatNumberInput(invoice.trashAmount)}
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatVND(invoice.trashAmount)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-2.5 text-slate-500">5</td>
                      <td className="py-2.5 font-medium">Internet</td>
                      <td className="py-2.5 text-right">1</td>
                      <td className="py-2.5 text-right">
                        {formatNumberInput(invoice.internetAmount)}
                      </td>
                      <td className="py-2.5 text-right font-semibold">
                        {formatVND(invoice.internetAmount)}
                      </td>
                    </tr>
                    {invoice.vehicleAmount > 0 && (
                      <tr>
                        <td className="py-2.5 text-slate-500">6</td>
                        <td className="py-2.5 font-medium">Gửi xe máy</td>
                        <td className="py-2.5 text-right">{invoice.vehicleCount}</td>
                        <td className="py-2.5 text-right">
                          {formatNumberInput(
                            invoice.vehicleAmount / Math.max(1, invoice.vehicleCount)
                          )}
                        </td>
                        <td className="py-2.5 text-right font-semibold">
                          {formatVND(invoice.vehicleAmount)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Summary Right */}
              <div className="flex flex-col items-end space-y-1.5 text-xs">
                <div className="flex items-center justify-between w-64">
                  <span className="text-slate-600">[1] Tổng tiền hóa đơn</span>
                  <span className="font-bold text-slate-900">
                    {formatVND(invoice.totalAmount)}
                  </span>
                </div>
                {invoice.paidAmount > 0 && (
                  <div className="flex items-center justify-between w-64">
                    <span className="text-emerald-600 font-medium">Đã trả kỳ này</span>
                    <span className="font-bold text-emerald-600">
                      -{formatVND(invoice.paidAmount)}
                    </span>
                  </div>
                )}
                {previousDebtAmount > 0 && (
                  <div className="flex items-center justify-between w-64">
                    <span className="text-rose-600 font-medium">[2] Nợ kỳ trước</span>
                    <span className="font-bold text-rose-600">
                      {formatVND(previousDebtAmount)}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between w-64 pt-1.5 border-t border-slate-200 text-sm">
                  <span className="font-extrabold text-slate-900">TỔNG PHẢI TRẢ</span>
                  <span className="font-extrabold text-rose-600">
                    {formatVND(grandTotal)}
                  </span>
                </div>
                <div className="text-[11px] italic text-slate-400">
                  {readMoneyWordsVN(grandTotal)}
                </div>
              </div>

              {/* VietQR Section */}
              <div className="pt-4 border-t border-slate-100 text-center space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  QUÉT MÃ ĐỂ CHUYỂN KHOẢN
                </div>
                <div className="inline-block p-3 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <img
                    src={qrUrl}
                    alt="VietQR"
                    className="w-40 h-40 object-contain mx-auto"
                  />
                </div>
                <div className="text-[11px] text-slate-500">
                  Mã QR đã điền sẵn số tiền và nội dung chuyển khoản
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-5 max-w-xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  Nội dung tin nhắn gửi Zalo cho khách
                </span>
                <button
                  type="button"
                  onClick={handleCopyZalo}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Sao chép ngay
                </button>
              </div>
              <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 bg-slate-50 p-4 rounded-xl border border-slate-200 leading-relaxed">
                {zaloMessage}
              </pre>
            </div>
          )}
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500">
          Ảnh đã nằm trên chỗ sẽ gửi tin người dùng trên máy tính: bấm{' '}
          <strong>Tải ảnh về</strong> gửi qua Zalo, hoặc bấm chuột phải để sao chép ảnh.
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 4. MODAL THU TIỀN HÓA ĐƠN - TỰ TRỪ NỢ CŨ NHẤT TRƯỚC (FIFO)
// ============================================================================
interface CollectPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetInvoice: Invoice | null;
  unpaidRoomInvoices: Invoice[]; // Đã sắp xếp từ cũ nhất -> mới nhất
  onConfirmCollect: (payload: {
    roomCode: string;
    amount: number;
    paymentDate: string;
    method: 'Chuyển khoản' | 'Tiền mặt';
    note: string;
    billImage?: string;
  }) => FifoAllocatedItem[];
}

export const CollectPaymentModal: React.FC<CollectPaymentModalProps> = ({
  isOpen,
  onClose,
  targetInvoice,
  unpaidRoomInvoices,
  onConfirmCollect,
}) => {
  const totalRoomDebt = useMemo(
    () =>
      unpaidRoomInvoices.reduce(
        (sum, inv) => sum + Math.max(0, inv.totalAmount - inv.paidAmount),
        0
      ),
    [unpaidRoomInvoices]
  );

  const [amount, setAmount] = useState<number>(totalRoomDebt);
  const [paymentDate, setPaymentDate] = useState<string>('11/10/2026');
  const [method, setMethod] = useState<'Chuyển khoản' | 'Tiền mặt'>('Chuyển khoản');
  const [note, setNote] = useState<string>('');
  const [billImage, setBillImage] = useState<string>('');
  const [allocatedResult, setAllocatedResult] = useState<FifoAllocatedItem[] | null>(
    null
  );
  const [collectedAmountDone, setCollectedAmountDone] = useState<number>(0);

  // Không phụ thuộc totalRoomDebt: sau khi thu, nợ đổi sẽ xoá mất màn hình kết quả FIFO
  React.useEffect(() => {
    setAmount(totalRoomDebt);
    setAllocatedResult(null);
  }, [targetInvoice?.id, isOpen]);

  if (!isOpen || !targetInvoice) return null;

  const currentInvoiceRemaining = Math.max(
    0,
    targetInvoice.totalAmount - targetInvoice.paidAmount
  );
  const olderInvoices = unpaidRoomInvoices.filter((i) => i.id !== targetInvoice.id);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    const allocated = onConfirmCollect({
      roomCode: targetInvoice.roomCode,
      amount,
      paymentDate,
      method,
      note,
      billImage: billImage || undefined,
    });
    setCollectedAmountDone(amount);
    setAllocatedResult(allocated);
  };

  // Màn hình kết quả sau khi bấm Xác nhận thu
  if (allocatedResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900">
              Đã thu {formatVND(collectedAmountDone)}
            </h3>
            <button
              onClick={() => {
                setAllocatedResult(null);
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-xs text-slate-600">
              Tiền đã được trừ vào các hóa đơn sau, cũ nhất trước:
            </p>
            <div className="space-y-2.5">
              {allocatedResult.map((item) => (
                <div
                  key={item.invoiceId}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/70"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Tháng {item.monthLabel}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {item.invoiceCode}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-emerald-600">
                    {formatVND(item.amountAllocated)}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setAllocatedResult(null);
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">
            Thu tiền hóa đơn {targetInvoice.code}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-6 space-y-4">
          <div className="text-xs text-slate-600">
            Phòng <strong className="text-slate-900">{targetInvoice.roomCode}</strong> · Kỳ
            này còn nợ{' '}
            <strong className="text-slate-900">
              {formatVND(currentInvoiceRemaining)}
            </strong>
          </div>

          {/* Bảng kê các kỳ nợ của phòng */}
          <div className="rounded-xl bg-slate-50 border border-slate-200/80 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Hóa đơn kỳ này</span>
              <span className="font-bold text-slate-900">
                {formatVND(currentInvoiceRemaining)}
              </span>
            </div>
            {olderInvoices.map((oldInv) => {
              const rem = Math.max(0, oldInv.totalAmount - oldInv.paidAmount);
              return (
                <div key={oldInv.id} className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Nợ tháng {oldInv.billingMonth.replace('-', '/')}
                  </span>
                  <span className="font-bold text-rose-600">{formatVND(rem)}</span>
                </div>
              );
            })}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Tổng phải trả</span>
              <span className="font-extrabold text-slate-900">
                {formatVND(totalRoomDebt)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 pt-1">
              Thu bao nhiêu cũng được. Tiền sẽ trừ vào{' '}
              <strong className="text-slate-700">hóa đơn cũ nhất trước</strong>, rồi mới
              tới kỳ này. Không thu quá tổng nợ.
            </p>
          </div>

          {/* Số tiền & Ngày thanh toán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Số tiền (đ)
              </label>
              <input
                type="text"
                value={formatNumberInput(amount)}
                onChange={(e) => {
                  const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                  // Chưa có ví trả trước: thu quá tổng nợ thì phần dư bị mất, nên chặn ở đây
                  setAmount(Math.min(val, totalRoomDebt));
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-right text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Đang điền sẵn tổng phải trả gồm cả nợ kỳ trước. Sửa lại nếu khách trả ít
                hơn.
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ngày thanh toán *
              </label>
              <input
                type="date"
                required
                value={vnToIsoDate(paymentDate)}
                onChange={(e) => setPaymentDate(isoToVnDate(e.target.value))}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Hình thức & Ghi chú */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Hình thức
              </label>
              <select
                value={method}
                onChange={(e) =>
                  setMethod(e.target.value as 'Chuyển khoản' | 'Tiền mặt')
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              >
                <option value="Chuyển khoản">Chuyển khoản</option>
                <option value="Tiền mặt">Tiền mặt</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ghi chú
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Khách CK Vietcombank..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Ảnh bill chuyển khoản */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-600">
              Ảnh bill chuyển khoản (tuỳ chọn)
            </label>
            <div
              onClick={() => setBillImage('bill-vietcombank-p101.png')}
              className="rounded-xl border border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 p-5 text-center cursor-pointer transition"
            >
              <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1" />
              <div className="text-xs text-slate-500">
                {billImage
                  ? `Đã đính kèm: ${billImage}`
                  : 'Bấm để chọn ảnh, hoặc bấm vào đây rồi Ctrl+V để dán'}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setBillImage('bill-vietcombank-p101.png')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100"
              >
                <Upload className="w-3.5 h-3.5" />
                Tải ảnh lên
              </button>
              <span className="text-xs text-slate-400">Dán link có sẵn</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition"
            >
              Xác nhận thu
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 5. MODAL KHAI BÁO TẠM TRÚ (CT01) & THÊM KHOẢN THU CHI
// ============================================================================
interface TempResidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  property: Property;
}

export const TempResidenceModal: React.FC<TempResidenceModalProps> = ({
  isOpen,
  onClose,
  tenants,
  property,
}) => {
  const [copied, setCopied] = useState(false);
  if (!isOpen) return null;

  const handleExportCsv = () => {
    const headers = [
      'Mã KH',
      'Họ và tên',
      'Phòng',
      'Vai trò',
      'Số CCCD/CMND',
      'Số điện thoại',
      'Ngày sinh',
      'Quê quán',
      'Hợp đồng',
      'Thời hạn HĐ',
    ];
    const rows = tenants.map((t) => [
      t.code,
      t.name,
      t.roomCode,
      t.role === 'representative' ? 'Đại diện' : 'Ở cùng',
      `'${t.cccd}`,
      `'${t.phone}`,
      t.dob || '01/01/1998',
      t.hometown || 'TP.HCM',
      t.contractCode,
      t.contractEndDate,
    ]);
    const csv =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh-sach-tam-tru-${property.name.replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyAll = () => {
    const text = tenants
      .map(
        (t, idx) =>
          `${idx + 1}. ${t.name} | Phòng ${t.roomCode} | CCCD: ${t.cccd} | SĐT: ${t.phone} | HĐ: ${t.contractCode} (đến ${t.contractEndDate})`
      )
      .join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Danh sách khai báo tạm trú (Mẫu CT01 - Cổng Dịch Vụ Công)
              </h3>
              <p className="text-xs text-slate-500">
                {property.name} · {property.address} · Đã gom sẵn {tenants.length} nhân khẩu
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <span className="text-xs text-slate-600">
              Dữ liệu CCCD, SĐT, Phòng và Thời hạn hợp đồng đã gom sẵn để nộp trực tuyến hoặc
              in cho Công an Phường.
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyAll}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                {copied ? 'Đã sao chép!' : 'Sao chép danh sách'}
              </button>
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white"
              >
                Xuất file Excel / CSV
              </button>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-left">STT</th>
                  <th className="py-2.5 px-3 text-left">Họ tên</th>
                  <th className="py-2.5 px-3 text-left">Phòng</th>
                  <th className="py-2.5 px-3 text-left">Số CCCD/CMND</th>
                  <th className="py-2.5 px-3 text-left">SĐT</th>
                  <th className="py-2.5 px-3 text-left">Quê quán</th>
                  <th className="py-2.5 px-3 text-left">Hạn tạm trú</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tenants.map((t, i) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">{t.name}</td>
                    <td className="py-2 px-3 font-bold text-blue-600">{t.roomCode}</td>
                    <td className="py-2 px-3 font-mono text-slate-700">{t.cccd}</td>
                    <td className="py-2 px-3 text-slate-700">{t.phone}</td>
                    <td className="py-2 px-3 text-slate-600">{t.hometown || 'TP.HCM'}</td>
                    <td className="py-2 px-3 text-slate-600">{t.contractEndDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 6. MODAL ĐIỀU CHỈNH GIÁ THUÊ & BẢNG GIÁ PHÒNG (TỪNG PHÒNG + HÀNG LOẠT)
// ============================================================================

interface RoomPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property;
  rooms: Room[];
  contracts: Contract[];
  initialRoomCode?: string;
  initialMode?: 'single' | 'bulk';
  onSaveRoomPricing: (payload: {
    updates: RoomPriceUpdateItem[];
    syncActiveContracts: boolean;
    syncUnpaidInvoices: boolean;
  }) => void;
}

export const RoomPricingModal: React.FC<RoomPricingModalProps> = ({
  isOpen,
  onClose,
  property,
  rooms,
  contracts,
  initialRoomCode,
  initialMode = 'single',
  onSaveRoomPricing,
}) => {
  const [mode, setMode] = useState<'single' | 'bulk'>(initialMode);
  const [selectedRoomCode, setSelectedRoomCode] = useState<string>(
    initialRoomCode || rooms[0]?.code || 'P101'
  );

  // State cho chỉnh sửa từng phòng
  const [price, setPrice] = useState<number>(2350000);
  const [deposit, setDeposit] = useState<number>(2350000);
  const [trashFee, setTrashFee] = useState<number>(30000);
  const [internetFee, setInternetFee] = useState<number>(100000);
  const [vehicleCount, setVehicleCount] = useState<number>(1);
  const [status, setStatus] = useState<Room['status']>('occupied');
  const [notes, setNotes] = useState<string>('');

  // State cho bảng giá hàng loạt
  const [bulkScope, setBulkScope] = useState<
    'all' | 'floor-1' | 'floor-2' | 'floor-3' | 'vacant'
  >('all');
  const [draftMap, setDraftMap] = useState<Record<string, RoomPriceUpdateItem>>({});

  // Tùy chọn đồng bộ Hợp đồng & Hóa đơn
  const [syncActiveContracts, setSyncActiveContracts] = useState<boolean>(true);
  const [syncUnpaidInvoices, setSyncUnpaidInvoices] = useState<boolean>(true);

  const loadSingleRoomState = (rCode: string, roomList: Room[]) => {
    const r = roomList.find((x) => x.code === rCode) || roomList[0];
    if (!r) return;
    setPrice(r.price);
    setDeposit(r.deposit);
    setTrashFee(r.trashFee);
    setInternetFee(r.internetFee);
    setVehicleCount(r.vehicleCount);
    setStatus(r.status);
    setNotes(r.notes || '');
  };

  useEffect(() => {
    if (!isOpen) return;
    setMode(initialMode);
    const targetCode = initialRoomCode || rooms[0]?.code || 'P101';
    setSelectedRoomCode(targetCode);
    loadSingleRoomState(targetCode, rooms);

    const map: Record<string, RoomPriceUpdateItem> = {};
    rooms.forEach((r) => {
      map[r.code] = {
        roomCode: r.code,
        price: r.price,
        deposit: r.deposit,
        trashFee: r.trashFee,
        internetFee: r.internetFee,
        vehicleCount: r.vehicleCount,
        status: r.status,
        notes: r.notes || '',
      };
    });
    setDraftMap(map);
  }, [isOpen, initialRoomCode, initialMode, rooms]);

  const currentRoom = useMemo(
    () => rooms.find((r) => r.code === selectedRoomCode) || rooms[0],
    [rooms, selectedRoomCode]
  );

  const activeContractForRoom = useMemo(
    () =>
      contracts.find(
        (c) => c.roomCode === selectedRoomCode && c.status === 'active'
      ),
    [contracts, selectedRoomCode]
  );

  if (!isOpen || !currentRoom) return null;

  const priceDiff = price - currentRoom.price;
  const priceDiffPercent =
    currentRoom.price > 0
      ? ((priceDiff / currentRoom.price) * 100).toFixed(1)
      : '0.0';

  const handleApplyBulkDelta = (deltaAmount: number, deltaPercent?: number) => {
    setDraftMap((prev) => {
      const next = { ...prev };
      rooms.forEach((r) => {
        const inScope =
          bulkScope === 'all' ||
          (bulkScope === 'floor-1' && r.floor === 1) ||
          (bulkScope === 'floor-2' && r.floor === 2) ||
          (bulkScope === 'floor-3' && r.floor === 3) ||
          (bulkScope === 'vacant' && r.status === 'vacant');
        if (!inScope) return;
        const curr = next[r.code] || {
          roomCode: r.code,
          price: r.price,
          deposit: r.deposit,
          trashFee: r.trashFee,
          internetFee: r.internetFee,
          vehicleCount: r.vehicleCount,
          status: r.status,
          notes: r.notes || '',
        };
        let newPrice = curr.price;
        if (typeof deltaPercent === 'number') {
          newPrice = Math.round((curr.price * (1 + deltaPercent / 100)) / 10000) * 10000;
        } else {
          newPrice = Math.max(0, curr.price + deltaAmount);
        }
        next[r.code] = {
          ...curr,
          price: newPrice,
          deposit: curr.deposit === curr.price ? newPrice : curr.deposit,
        };
      });
      return next;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'single') {
      onSaveRoomPricing({
        updates: [
          {
            roomCode: selectedRoomCode,
            price,
            deposit,
            trashFee,
            internetFee,
            vehicleCount,
            status,
            notes: notes.trim() || undefined,
          },
        ],
        syncActiveContracts,
        syncUnpaidInvoices,
      });
    } else {
      const updates = Object.values(draftMap);
      onSaveRoomPricing({
        updates,
        syncActiveContracts,
        syncUnpaidInvoices,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden ui-enter">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              🏷️ Điều chỉnh giá thuê & Phí dịch vụ theo từng phòng
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {property.name} · Thiết lập mức giá riêng biệt cho từng phòng hoặc tăng/giảm hàng loạt theo tầng
            </p>
          </div>
          <button
            type="button"
            aria-label="Đóng cửa sổ"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="px-6 pt-3 bg-slate-50/70 border-b border-slate-200 flex items-center gap-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => setMode('single')}
            className={`pb-3 border-b-2 transition ${
              mode === 'single'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            1. Chỉnh sửa chi tiết từng phòng ({selectedRoomCode})
          </button>
          <button
            type="button"
            onClick={() => setMode('bulk')}
            className={`pb-3 border-b-2 transition ${
              mode === 'bulk'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            2. Bảng giá toàn bộ {rooms.length} phòng & Tăng/Giảm hàng loạt
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          {mode === 'single' ? (
            <div className="space-y-5">
              {/* Chọn phòng & Thông tin hiện tại */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Chọn phòng cần điều chỉnh giá *
                  </label>
                  <select
                    value={selectedRoomCode}
                    onChange={(e) => {
                      const code = e.target.value;
                      setSelectedRoomCode(code);
                      loadSingleRoomState(code, rooms);
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    {rooms.map((r) => (
                      <option key={r.id} value={r.code}>
                        Phòng {r.code} (Tầng {r.floor}) — Hiện tại: {formatVND(r.price)}/tháng
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Trạng thái phòng
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Room['status'])}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-900 focus:border-blue-600 focus:outline-none"
                  >
                    <option value="occupied">Đã thuê ({currentRoom.tenantName || 'Đang ở'})</option>
                    <option value="vacant">Còn trống (Sẵn sàng đón khách)</option>
                    <option value="maintenance">Đang sửa chữa / Bảo trì</option>
                    <option value="deposited">Đã nhận cọc giữ phòng</option>
                    <option value="moving_in">Sắp dọn vào ở</option>
                  </select>
                </div>
              </div>

              {/* Thông tin tóm tắt phòng */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="space-y-0.5">
                  <div className="text-slate-500">
                    Phòng <strong className="text-slate-900">{currentRoom.code}</strong> · Tầng{' '}
                    <strong className="text-slate-900">{currentRoom.floor}</strong> · Khách hiện tại:{' '}
                    <strong className="text-blue-600">
                      {currentRoom.tenantName || 'Chưa có khách (Phòng trống)'}
                    </strong>
                  </div>
                  {activeContractForRoom && (
                    <div className="text-slate-500">
                      Hợp đồng đang hiệu lực:{' '}
                      <strong className="text-slate-800">{activeContractForRoom.code}</strong> (Giá HĐ hiện tại:{' '}
                      <strong className="text-slate-900">
                        {formatVND(activeContractForRoom.rentAmount)}
                      </strong>
                      /tháng)
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Giá niêm yết cũ</span>
                  <span className="text-sm font-extrabold text-slate-700">
                    {formatVND(currentRoom.price)}/tháng
                  </span>
                </div>
              </div>

              {/* Giá thuê mới & Nút tăng/giảm nhanh */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/30 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-xs font-bold text-slate-800">
                    Giá thuê phòng mới (đ/tháng) *
                  </label>
                  {priceDiff !== 0 && (
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        priceDiff > 0
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {priceDiff > 0 ? `+${formatVND(priceDiff)}` : formatVND(priceDiff)} (
                      {priceDiff > 0 ? `+${priceDiffPercent}%` : `${priceDiffPercent}%`})
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <input
                    type="text"
                    aria-label="Giá thuê phòng mới"
                    value={formatNumberInput(price)}
                    onChange={(e) => {
                      const val = parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                      setPrice(val);
                    }}
                    className="w-full rounded-xl border-2 border-blue-500 bg-white px-4 py-2.5 text-base font-extrabold text-blue-700 focus:outline-none"
                  />
                  <div className="text-xs text-slate-600 italic">
                    Bằng chữ: <strong className="text-slate-800">{readMoneyWordsVN(price)}</strong>
                  </div>
                </div>

                {/* Các nút cộng/trừ nhanh */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[11px] text-slate-500 mr-1">Điều chỉnh nhanh:</span>
                  {[-200000, -100000, -50000, 50000, 100000, 200000, 500000].map((delta) => (
                    <button
                      key={delta}
                      type="button"
                      onClick={() => setPrice((prev) => Math.max(0, prev + delta))}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                        delta > 0
                          ? 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          : 'bg-white border-rose-200 text-rose-700 hover:bg-rose-50'
                      }`}
                    >
                      {delta > 0 ? `+${delta / 1000}k` : `${delta / 1000}k`}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setDeposit(price)}
                    className="ml-auto px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition"
                  >
                    Đặt tiền cọc = Giá thuê mới
                  </button>
                </div>
              </div>

              {/* Tiền cọc & Phí dịch vụ riêng của phòng */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Tiền đặt cọc chuẩn (đ)
                  </label>
                  <input
                    type="text"
                    value={formatNumberInput(deposit)}
                    onChange={(e) =>
                      setDeposit(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phí rác phòng (đ/tháng)
                  </label>
                  <input
                    type="text"
                    value={formatNumberInput(trashFee)}
                    onChange={(e) =>
                      setTrashFee(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Phí Internet/Wifi (đ/tháng)
                  </label>
                  <input
                    type="text"
                    value={formatNumberInput(internetFee)}
                    onChange={(e) =>
                      setInternetFee(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Số lượng xe gửi
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={vehicleCount}
                    onChange={(e) => setVehicleCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Ghi chú phòng */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Ghi chú đặc điểm / lý do điều chỉnh giá phòng
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="VD: Phòng góc có ban công thoáng, lắp thêm máy nước nóng..."
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-800"
                />
              </div>
            </div>
          ) : (
            /* TAB 2: BẢNG GIÁ TẤT CẢ PHÒNG & ĐIỀU CHỈNH HÀNG LOẠT */
            <div className="space-y-4">
              {/* Thanh công cụ tăng/giảm hàng loạt */}
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Phạm vi áp dụng:</span>
                  <select
                    value={bulkScope}
                    onChange={(e) =>
                      setBulkScope(
                        e.target.value as
                          | 'all'
                          | 'floor-1'
                          | 'floor-2'
                          | 'floor-3'
                          | 'vacant'
                      )
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="all">Tất cả 12 phòng</option>
                    <option value="floor-1">Chỉ Tầng 1 (P101 - P104)</option>
                    <option value="floor-2">Chỉ Tầng 2 (P201 - P204)</option>
                    <option value="floor-3">Chỉ Tầng 3 (P301 - P304)</option>
                    <option value="vacant">Chỉ các phòng đang trống</option>
                  </select>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-slate-500">Tăng/Giảm hàng loạt:</span>
                  <button
                    type="button"
                    onClick={() => handleApplyBulkDelta(-100000)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50"
                  >
                    -100k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyBulkDelta(-50000)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50"
                  >
                    -50k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyBulkDelta(50000)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
                  >
                    +50k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyBulkDelta(100000)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
                  >
                    +100k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyBulkDelta(200000)}
                    className="px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-50"
                  >
                    +200k
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyBulkDelta(0, 5)}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-100"
                  >
                    +5%
                  </button>
                </div>
              </div>

              {/* Bảng chỉnh sửa trực tiếp từng phòng */}
              <div className="border border-slate-200 rounded-xl overflow-x-auto max-h-[46vh]">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3 text-left">Phòng</th>
                      <th className="py-2.5 px-2 text-left">Tầng</th>
                      <th className="py-2.5 px-3 text-left">Khách thuê / Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Giá cũ</th>
                      <th className="py-2.5 px-3 text-right">Giá thuê mới (đ/tháng)</th>
                      <th className="py-2.5 px-3 text-right">Tiền cọc (đ)</th>
                      <th className="py-2.5 px-3 text-right">Rác + Wifi</th>
                      <th className="py-2.5 px-3 text-right">Chênh lệch</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rooms.map((r) => {
                      const d = draftMap[r.code] || {
                        roomCode: r.code,
                        price: r.price,
                        deposit: r.deposit,
                        trashFee: r.trashFee,
                        internetFee: r.internetFee,
                        vehicleCount: r.vehicleCount,
                        status: r.status,
                      };
                      const diff = d.price - r.price;
                      return (
                        <tr key={r.id} className="hover:bg-slate-50/80">
                          <td className="py-2 px-3 font-extrabold text-slate-900">
                            {r.code}
                          </td>
                          <td className="py-2 px-2 text-slate-500">Tầng {r.floor}</td>
                          <td className="py-2 px-3">
                            {r.status === 'occupied' ? (
                              <span className="font-medium text-slate-800">
                                {r.tenantName}
                              </span>
                            ) : r.status === 'vacant' ? (
                              <span className="text-emerald-600 font-semibold">
                                Còn trống
                              </span>
                            ) : (
                              <span className="text-rose-600 font-semibold">
                                Đang sửa
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right text-slate-400">
                            {formatVND(r.price)}
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="text"
                              value={formatNumberInput(d.price)}
                              onChange={(e) => {
                                const val =
                                  parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                                setDraftMap((prev) => ({
                                  ...prev,
                                  [r.code]: { ...d, price: val },
                                }));
                              }}
                              className="w-28 rounded-lg border border-slate-300 px-2.5 py-1 text-right font-bold text-blue-700 focus:border-blue-600 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3 text-right">
                            <input
                              type="text"
                              value={formatNumberInput(d.deposit)}
                              onChange={(e) => {
                                const val =
                                  parseInt(e.target.value.replace(/\D/g, ''), 10) || 0;
                                setDraftMap((prev) => ({
                                  ...prev,
                                  [r.code]: { ...d, deposit: val },
                                }));
                              }}
                              className="w-28 rounded-lg border border-slate-200 px-2.5 py-1 text-right font-semibold text-slate-700 focus:border-blue-600 focus:outline-none"
                            />
                          </td>
                          <td className="py-2 px-3 text-right text-slate-500">
                            {formatVND(d.trashFee + d.internetFee)}
                          </td>
                          <td className="py-2 px-3 text-right font-bold">
                            {diff === 0 ? (
                              <span className="text-slate-300">—</span>
                            ) : diff > 0 ? (
                              <span className="text-emerald-600">+{formatVND(diff)}</span>
                            ) : (
                              <span className="text-rose-600">{formatVND(diff)}</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tùy chọn đồng bộ Hợp đồng & Hóa đơn */}
          <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2.5 text-xs">
            <div className="font-bold text-slate-800">
              Tùy chọn đồng bộ tự động khi lưu giá thuê mới:
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={syncActiveContracts}
                onChange={(e) => setSyncActiveContracts(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Đồng bộ giá thuê mới vào <strong>Hợp đồng đang hiệu lực</strong> của phòng đó
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-slate-700">
              <input
                type="checkbox"
                checked={syncUnpaidInvoices}
                onChange={(e) => setSyncUnpaidInvoices(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                Cập nhật lại tiền phòng & tổng tiền trên các{' '}
                <strong>Hóa đơn chưa thu / nháp (kỳ 2026-10 & 2026-11)</strong>
              </span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Huỷ
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-sm transition"
            >
              {mode === 'single'
                ? `Lưu giá phòng ${selectedRoomCode}`
                : 'Lưu bảng giá tất cả phòng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

