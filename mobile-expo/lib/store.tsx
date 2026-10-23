import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CashTransaction,
  Contract,
  FifoAllocatedItem,
  Invoice,
  NavTab,
  Property,
  Room,
  RoomPriceUpdateItem,
  Tenant,
  Vehicle,
  SEED_CONTRACTS,
  SEED_INVOICES,
  SEED_MONTHLY_CHART,
  SEED_PROPERTIES,
  SEED_ROOMS,
  SEED_TENANTS,
  SEED_TRANSACTIONS,
  SEED_VEHICLES,
  allocatePaymentFIFO,
  applyRoomPricingToInvoice,
  buildCalendarEvents,
  calculateDepositRefund,
  calculateInvoiceFromReadings,
  computeDaysRemaining,
  extractBillingMonth,
  formatVND,
  nextCode,
  shiftMonth,
  todayVN,
  vnToIsoDate,
} from './shared';

// Cùng khoá và cấu trúc với localStorage của bản web (Bản Demo)
const STORAGE_KEY = 'quanlyphongtro_state_v1';

export interface ContractPayload {
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
}

export interface CollectPayload {
  roomCode: string;
  amount: number;
  paymentDate: string;
  method: 'Chuyển khoản' | 'Tiền mặt';
  note: string;
}

export type ModalState =
  | { kind: 'contract'; roomCode?: string }
  | { kind: 'meter'; roomCode?: string }
  | { kind: 'collect'; invoice: Invoice }
  | { kind: 'invoice'; invoice: Invoice }
  | { kind: 'pricing'; roomCode: string }
  | null;

function useAppState() {
  const [properties, setProperties] = useState<Property[]>(SEED_PROPERTIES);
  const [rooms, setRooms] = useState<Room[]>(SEED_ROOMS);
  const [allTenants, setTenants] = useState<Tenant[]>(SEED_TENANTS);
  const [allVehicles, setVehicles] = useState<Vehicle[]>(SEED_VEHICLES);
  const [allContracts, setContracts] = useState<Contract[]>(SEED_CONTRACTS);
  const [allInvoices, setInvoices] = useState<Invoice[]>(SEED_INVOICES);
  const [allTransactions, setTransactions] = useState<CashTransaction[]>(SEED_TRANSACTIONS);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('prop-binh-an');
  const [activeTab, setActiveTabState] = useState<NavTab>('overview');
  const [history, setHistory] = useState<NavTab[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const today = todayVN();
  const curMonth = extractBillingMonth(today);
  const nextMonth = shiftMonth(curMonth, 1);
  const periodLabel = today.slice(3);
  const [invoiceMonth, setInvoiceMonth] = useState<string>(nextMonth);

  // Nạp dữ liệu đã lưu trên máy, rồi tự lưu mỗi lần đổi
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!raw) return;
        const s = JSON.parse(raw);
        if (s.properties) setProperties(s.properties);
        if (s.rooms) setRooms(s.rooms);
        if (s.tenants) setTenants(s.tenants);
        if (s.vehicles) setVehicles(s.vehicles);
        if (s.contracts) setContracts(s.contracts);
        if (s.invoices) setInvoices(s.invoices);
        if (s.transactions) setTransactions(s.transactions);
      })
      .catch(() => {})
      .finally(() => {
        loadedRef.current = true;
      });
  }, []);
  useEffect(() => {
    if (!loadedRef.current) return;
    const snapshot = {
      properties,
      rooms,
      tenants: allTenants,
      vehicles: allVehicles,
      contracts: allContracts,
      invoices: allInvoices,
      transactions: allTransactions,
    };
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
  }, [properties, rooms, allTenants, allVehicles, allContracts, allInvoices, allTransactions]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const setActiveTab = (tab: NavTab) => {
    if (tab === activeTab) return;
    setHistory((h) => [...h, activeTab]);
    setActiveTabState(tab);
  };
  const goBack = () => {
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setActiveTabState(prev ?? 'overview');
    return history.length > 0;
  };

  const currentProperty = properties.find((p) => p.id === selectedPropertyId) || properties[0];
  const propertyRooms = useMemo(
    () => rooms.filter((r) => r.propertyId === currentProperty.id),
    [rooms, currentProperty.id]
  );
  const tenants = useMemo(
    () => allTenants.filter((t) => t.propertyId === currentProperty.id),
    [allTenants, currentProperty.id]
  );
  const vehicles = useMemo(
    () => allVehicles.filter((v) => v.propertyId === currentProperty.id),
    [allVehicles, currentProperty.id]
  );
  const contracts = useMemo(
    () => allContracts.filter((c) => c.propertyId === currentProperty.id),
    [allContracts, currentProperty.id]
  );
  const invoices = useMemo(
    () => allInvoices.filter((i) => i.propertyId === currentProperty.id),
    [allInvoices, currentProperty.id]
  );
  const transactions = useMemo(
    () => allTransactions.filter((t) => t.propertyId === currentProperty.id),
    [allTransactions, currentProperty.id]
  );

  const monthlyChart = SEED_MONTHLY_CHART;
  const calendarEvents = useMemo(
    () => buildCalendarEvents({ today, curMonth, rooms: propertyRooms, invoices, contracts }),
    [today, curMonth, propertyRooms, invoices, contracts]
  );

  const occupiedRooms = propertyRooms.filter((r) => r.status === 'occupied');
  const vacantRooms = propertyRooms.filter((r) => r.status === 'vacant');
  const maintenanceRooms = propertyRooms.filter((r) => r.status === 'maintenance');
  const occupancyRate = propertyRooms.length
    ? Math.round((occupiedRooms.length / propertyRooms.length) * 100)
    : 0;
  const totalMonthlyContractRent = occupiedRooms.reduce((s, r) => s + r.price, 0);
  const monthlyVacancyLoss = vacantRooms.reduce((s, r) => s + r.price, 0);

  const collectedToday = transactions
    .filter((t) => t.date === today && t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const monthTx = transactions.filter((t) => t.date.endsWith('/' + periodLabel));
  const currentMonthProfit =
    monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
    monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const remaining = (i: Invoice) => Math.max(0, i.totalAmount - i.paidAmount);
  const sumRemaining = (list: Invoice[]) => list.reduce((s, i) => s + remaining(i), 0);

  const overdueInvoices = invoices.filter((i) => i.billingMonth < curMonth && remaining(i) > 0);
  const dueSoonInvoices = invoices.filter(
    (i) => i.billingMonth === curMonth && i.status !== 'draft' && remaining(i) > 0
  );
  const draftInvoices = invoices.filter((i) => i.status === 'draft');
  const unsentInvoices = invoices.filter(
    (i) => i.billingMonth === curMonth && i.status !== 'draft' && !i.sentZalo
  );
  const allUnpaidInvoices = invoices.filter((i) => i.status !== 'draft' && remaining(i) > 0);

  const getContractRefundAmount = (c: Contract) =>
    c.depositRefundAmount !== undefined
      ? c.depositRefundAmount
      : calculateDepositRefund(c.depositAmount, c.depositDeducted || 0).refundAmount;
  const pendingRefundContracts = contracts.filter(
    (c) => c.status === 'terminated' && !c.depositRefunded && getContractRefundAmount(c) > 0
  );

  const roomFinancialStats = useMemo(() => {
    const map: Record<string, { paid: number; debt: number }> = {};
    invoices.forEach((inv) => {
      if (inv.status === 'draft') return;
      const m = (map[inv.roomCode] ??= { paid: 0, debt: 0 });
      m.paid += inv.paidAmount;
      m.debt += Math.max(0, inv.totalAmount - inv.paidAmount);
    });
    return map;
  }, [invoices]);

  // 1. Tạo hợp đồng mới + tự lập hóa đơn kỳ đầu tính theo số ngày ở thật
  const createContract = (payload: ContractPayload) => {
    if (!propertyRooms.some((r) => r.code === payload.roomCode)) {
      showToast(`Không có phòng ${payload.roomCode || '(chưa chọn)'} trong ${currentProperty.name}`);
      return;
    }
    const newContractCode = nextCode('HD-', allContracts.map((c) => c.code));
    const newTenantId = `t-${Date.now()}`;
    const newTenantCode = nextCode('KH-', allTenants.map((t) => t.code));
    const newContract: Contract = {
      id: `c-${Date.now()}`,
      code: newContractCode,
      propertyId: currentProperty.id,
      roomCode: payload.roomCode,
      tenantId: newTenantId,
      tenantName: payload.tenantName,
      tenantPhone: payload.tenantPhone,
      coTenantNames: payload.coTenantNames,
      startDate: payload.startDate,
      endDate: payload.endDate,
      signDate: payload.signDate,
      paymentCycle: payload.paymentCycle,
      billingCycle: payload.billingCycle,
      rentAmount: payload.rentAmount,
      depositAmount: payload.depositAmount,
      depositMode: payload.depositMode,
      status: 'active',
      daysRemaining: computeDaysRemaining(payload.endDate),
    };
    setContracts((prev) => [newContract, ...prev]);

    const targetRoom = propertyRooms.find((r) => r.code === payload.roomCode);
    setRooms((prev) =>
      prev.map((r) =>
        r.code === payload.roomCode && r.propertyId === currentProperty.id
          ? {
              ...r,
              status: 'occupied',
              price: payload.rentAmount,
              deposit: payload.depositAmount,
              tenantId: newTenantId,
              tenantName: payload.tenantName,
              tenantPhone: payload.tenantPhone,
              contractCode: newContractCode,
            }
          : r
      )
    );
    setTenants((prev) => [
      {
        id: newTenantId,
        code: newTenantCode,
        propertyId: currentProperty.id,
        name: payload.tenantName,
        phone: payload.tenantPhone,
        cccd: payload.tenantCccd,
        roomCode: payload.roomCode,
        contractCode: newContractCode,
        contractEndDate: payload.endDate,
        role: 'representative',
        status: 'active',
        hasCccdPhoto: false,
        tempResidenceDeclared: true,
      },
      ...prev,
    ]);

    const newInvoiceCode = nextCode('HD-IV-', allInvoices.map((i) => i.code), 100);
    const elec = targetRoom?.elecIndex ?? 0;
    const water = targetRoom?.waterIndex ?? 0;
    const trash = targetRoom?.trashFee ?? currentProperty.trashFee;
    const internet = targetRoom?.internetFee ?? currentProperty.internetFee;
    const vehicleCount = targetRoom?.vehicleCount ?? 0;
    const vehicleAmount = vehicleCount * currentProperty.vehicleFee;
    setInvoices((prev) => [
      {
        id: `inv-first-${Date.now()}`,
        code: newInvoiceCode,
        propertyId: currentProperty.id,
        roomCode: payload.roomCode,
        floor: targetRoom?.floor ?? 1,
        tenantName: payload.tenantName,
        tenantPhone: payload.tenantPhone,
        contractCode: newContractCode,
        billingMonth: extractBillingMonth(payload.startDate),
        periodLabel: payload.firstPeriodLabel,
        issueDate: payload.signDate,
        dueDate: payload.startDate,
        rentAmount: payload.firstPeriodRent,
        elecOld: elec,
        elecNew: elec,
        elecUsage: 0,
        elecRate: currentProperty.electricityRate,
        elecAmount: 0,
        waterOld: water,
        waterNew: water,
        waterUsage: 0,
        waterRate: currentProperty.waterRate,
        waterAmount: 0,
        trashAmount: trash,
        internetAmount: internet,
        vehicleCount,
        vehicleAmount,
        totalAmount: payload.firstPeriodRent + trash + internet + vehicleAmount,
        paidAmount: 0,
        status: 'unpaid',
        sentZalo: false,
        isOverdue: false,
      },
      ...prev,
    ]);

    if (payload.depositMode === 'received_today' && payload.depositAmount > 0) {
      setTransactions((prev) => [
        {
          id: `tx-dep-${Date.now()}`,
          propertyId: currentProperty.id,
          date: payload.signDate,
          isoDate: vnToIsoDate(payload.signDate) || vnToIsoDate(today),
          type: 'income',
          category: 'Thu tiền cọc',
          roomCode: payload.roomCode,
          description: `Thu tiền cọc phòng ${payload.roomCode} - HĐ ${newContractCode}`,
          amount: payload.depositAmount,
          method: 'Chuyển khoản',
        },
        ...prev,
      ]);
    }
    showToast(
      `Đã tạo hợp đồng ${newContractCode} & hóa đơn kỳ đầu ${newInvoiceCode} (${formatVND(payload.firstPeriodRent)})`
    );
  };

  // 2. Lưu chỉ số điện nước & lập hóa đơn hàng loạt cho kỳ đang chọn
  const saveReadings = (readings: Record<string, { elecNew: number; waterNew: number }>) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.billingMonth !== invoiceMonth || inv.propertyId !== currentProperty.id) return inv;
        const r = readings[inv.roomCode];
        if (!r) return inv.status === 'draft' ? { ...inv, status: 'unpaid' } : inv;
        const calc = calculateInvoiceFromReadings(inv, r);
        return {
          ...inv,
          elecNew: r.elecNew,
          elecUsage: calc.elecUsage,
          elecAmount: calc.elecAmount,
          waterNew: r.waterNew,
          waterUsage: calc.waterUsage,
          waterAmount: calc.waterAmount,
          totalAmount: calc.totalAmount,
          status: calc.status,
        };
      })
    );
    showToast(`Đã cập nhật chỉ số điện nước và lập hóa đơn kỳ ${invoiceMonth}!`);
  };

  // 3. Thu tiền tự trừ vào hóa đơn cũ nhất trước (FIFO)
  const collectFIFO = (payload: CollectPayload): FifoAllocatedItem[] => {
    const roomInvoices = invoices.filter((i) => i.roomCode === payload.roomCode);
    const { allocatedItems, updatedMap } = allocatePaymentFIFO(roomInvoices, payload.amount);
    const isoDate = vnToIsoDate(payload.paymentDate) || vnToIsoDate(today);
    const newTx: CashTransaction[] = allocatedItems.map((item) => ({
      id: `tx-${item.invoiceCode}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      propertyId: currentProperty.id,
      date: payload.paymentDate,
      isoDate,
      type: 'income',
      category: 'Thu tiền hóa đơn',
      roomCode: payload.roomCode,
      invoiceCode: item.invoiceCode,
      description: `Thu tiền phòng ${payload.roomCode} - HĐ ${item.invoiceCode}`,
      amount: item.amountAllocated,
      method: payload.method,
    }));
    setInvoices((prev) =>
      prev.map((inv) => {
        const up = updatedMap[inv.id];
        return up ? { ...inv, paidAmount: inv.paidAmount + up.addPaid, status: up.newStatus } : inv;
      })
    );
    setTransactions((prev) => [...newTx.reverse(), ...prev]);
    showToast(
      `Đã thu ${formatVND(payload.amount)} phòng ${payload.roomCode} (tự trừ ${allocatedItems.length} hóa đơn cũ nhất trước)`
    );
    return allocatedItems;
  };

  // 4. Hoàn trả tiền cọc cho khách đã trả phòng
  const markDepositRefunded = (contract: Contract) => {
    const amt = getContractRefundAmount(contract);
    setContracts((prev) => prev.map((c) => (c.id === contract.id ? { ...c, depositRefunded: true } : c)));
    if (amt > 0) {
      setTransactions((prev) => [
        {
          id: `tx-refund-${Date.now()}`,
          propertyId: currentProperty.id,
          date: today,
          isoDate: vnToIsoDate(today),
          type: 'expense',
          category: 'Hoàn tiền cọc',
          roomCode: contract.roomCode,
          description: `Hoàn trả tiền cọc phòng ${contract.roomCode} (${contract.tenantName})`,
          amount: amt,
          method: 'Chuyển khoản',
        },
        ...prev,
      ]);
    }
    showToast(`Đã xác nhận chuyển trả ${formatVND(amt)} tiền cọc cho ${contract.tenantName}!`);
  };

  // 5. Điều chỉnh giá thuê, đồng bộ hợp đồng + hóa đơn chưa thu từ kỳ hiện tại
  const saveRoomPricing = (payload: {
    updates: RoomPriceUpdateItem[];
    syncActiveContracts: boolean;
    syncUnpaidInvoices: boolean;
  }) => {
    const byCode: Record<string, RoomPriceUpdateItem> = {};
    payload.updates.forEach((u) => (byCode[u.roomCode] = u));
    setRooms((prev) =>
      prev.map((r) => {
        const up = r.propertyId === currentProperty.id ? byCode[r.code] : undefined;
        return up
          ? {
              ...r,
              price: up.price,
              deposit: up.deposit,
              trashFee: up.trashFee,
              internetFee: up.internetFee,
              vehicleCount: up.vehicleCount,
              status: up.status,
              notes: up.notes !== undefined ? up.notes : r.notes,
            }
          : r;
      })
    );
    if (payload.syncActiveContracts) {
      setContracts((prev) =>
        prev.map((c) => {
          const up = c.propertyId === currentProperty.id ? byCode[c.roomCode] : undefined;
          return up && c.status === 'active' ? { ...c, rentAmount: up.price, depositAmount: up.deposit } : c;
        })
      );
    }
    if (payload.syncUnpaidInvoices) {
      setInvoices((prev) =>
        prev.map((inv) => {
          const up = inv.propertyId === currentProperty.id ? byCode[inv.roomCode] : undefined;
          if (!up || inv.status === 'paid' || inv.billingMonth < curMonth) return inv;
          const oldPrice = propertyRooms.find((r) => r.code === inv.roomCode)?.price ?? 0;
          return applyRoomPricingToInvoice(inv, up, currentProperty.vehicleFee, oldPrice);
        })
      );
    }
    const u = payload.updates[0];
    showToast(
      payload.updates.length === 1
        ? `Đã cập nhật giá thuê phòng ${u.roomCode}: ${formatVND(u.price)}/tháng${
            payload.syncActiveContracts ? ' (đã đồng bộ HĐ & Hóa đơn)' : ''
          }`
        : `Đã cập nhật bảng giá thuê cho ${payload.updates.length} phòng thành công!`
    );
  };

  const markSentZalo = (invoiceId: string) =>
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, sentZalo: true } : i)));
  const markDraftReady = (invoiceId: string) =>
    setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, status: 'unpaid' } : i)));

  const resetDemoData = () => {
    setProperties(SEED_PROPERTIES);
    setRooms(SEED_ROOMS);
    setTenants(SEED_TENANTS);
    setVehicles(SEED_VEHICLES);
    setContracts(SEED_CONTRACTS);
    setInvoices(SEED_INVOICES);
    setTransactions(SEED_TRANSACTIONS);
    showToast('Đã khôi phục dữ liệu mẫu mặc định!');
  };

  return {
    properties,
    selectedPropertyId,
    setSelectedPropertyId,
    currentProperty,
    activeTab,
    setActiveTab,
    goBack,
    modal,
    setModal,
    toast,
    showToast,
    today,
    curMonth,
    nextMonth,
    periodLabel,
    invoiceMonth,
    setInvoiceMonth,
    rooms,
    propertyRooms,
    tenants,
    setTenants,
    vehicles,
    contracts,
    invoices,
    allInvoices,
    transactions,
    allTransactions,
    monthlyChart,
    calendarEvents,
    occupiedRooms,
    vacantRooms,
    maintenanceRooms,
    occupancyRate,
    totalMonthlyContractRent,
    monthlyVacancyLoss,
    collectedToday,
    currentMonthProfit,
    overdueInvoices,
    overdueTotalAmount: sumRemaining(overdueInvoices),
    dueSoonInvoices,
    dueSoonTotalAmount: sumRemaining(dueSoonInvoices),
    draftInvoices,
    unsentInvoices,
    allUnpaidInvoices,
    allUnpaidTotalAmount: sumRemaining(allUnpaidInvoices),
    pendingRefundContracts,
    pendingRefundTotal: pendingRefundContracts.reduce((s, c) => s + getContractRefundAmount(c), 0),
    getContractRefundAmount,
    roomFinancialStats,
    createContract,
    saveReadings,
    collectFIFO,
    markDepositRefunded,
    saveRoomPricing,
    markSentZalo,
    markDraftReady,
    resetDemoData,
  };
}

export type AppStore = ReturnType<typeof useAppState>;
const StoreContext = createContext<AppStore | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useAppState();
  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): AppStore {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore phải nằm trong StoreProvider');
  return s;
}
