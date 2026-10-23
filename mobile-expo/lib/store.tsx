import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import {
  AppSnapshot,
  CashTransaction,
  CloudOwnerContext,
  CloudStatus,
  Contract,
  FifoAllocatedItem,
  Invoice,
  LocalCloudCache,
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
  buildMonthlyChart,
  calculateDepositRefund,
  calculateInvoiceFromReadings,
  cloudCacheKey,
  computeDaysRemaining,
  decideStartState,
  emptySnapshot,
  extractBillingMonth,
  formatVND,
  nextCode,
  planMoveOut,
  setDemoClock,
  shiftMonth,
  todayVN,
  vnToIsoDate,
} from './shared';

// Cùng khoá, cấu trúc và lược đồ với bản web: Bản Demo lưu trên máy, tài khoản thật lưu 1 dòng user_app_state
const STORAGE_KEY = 'quanlyphongtro_state_v1';
const SYNC_SCHEMA = 'quanlyphongtro-web-v1';
export const PUBLIC_WEB_URL = 'https://hienphuong99.github.io/phongtro/';

async function readCloudCache(key: string): Promise<LocalCloudCache | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    const parsed = raw ? (JSON.parse(raw) as LocalCloudCache) : null;
    return parsed && parsed.state ? parsed : null;
  } catch {
    return null;
  }
}
function writeCloudCache(key: string, cache: LocalCloudCache) {
  AsyncStorage.setItem(key, JSON.stringify(cache)).catch(() => {});
}

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

export interface PaymentReport {
  id: string;
  invoice_code: string;
  room_code: string;
  property_id: string;
  amount: number;
  payer_note: string | null;
  created_at: string;
}

export type MoveOutPlan = Exclude<ReturnType<typeof planMoveOut>, { error: string }>;

export type ModalState =
  | { kind: 'contract'; roomCode?: string }
  | { kind: 'meter'; roomCode?: string }
  | { kind: 'collect'; invoice: Invoice; report?: { id: string; amount: number } }
  | { kind: 'invoice'; invoice: Invoice }
  | { kind: 'editInvoice'; invoice: Invoice }
  | { kind: 'pricing'; roomCode: string; bulk?: boolean }
  | { kind: 'addRoom' }
  | { kind: 'expense' }
  | { kind: 'moveOut'; contract: Contract }
  | { kind: 'tempResidence' }
  | { kind: 'auth' }
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
  const [demoLoaded, setDemoLoaded] = useState(false);

  // Tài khoản Cloud
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const [cloudCtx, setCloudCtx] = useState<CloudOwnerContext | null>(null);
  const [cloudLastSavedAt, setCloudLastSavedAt] = useState<string | null>(null);
  const [paymentReports, setPaymentReports] = useState<PaymentReport[]>([]);
  const cloudVersionRef = useRef<string | null>(null);
  const cloudReadyRef = useRef(false);
  const cloudSnapshotRef = useRef<AppSnapshot | null>(null);
  const cloudPushingRef = useRef(false);
  const cloudPendingRef = useRef(false);
  const cloudCtxRef = useRef<CloudOwnerContext | null>(null);
  cloudCtxRef.current = cloudCtx;

  // "Hôm nay": Demo cố định 11/10/2026, tài khoản Cloud theo ngày thật
  setDemoClock(isDemoMode);
  const today = todayVN();
  const curMonth = extractBillingMonth(today);
  const nextMonth = shiftMonth(curMonth, 1);
  const periodLabel = today.slice(3);
  const [invoiceMonth, setInvoiceMonth] = useState<string>(nextMonth);
  useEffect(() => setInvoiceMonth(nextMonth), [nextMonth]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  };

  const applySnapshot = (s: AppSnapshot) => {
    setProperties(s.properties);
    setRooms(s.rooms);
    setTenants(s.tenants);
    setVehicles(s.vehicles);
    setContracts(s.contracts);
    setInvoices(s.invoices);
    setTransactions(s.transactions);
    setSelectedPropertyId((id) => (s.properties.some((p) => p.id === id) ? id : s.properties[0]?.id || ''));
  };

  const loadDemoSnapshot = async (): Promise<AppSnapshot> => {
    const seed: AppSnapshot = {
      properties: SEED_PROPERTIES,
      rooms: SEED_ROOMS,
      tenants: SEED_TENANTS,
      vehicles: SEED_VEHICLES,
      contracts: SEED_CONTRACTS,
      invoices: SEED_INVOICES,
      transactions: SEED_TRANSACTIONS,
    };
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return seed;
      const p = JSON.parse(raw);
      return {
        properties: p.properties || seed.properties,
        rooms: p.rooms || seed.rooms,
        tenants: p.tenants || seed.tenants,
        vehicles: p.vehicles || seed.vehicles,
        contracts: p.contracts || seed.contracts,
        invoices: p.invoices || seed.invoices,
        transactions: p.transactions || seed.transactions,
      };
    } catch {
      return seed;
    }
  };

  const pushCloudNow = async (userId: string) => {
    if (cloudPushingRef.current) {
      cloudPendingRef.current = true;
      return;
    }
    cloudPushingRef.current = true;
    try {
      do {
        cloudPendingRef.current = false;
        const ctx = cloudCtxRef.current;
        const snapshot = cloudSnapshotRef.current;
        if (!ctx || !snapshot || ctx.role === 'viewer') return;
        setCloudStatus('saving');
        const row = { state: snapshot, schema_version: SYNC_SCHEMA, updated_at: new Date().toISOString() };
        // Chỉ ghi đè khi bản trên mây chưa bị thiết bị khác sửa (khóa theo updated_at)
        const res = cloudVersionRef.current
          ? await supabase.from('user_app_state').update(row).eq('owner_id', ctx.ownerId).eq('updated_at', cloudVersionRef.current).select('updated_at')
          : await supabase.from('user_app_state').insert({ owner_id: ctx.ownerId, ...row }).select('updated_at');
        if (res.error) {
          setCloudStatus(res.error.code === '23505' ? 'conflict' : 'error');
          return;
        }
        if (!res.data || res.data.length === 0) {
          setCloudStatus('conflict');
          return;
        }
        cloudVersionRef.current = res.data[0].updated_at as string;
        writeCloudCache(cloudCacheKey(ctx.ownerId, userId), {
          state: snapshot,
          baseVersion: cloudVersionRef.current,
          dirty: snapshot !== cloudSnapshotRef.current,
        });
        setCloudStatus('saved');
        setCloudLastSavedAt(new Date().toLocaleTimeString('vi-VN'));
      } while (cloudPendingRef.current);
    } finally {
      cloudPushingRef.current = false;
    }
  };

  // Sổ được làm việc: của chính mình, hoặc sổ chủ trọ đã cấp quyền tài khoản phụ
  const resolveCloudOwner = async (userId: string) => {
    const own = await supabase.from('user_app_state').select('state, updated_at').eq('owner_id', userId).maybeSingle();
    if (own.error || own.data) {
      return { ctx: { ownerId: userId, role: 'owner', propertyIds: null } as CloudOwnerContext, res: own };
    }
    const { data: links } = await supabase.from('property_staff').select('owner_id, property_id, role').neq('owner_id', userId);
    if (!links || links.length === 0) {
      return { ctx: { ownerId: userId, role: 'owner', propertyIds: null } as CloudOwnerContext, res: own };
    }
    const ownerId = links[0].owner_id as string;
    const mine = links.filter((l) => l.owner_id === ownerId);
    const ctx: CloudOwnerContext = {
      ownerId,
      role: mine.some((l) => l.role === 'staff') ? 'staff' : 'viewer',
      propertyIds: mine.map((l) => l.property_id as string),
    };
    const res = await supabase.from('user_app_state').select('state, updated_at').eq('owner_id', ownerId).maybeSingle();
    return { ctx, res };
  };

  const loadCloudStateForUser = async (userId: string, userEmail: string) => {
    cloudReadyRef.current = false;
    setCloudStatus('loading');
    const { ctx, res } = await resolveCloudOwner(userId);
    if (ctx.role !== 'owner' && !res.error && !res.data) {
      showToast('Chủ trọ chưa có sổ đám mây hoặc chưa cấp quyền cho tài khoản này.');
      setCloudStatus('error');
      setIsDemoMode(true);
      return;
    }
    const key = cloudCacheKey(ctx.ownerId, userId);
    const local = await readCloudCache(key);
    const decision = decideStartState({
      local,
      remote: res.data ? { state: res.data.state, updatedAt: res.data.updated_at as string } : null,
      remoteFailed: !!res.error,
    });
    setCloudCtx(ctx);
    cloudCtxRef.current = ctx;

    if (decision.use === 'offline-none') {
      showToast('Không kết nối được máy chủ và máy này chưa có bản sao. Đang dùng Bản Demo.');
      setCloudStatus('offline');
      setIsDemoMode(true);
      return;
    }
    if (decision.use === 'offline-local') {
      cloudVersionRef.current = local?.baseVersion ?? null;
      cloudSnapshotRef.current = decision.state;
      applySnapshot(decision.state);
      setCloudStatus('offline');
      showToast('Mất kết nối: đang dùng bản sao trên máy, sẽ tự đồng bộ khi có mạng.');
    } else if (decision.use === 'remote') {
      if (decision.backupLocal && local) {
        writeCloudCache(`${key}-backup-${Date.now()}`, local);
        showToast('Sổ đã được sửa trên thiết bị khác. Đã tải bản mới nhất, bản trên máy được sao lưu.');
      } else {
        showToast(`Đã tải sổ đám mây của ${userEmail}`);
      }
      cloudVersionRef.current = res.data!.updated_at as string;
      cloudSnapshotRef.current = decision.state;
      writeCloudCache(key, { state: decision.state, baseVersion: cloudVersionRef.current, dirty: false });
      applySnapshot(decision.state);
      setCloudStatus('saved');
      setCloudLastSavedAt(new Date(cloudVersionRef.current).toLocaleTimeString('vi-VN'));
    } else {
      const state = decision.use === 'local' ? decision.state : emptySnapshot(userEmail);
      cloudVersionRef.current = decision.use === 'local' ? local?.baseVersion ?? null : null;
      cloudSnapshotRef.current = state;
      applySnapshot(state);
      showToast(
        decision.use === 'local'
          ? 'Đang đẩy các thay đổi chưa lưu trên máy này lên mây...'
          : `Đã tạo sổ đám mây trống cho ${userEmail}. Gửi file Excel hoặc ảnh sổ để được nhập hộ.`
      );
      cloudReadyRef.current = true;
      await pushCloudNow(userId);
    }
    cloudReadyRef.current = true;
  };

  const switchToDemoMode = async (silent = false) => {
    const demo = await loadDemoSnapshot();
    cloudReadyRef.current = false;
    applySnapshot(demo);
    setIsDemoMode(true);
    if (!silent) showToast('Đang ở Chế độ Bản Demo (12 phòng mẫu để giới thiệu khách hàng)');
  };

  const enterCloud = (user: { id: string; email: string }) => {
    setAuthUser(user);
    setIsDemoMode(false);
    loadCloudStateForUser(user.id, user.email);
  };

  const signOutCloud = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setCloudCtx(null);
    setCloudStatus('idle');
    await switchToDemoMode(true);
    showToast('Đã đăng xuất và quay về Bản Demo.');
  };

  // Khởi động: nạp Bản Demo trên máy, rồi nếu còn phiên đăng nhập thì mở sổ đám mây
  useEffect(() => {
    (async () => {
      applySnapshot(await loadDemoSnapshot());
      setDemoLoaded(true);
      const { data } = await supabase.auth.getSession();
      const u = data.session?.user;
      if (u) enterCloud({ id: u.id, email: u.email || 'Chủ trọ' });
    })();
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Phiên hết hạn hoặc đăng xuất ở nơi khác: quay về Bản Demo trên máy
      if (event === 'SIGNED_OUT') {
        setAuthUser(null);
        setCloudCtx(null);
        setCloudStatus('idle');
        switchToDemoMode(true);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Lưu tự động: Bản Demo -> máy; tài khoản thật -> bản sao trên máy ngay, đẩy lên mây sau 800ms
  useEffect(() => {
    if (!demoLoaded) return;
    const snapshot: AppSnapshot = {
      properties,
      rooms,
      tenants: allTenants,
      vehicles: allVehicles,
      contracts: allContracts,
      invoices: allInvoices,
      transactions: allTransactions,
    };
    if (isDemoMode) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)).catch(() => {});
      return;
    }
    // Đang đăng xuất (sổ thật còn trên màn hình): không ghi vào Bản Demo, không đẩy lên mây
    if (!authUser || !cloudReadyRef.current || !cloudCtx) return;
    const prev = cloudSnapshotRef.current;
    if (prev && (Object.keys(snapshot) as (keyof AppSnapshot)[]).every((k) => prev[k] === snapshot[k])) return;
    cloudSnapshotRef.current = snapshot;
    const readOnly = cloudCtx.role === 'viewer';
    writeCloudCache(cloudCacheKey(cloudCtx.ownerId, authUser.id), {
      state: snapshot,
      baseVersion: cloudVersionRef.current,
      dirty: !readOnly,
    });
    if (readOnly) return;
    const timer = setTimeout(() => pushCloudNow(authUser.id), 800);
    return () => clearTimeout(timer);
  }, [properties, rooms, allTenants, allVehicles, allContracts, allInvoices, allTransactions, isDemoMode, authUser, cloudCtx, demoLoaded]);

  // Mất mạng / lỗi máy chủ: thử lại mỗi 30 giây
  useEffect(() => {
    if (isDemoMode || !authUser || (cloudStatus !== 'error' && cloudStatus !== 'offline')) return;
    const iv = setInterval(() => {
      if (cloudReadyRef.current) pushCloudNow(authUser.id);
    }, 30000);
    return () => clearInterval(iv);
  }, [isDemoMode, authUser, cloudStatus]);

  // Lời báo "Tôi đã chuyển" của người thuê từ trang hóa đơn công khai
  const loadPaymentReports = async () => {
    const ctx = cloudCtxRef.current;
    if (!ctx) return;
    const { data, error } = await supabase
      .from('invoice_payment_reports')
      .select('id, invoice_code, room_code, property_id, amount, payer_note, created_at')
      .eq('owner_id', ctx.ownerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (!error && data) setPaymentReports(data as PaymentReport[]);
  };
  const setReportStatus = async (id: string, status: 'confirmed' | 'dismissed') => {
    setPaymentReports((prev) => prev.filter((r) => r.id !== id));
    const { error } = await supabase.from('invoice_payment_reports').update({ status }).eq('id', id);
    if (error) showToast('Không cập nhật được lời báo: ' + error.message);
  };
  useEffect(() => {
    if (isDemoMode || !authUser || !cloudCtx || cloudCtx.role === 'viewer') {
      setPaymentReports([]);
      return;
    }
    loadPaymentReports();
    const iv = setInterval(loadPaymentReports, 60000);
    return () => clearInterval(iv);
  }, [isDemoMode, authUser, cloudCtx]);

  // Tài khoản Cloud: hóa đơn có mã ngẫu nhiên khó đoán để người thuê mở trang hóa đơn từ Zalo
  const ensurePublicToken = (inv: Invoice): Invoice => {
    if (isDemoMode || inv.publicToken) return inv;
    const token = Array.from(Crypto.getRandomBytes(16), (b) => b.toString(16).padStart(2, '0')).join('');
    const updated = { ...inv, publicToken: token };
    setInvoices((prev) => prev.map((i) => (i.id === inv.id ? updated : i)));
    return updated;
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
  };

  // Tài khoản phụ: không xem báo cáo/lợi nhuận/quỹ, chỉ thấy cơ sở được cấp quyền
  const canViewReports = isDemoMode || !cloudCtx || cloudCtx.role === 'owner';
  const readOnly = !isDemoMode && cloudCtx?.role === 'viewer';
  const visibleProperties = useMemo(
    () => (!isDemoMode && cloudCtx?.propertyIds ? properties.filter((p) => cloudCtx.propertyIds!.includes(p.id)) : properties),
    [properties, isDemoMode, cloudCtx]
  );
  const currentProperty = visibleProperties.find((p) => p.id === selectedPropertyId) || visibleProperties[0] || properties[0];
  const pid = currentProperty?.id;

  const propertyRooms = useMemo(() => rooms.filter((r) => r.propertyId === pid), [rooms, pid]);
  const tenants = useMemo(() => allTenants.filter((t) => t.propertyId === pid), [allTenants, pid]);
  const vehicles = useMemo(() => allVehicles.filter((v) => v.propertyId === pid), [allVehicles, pid]);
  const contracts = useMemo(() => allContracts.filter((c) => c.propertyId === pid), [allContracts, pid]);
  const invoices = useMemo(() => allInvoices.filter((i) => i.propertyId === pid), [allInvoices, pid]);
  const transactions = useMemo(() => allTransactions.filter((t) => t.propertyId === pid), [allTransactions, pid]);

  // Biểu đồ: Bản Demo giữ số liệu mẫu 5 kỳ; tài khoản thật tính từ sổ thu chi
  const monthlyChart = useMemo(
    () => (isDemoMode ? SEED_MONTHLY_CHART : buildMonthlyChart(transactions, curMonth)),
    [isDemoMode, transactions, curMonth]
  );
  const calendarEvents = useMemo(
    () => buildCalendarEvents({ today, curMonth, rooms: propertyRooms, invoices, contracts }),
    [today, curMonth, propertyRooms, invoices, contracts]
  );

  const occupiedRooms = propertyRooms.filter((r) => r.status === 'occupied');
  const vacantRooms = propertyRooms.filter((r) => r.status === 'vacant');
  const maintenanceRooms = propertyRooms.filter((r) => r.status === 'maintenance');
  const occupancyRate = propertyRooms.length ? Math.round((occupiedRooms.length / propertyRooms.length) * 100) : 0;
  const totalMonthlyContractRent = occupiedRooms.reduce((s, r) => s + r.price, 0);
  const monthlyVacancyLoss = vacantRooms.reduce((s, r) => s + r.price, 0);

  const collectedToday = transactions.filter((t) => t.date === today && t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const monthTx = transactions.filter((t) => t.date.endsWith('/' + periodLabel));
  const currentMonthProfit =
    monthTx.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0) -
    monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const remaining = (i: Invoice) => Math.max(0, i.totalAmount - i.paidAmount);
  const sumRemaining = (list: Invoice[]) => list.reduce((s, i) => s + remaining(i), 0);

  const overdueInvoices = invoices.filter((i) => i.billingMonth < curMonth && remaining(i) > 0);
  const dueSoonInvoices = invoices.filter((i) => i.billingMonth === curMonth && i.status !== 'draft' && remaining(i) > 0);
  const draftInvoices = invoices.filter((i) => i.status === 'draft');
  const unsentInvoices = invoices.filter((i) => i.billingMonth === curMonth && i.status !== 'draft' && !i.sentZalo);
  const allUnpaidInvoices = invoices.filter((i) => i.status !== 'draft' && remaining(i) > 0);

  const getContractRefundAmount = (c: Contract) =>
    c.depositRefundAmount !== undefined ? c.depositRefundAmount : calculateDepositRefund(c.depositAmount, c.depositDeducted || 0).refundAmount;
  const pendingRefundContracts = contracts.filter((c) => c.status === 'terminated' && !c.depositRefunded && getContractRefundAmount(c) > 0);

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
    setContracts((prev) => [
      {
        id: `c-${Date.now()}`,
        code: newContractCode,
        propertyId: pid,
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
      },
      ...prev,
    ]);

    const targetRoom = propertyRooms.find((r) => r.code === payload.roomCode);
    setRooms((prev) =>
      prev.map((r) =>
        r.code === payload.roomCode && r.propertyId === pid
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
        propertyId: pid,
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
        propertyId: pid,
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
          propertyId: pid,
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
    showToast(`Đã tạo hợp đồng ${newContractCode} & hóa đơn kỳ đầu ${newInvoiceCode} (${formatVND(payload.firstPeriodRent)})`);
  };

  // 2. Lưu chỉ số điện nước & lập hóa đơn hàng loạt cho kỳ đang chọn
  const saveReadings = (readings: Record<string, { elecNew: number; waterNew: number }>) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.billingMonth !== invoiceMonth || inv.propertyId !== pid) return inv;
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
  const collectFIFO = (payload: CollectPayload, report?: { id: string; amount: number }): FifoAllocatedItem[] => {
    const roomInvoices = invoices.filter((i) => i.roomCode === payload.roomCode);
    const { allocatedItems, updatedMap } = allocatePaymentFIFO(roomInvoices, payload.amount);
    const isoDate = vnToIsoDate(payload.paymentDate) || vnToIsoDate(today);
    const newTx: CashTransaction[] = allocatedItems.map((item) => ({
      id: `tx-${item.invoiceCode}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      propertyId: pid,
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
    if (report && allocatedItems.length > 0) setReportStatus(report.id, 'confirmed');
    showToast(`Đã thu ${formatVND(payload.amount)} phòng ${payload.roomCode} (tự trừ ${allocatedItems.length} hóa đơn cũ nhất trước)`);
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
          propertyId: pid,
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
  const saveRoomPricing = (payload: { updates: RoomPriceUpdateItem[]; syncActiveContracts: boolean; syncUnpaidInvoices: boolean }) => {
    const byCode: Record<string, RoomPriceUpdateItem> = {};
    payload.updates.forEach((u) => (byCode[u.roomCode] = u));
    setRooms((prev) =>
      prev.map((r) => {
        const up = r.propertyId === pid ? byCode[r.code] : undefined;
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
          const up = c.propertyId === pid ? byCode[c.roomCode] : undefined;
          return up && c.status === 'active' ? { ...c, rentAmount: up.price, depositAmount: up.deposit } : c;
        })
      );
    }
    if (payload.syncUnpaidInvoices) {
      setInvoices((prev) =>
        prev.map((inv) => {
          const up = inv.propertyId === pid ? byCode[inv.roomCode] : undefined;
          if (!up || inv.status === 'paid' || inv.billingMonth < curMonth) return inv;
          const oldPrice = propertyRooms.find((r) => r.code === inv.roomCode)?.price ?? 0;
          return applyRoomPricingToInvoice(inv, up, currentProperty.vehicleFee, oldPrice);
        })
      );
    }
    const u = payload.updates[0];
    showToast(
      payload.updates.length === 1
        ? `Đã cập nhật giá thuê phòng ${u.roomCode}: ${formatVND(u.price)}/tháng${payload.syncActiveContracts ? ' (đã đồng bộ HĐ & Hóa đơn)' : ''}`
        : `Đã cập nhật bảng giá thuê cho ${payload.updates.length} phòng thành công!`
    );
  };

  // 6. Sửa / huỷ hóa đơn: chỉ số đồng hồ của phòng đi theo số vừa sửa
  const saveInvoiceEdit = (updated: Invoice) => {
    const old = allInvoices.find((i) => i.id === updated.id);
    setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    if (old) {
      setRooms((prev) =>
        prev.map((r) =>
          r.propertyId === updated.propertyId && r.code === updated.roomCode
            ? {
                ...r,
                elecIndex: r.elecIndex === old.elecNew ? updated.elecNew : r.elecIndex,
                waterIndex: r.waterIndex === old.waterNew ? updated.waterNew : r.waterIndex,
              }
            : r
        )
      );
    }
    showToast(
      updated.sentZalo
        ? `Đã lưu hóa đơn ${updated.code}`
        : `Đã lưu hóa đơn ${updated.code}: tổng mới ${formatVND(updated.totalAmount)}, nhớ gửi lại phiếu cho khách`
    );
  };
  const cancelInvoice = (inv: Invoice) => {
    setInvoices((prev) => prev.filter((i) => i.id !== inv.id));
    setRooms((prev) =>
      prev.map((r) =>
        r.propertyId === inv.propertyId && r.code === inv.roomCode
          ? {
              ...r,
              elecIndex: r.elecIndex === inv.elecNew ? inv.elecOld : r.elecIndex,
              waterIndex: r.waterIndex === inv.waterNew ? inv.waterOld : r.waterIndex,
            }
          : r
      )
    );
    showToast(`Đã huỷ hóa đơn ${inv.code}`);
  };

  // 7. Trả phòng / thanh lý hợp đồng
  const confirmMoveOut = (plan: MoveOutPlan) => {
    const c = plan.contract;
    setContracts((prev) => prev.map((x) => (x.id === c.id ? c : x)));
    setRooms((prev) => prev.map((x) => (x.id === plan.room.id ? plan.room : x)));
    setTenants((prev) => prev.map((t) => (t.propertyId === c.propertyId && t.contractCode === c.code ? { ...t, status: 'moved_out' } : t)));
    setInvoices((prev) => {
      const kept = prev
        .filter((i) => !plan.removeInvoiceIds.includes(i.id))
        .map((i) => {
          const up = plan.invoiceUpdates[i.id];
          return up ? { ...i, paidAmount: i.paidAmount + up.addPaid, status: up.newStatus } : i;
        });
      return plan.finalInvoice ? [plan.finalInvoice, ...kept] : kept;
    });
    showToast(`Đã trả phòng ${c.roomCode}. Hoàn cọc ${formatVND(plan.refund)}${plan.extraDue > 0 ? `, khách còn thiếu ${formatVND(plan.extraDue)}` : ''}`);
  };

  const addRoom = (room: Room) => {
    setRooms((prev) => [...prev, room]);
    showToast(`Đã thêm phòng ${room.code}`);
  };
  const addExpense = (tx: CashTransaction) => {
    setTransactions((prev) => [tx, ...prev]);
    showToast(`Đã ghi khoản chi ${formatVND(tx.amount)} vào sổ thu chi`);
  };
  const toggleCccdPhoto = (id: string) => setTenants((prev) => prev.map((t) => (t.id === id ? { ...t, hasCccdPhoto: !t.hasCccdPhoto } : t)));
  const deleteTenant = (id: string) => setTenants((prev) => prev.filter((t) => t.id !== id));
  const markSentZalo = (invoiceId: string) => setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, sentZalo: true } : i)));
  const markDraftReady = (invoiceId: string) => setInvoices((prev) => prev.map((i) => (i.id === invoiceId ? { ...i, status: 'unpaid' } : i)));

  const resetDemoData = () => {
    if (!isDemoMode) return; // không bao giờ ghi đè sổ Đám mây bằng dữ liệu mẫu
    applySnapshot({
      properties: SEED_PROPERTIES,
      rooms: SEED_ROOMS,
      tenants: SEED_TENANTS,
      vehicles: SEED_VEHICLES,
      contracts: SEED_CONTRACTS,
      invoices: SEED_INVOICES,
      transactions: SEED_TRANSACTIONS,
    });
    showToast('Đã khôi phục dữ liệu mẫu mặc định!');
  };

  return {
    ready: demoLoaded && !!currentProperty,
    properties: visibleProperties,
    allProperties: properties,
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
    // Cloud
    authUser,
    isDemoMode,
    cloudStatus,
    cloudCtx,
    cloudLastSavedAt,
    canViewReports,
    readOnly,
    enterCloud,
    signOutCloud,
    switchToDemoMode,
    reloadCloud: () => authUser && loadCloudStateForUser(authUser.id, authUser.email),
    paymentReports: paymentReports.filter((r) => r.property_id === pid),
    setReportStatus,
    ensurePublicToken,
    // Dữ liệu
    rooms,
    propertyRooms,
    tenants,
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
    // Hành động
    createContract,
    saveReadings,
    collectFIFO,
    markDepositRefunded,
    saveRoomPricing,
    saveInvoiceEdit,
    cancelInvoice,
    confirmMoveOut,
    addRoom,
    addExpense,
    toggleCccdPhoto,
    deleteTenant,
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
