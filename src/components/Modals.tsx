import React, { useState, useMemo } from 'react';
import {
  X,
  Zap,
  Droplets,
  Camera,
  ArrowLeft,
  ArrowRight,
  Copy,
  Check,
  Download,
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
} from '../types';
import {
  formatVND,
  formatNumberInput,
  readMoneyWordsVN,
  getVietQrUrl,
} from '../utils/format';

// ============================================================================
// 1. MODAL TẠO HỢP ĐỒNG MỚI (Chuẩn giây 00:24 - 00:31 trong video)
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
  const [tenantPhone, setTenantPhone] = useState<string>('0918668899');
  const [tenantCccd, setTenantCccd] = useState<string>('079201008899');
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

  // Tính toán kỳ đầu tự động chia theo số ngày ở thật (ví dụ 11/10 -> 31/10 = 21/31 ngày = 1.693.548 đ)
  const proRataInfo = useMemo(() => {
    const parts = startDate.split('/');
    let day = 11;
    let month = 10;
    let year = 2026;
    if (parts.length === 3) {
      day = Math.max(1, Math.min(31, parseInt(parts[0], 10) || 11));
      month = Math.max(1, Math.min(12, parseInt(parts[1], 10) || 10));
      year = parseInt(parts[2], 10) || 2026;
    }
    const daysInMonth = new Date(year, month, 0).getDate();
    const stayDays = Math.max(1, daysInMonth - day + 1);
    const firstAmount =
      billingCycle === 'calendar_month'
        ? Math.round((rentAmount * stayDays) / daysInMonth)
        : rentAmount;
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      periodText: `${pad(day)}/${pad(month)} → ${pad(daysInMonth)}/${pad(month)}`,
      daysText: `${stayDays}/${daysInMonth} ngày`,
      firstAmount,
    };
  }, [startDate, rentAmount, billingCycle]);

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
    const finalName = tenantName.trim() || 'Đoàn Minh Khang';
    onCreateContract({
      roomCode: selectedRoomCode,
      tenantName: finalName,
      tenantPhone,
      tenantCccd,
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
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Tạo hợp đồng mới</h2>
          <button
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
                <option key={r.id} value={r.code}>
                  {r.code} · {formatVND(r.price)}{' '}
                  {r.status === 'vacant' ? '(Trống)' : `(${r.tenantName || 'Đang thuê'})`}
                </option>
              ))}
            </select>
          </div>

          {/* Khách thuê đại diện & Ngày bắt đầu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Khách thuê đại diện *
              </label>
              <input
                type="text"
                list="tenant-suggestions"
                value={tenantName}
                onChange={(e) => setTenantName(e.target.value)}
                placeholder="Chọn hoặc gõ tên khách..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
              <datalist id="tenant-suggestions">
                <option value="Đoàn Minh Khang" />
                <option value="Nguyễn Văn An" />
                <option value="Trần Thị Bình" />
                <option value="Lê Hữu Cường" />
              </datalist>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ngày bắt đầu *
              </label>
              <input
                type="text"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Ngày kết thúc & Chu kỳ thanh toán */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">
                Ngày kết thúc *
              </label>
              <input
                type="text"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
              />
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
                type="text"
                value={signDate}
                onChange={(e) => setSignDate(e.target.value)}
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
// 2. MODAL GHI CHỈ SỐ ĐIỆN NƯỚC HÀNG LOẠT (Chuẩn giây 00:32 - 00:34 trong video)
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

  const [readings, setReadings] = useState<
    Record<string, { elecOld: number; elecNew: number; waterOld: number; waterNew: number; photo?: string }>
  >(() => {
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
  });

  const [enteredRooms, setEnteredRooms] = useState<Record<string, boolean>>({});

  if (!isOpen || activeRooms.length === 0) return null;

  const currentRoom = activeRooms[currentIndex] || activeRooms[0];
  const currentReading = readings[currentRoom.code] || {
    elecOld: currentRoom.elecIndex,
    elecNew: currentRoom.elecIndex + 68,
    waterOld: currentRoom.waterIndex,
    waterNew: currentRoom.waterIndex + 6,
  };

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
  };

  const handleNext = () => {
    setEnteredRooms((prev) => ({ ...prev, [currentRoom.code]: true }));
    if (currentIndex < activeRooms.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onSaveReadingsAndCreateInvoices(readings);
      onClose();
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
              className="w-full rounded-xl border border-slate-200 py-3 px-4 text-center text-2xl font-extrabold text-slate-900 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 focus:outline-none"
            />
            <div className="text-center text-xs text-slate-500">
              Tiêu thụ: <strong className="text-slate-700">{elecUsage} kWh</strong>
            </div>
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
              className="w-full rounded-xl border-2 border-blue-500 py-3 px-4 text-center text-2xl font-extrabold text-slate-900 focus:outline-none"
            />
            <div className="text-center text-xs text-slate-500">
              Tiêu thụ: <strong className="text-slate-700">{waterUsage} m³</strong>
            </div>
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
                onClick={() => {
                  onSaveReadingsAndCreateInvoices(readings);
                  onClose();
                }}
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
// 3. MODAL XEM PHIẾU BÁO & GỬI ZALO KÈM VIETQR (Chuẩn giây 00:36 - 00:37)
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

  const grandTotal = invoice.totalAmount + previousDebtAmount;
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
• Tổng tiền hóa đơn kỳ này: ${formatVND(invoice.totalAmount)}
• Nợ kỳ trước: ${formatVND(previousDebtAmount)}
👉 TỔNG PHẢI TRẢ: ${formatVND(grandTotal)}
--------------------------------
🏦 Chuyển khoản: ${property.bankName} - ${property.bankAccount} (${property.bankOwner})
Nội dung CK: Thanh toan ${invoice.roomCode} ${invoice.code}
Hạn thanh toán: ${invoice.dueDate}`;

  const handleCopyZalo = () => {
    navigator.clipboard?.writeText(zaloMessage);
    setCopied(true);
    onMarkSentZalo(invoice.id);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenZalo = () => {
    onMarkSentZalo(invoice.id);
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
              onClick={() => {
                onMarkSentZalo(invoice.id);
                window.print();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
            >
              <Download className="w-3.5 h-3.5" />
              Tải ảnh hóa đơn
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
                  <div className="text-base font-extrabold text-slate-900">OptiRent</div>
                  <div className="text-xs font-medium text-slate-600 mt-0.5">
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
// 4. MODAL THU TIỀN HÓA ĐƠN - TỰ TRỪ NỢ CŨ NHẤT TRƯỚC (FIFO) (Chuẩn giây 00:39 - 00:41)
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

  React.useEffect(() => {
    setAmount(totalRoomDebt);
    setAllocatedResult(null);
  }, [totalRoomDebt, targetInvoice?.id, isOpen]);

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

  // Màn hình kết quả sau khi bấm Xác nhận thu (Giây 00:41 trong video)
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
              <strong className="text-slate-700">hóa đơn cũ nhất trước</strong>, thừa mới
              sang kỳ này.
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
                  setAmount(val);
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
                type="text"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
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
