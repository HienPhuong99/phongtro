import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import QRCode from 'qrcode';
import {
  BarChart3,
  Calendar,
  LayoutGrid,
  Users,
  FileText,
  Receipt,
  Wallet,
  TrendingUp,
  Settings,
  Search,
  ChevronDown,
  ChevronRight,
  Droplets,
  Send,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Copy,
  Download,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  RefreshCw,
  Building2,
  Car,
  Sparkles,
  ExternalLink,
  RotateCcw,
  Cloud,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
  Sun,
  Moon,
  Signal,
  Wifi,
  BatteryFull,
  Menu,
  ChevronLeft,
} from 'lucide-react';
import {
  NavTab,
  Property,
  Room,
  Tenant,
  Vehicle,
  Contract,
  Invoice,
  CashTransaction,
  FifoAllocatedItem,
  RoomPriceUpdateItem,
} from './types';
import {
  SEED_PROPERTIES,
  SEED_ROOMS,
  SEED_TENANTS,
  SEED_VEHICLES,
  SEED_CONTRACTS,
  SEED_INVOICES,
  SEED_TRANSACTIONS,
  SEED_MONTHLY_CHART,
} from './data/seedData';
import {
  formatVND,
  formatNumberInput,
  removeAccents,
  vnToIsoDate,
  parseDateVN,
  setDemoClock,
  todayVN,
  shiftMonth,
} from './utils/format';
import {
  computeDaysRemaining,
  extractBillingMonth,
  calculateInvoiceFromReadings,
  allocatePaymentFIFO,
  applyRoomPricingToInvoice,
  calculateDepositRefund,
  nextCode,
} from './utils/billing';
import {
  CreateContractModal,
  MeterReadingModal,
  InvoiceZaloModal,
  CollectPaymentModal,
  TempResidenceModal,
  RoomPricingModal,
} from './components/Modals';
import { AuthModal } from './components/AuthModal';
import { MobileNavDrawer, MobileNavItem } from './components/MobileNavDrawer';
import { InvoiceEditModal } from './components/InvoiceEditModal';
import { RoomAddModal } from './components/RoomAddModal';
import { MoveOutModal } from './components/MoveOutModal';
import { ExpenseModal } from './components/ExpenseModal';
import { VIETQR_BANKS } from './utils/rooms';
import { ElectricityRestructureModal } from './components/ElectricityRestructureModal';
import { buildCalendarEvents, buildMonthlyChart, summarizeProperties } from './utils/insights';
import { downloadSnapshotXlsx } from './utils/exportData';
import { supabase } from './utils/supabase';
import {
  cloudCacheKey,
  decideStartState,
  emptySnapshot,
  readCloudCache,
  writeCloudCache,
  type AppSnapshot,
  type CloudOwnerContext,
  type CloudStatus,
} from './utils/cloudSync';

const STORAGE_KEY = 'quanlyphongtro_state_v1';
const THEME_KEY = 'qlpt-theme';
const SHEETS_URL_KEY = 'quanlyphongtro_sheets_url';
const SHEETS_TOKEN_KEY = 'quanlyphongtro_sheets_token';
// Phải khớp SYNC_SCHEMA trong apps-script/Code.gs
const SHEETS_SYNC_SCHEMA = 'quanlyphongtro-web-v1';
// Giá bán lẻ điện sinh hoạt bậc cao nhất 3.460 đ/kWh (QĐ 1279/QĐ-BCT, theo báo chí 05/2026).
// Thu cao hơn giá bán lẻ có thể bị phạt 20–30 triệu theo NĐ 133/2026 (hiệu lực 25/05/2026).
const ELECTRICITY_RATE_CAP = 3460;

// URL Web App Google Apps Script (tự động cập nhật khi chạy script deploy-sheets)
export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycby47GcffVwe7MW4saPvL5chdA2sdswe5VzKIFIuPSfuG1RGS1Tw9wMU09UX-H8gV9ea/exec';
const PUBLIC_WEB_URL = 'https://hienphuong99.github.io/phongtro/';
const MOBILE_WEB_URL = `${PUBLIC_WEB_URL}?mode=mobile`;
// Menu trượt bên hông trên điện thoại / Khung Mobile: đủ 9 mục như menu trái trên máy tính
// Tài khoản phụ (người nhà / quản lý) chỉ ghi số điện nước, lập hóa đơn và thu tiền
const STAFF_TABS: NavTab[] = ['overview', 'calendar', 'rooms', 'tenants', 'invoices', 'finance-cashbook', 'finance-debts'];
const MOBILE_NAV: MobileNavItem[] = [
  { id: 'overview', label: 'Tổng quan', group: 'Vận hành', icon: BarChart3 },
  { id: 'calendar', label: 'Lịch', group: 'Vận hành', icon: Calendar },
  { id: 'rooms', label: 'Phòng', group: 'Vận hành', icon: LayoutGrid },
  { id: 'tenants', label: 'Khách thuê', group: 'Vận hành', icon: Users },
  { id: 'contracts', label: 'Hợp đồng', group: 'Giấy tờ & thu tiền', icon: FileText },
  { id: 'invoices', label: 'Hóa đơn', group: 'Giấy tờ & thu tiền', icon: Receipt },
  { id: 'finance-debts', label: 'Tài chính', group: 'Giấy tờ & thu tiền', icon: Wallet },
  { id: 'reports', label: 'Báo cáo', group: 'Khác', icon: TrendingUp },
  { id: 'settings', label: 'Cài đặt', group: 'Khác', icon: Settings },
];
export const DEFAULT_GOOGLE_SHEETS_URL =
  'https://docs.google.com/spreadsheets/d/19mgIN7Xki9-FR9zb6cMwy9WMB78Gy4I1BJna7qvNB5g/edit';

const BrandLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 64 64"
    fill="none"
    className={`${className} rounded-xl shadow-2xs shrink-0`}
    aria-hidden="true"
  >
    <rect width="64" height="64" rx="16" fill="#2563EB" />
    <path
      d="M32 13L12 28.5V50C12 51.6569 13.3431 53 15 53H49C50.6569 53 52 51.6569 52 50V28.5L32 13Z"
      fill="white"
      fillOpacity="0.16"
      stroke="white"
      strokeWidth="3.2"
      strokeLinejoin="round"
    />
    <path
      d="M9 30.5L32 12.5L55 30.5"
      stroke="white"
      strokeWidth="3.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <rect x="20" y="29" width="9" height="9" rx="2" fill="white" />
    <rect x="35" y="29" width="9" height="9" rx="2" fill="#93C5FD" />
    <path
      d="M27 53V43C27 41.3431 28.3431 40 30 40H34C35.6569 40 37 41.3431 37 43V53"
      fill="white"
    />
    <circle cx="48" cy="17" r="7" fill="#10B981" stroke="#2563EB" strokeWidth="2.5" />
    <path
      d="M45 17L47.2 19.2L51.5 14.8"
      stroke="white"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function App() {
  // Khởi tạo state từ LocalStorage hoặc dữ liệu mẫu mặc định
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).properties || SEED_PROPERTIES;
      } catch {
        return SEED_PROPERTIES;
      }
    }
    return SEED_PROPERTIES;
  });

  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('prop-binh-an');
  const [activeTab, setActiveTabState] = useState<NavTab>('overview');
  // Mỗi lần đổi màn ghi vào lịch sử trình duyệt: nút Back Android / vuốt quay lại trên iPhone
  // đưa về màn trước thay vì thoát app. qlptDepth = số bước có thể quay lại trong app.
  const activeTabRef = useRef<NavTab>('overview');
  const [navDepth, setNavDepth] = useState(0);
  const setActiveTab = useCallback((tab: NavTab) => {
    if (activeTabRef.current === tab) return;
    const depth = ((window.history.state?.qlptDepth as number) ?? 0) + 1;
    // Chọn mục trong menu: thay bước 'mở menu' để Back về màn trước, không mở lại menu
    if (window.history.state?.qlptMenu) window.history.replaceState({ qlptTab: tab, qlptDepth: depth }, '');
    else window.history.pushState({ qlptTab: tab, qlptDepth: depth }, '');
    activeTabRef.current = tab;
    setNavDepth(depth);
    setActiveTabState(tab);
  }, []);
  const [financeExpanded, setFinanceExpanded] = useState<boolean>(true);
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isMobilePreview, setIsMobilePreview] = useState<boolean>(
    () =>
      typeof window !== 'undefined' &&
      window.innerWidth >= 768 &&
      new URLSearchParams(window.location.search).get('mode') === 'mobile'
  );
  const [isPhoneQrOpen, setIsPhoneQrOpen] = useState<boolean>(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  // Mở menu cũng là một bước trong lịch sử, để nút Back đóng menu trước
  const openMobileNav = useCallback(() => {
    window.history.pushState({ ...window.history.state, qlptMenu: true }, '');
    setIsMobileNavOpen(true);
  }, []);
  const setMobileNavOpen = useCallback(
    (open: boolean) => {
      if (open) return openMobileNav();
      if (window.history.state?.qlptMenu) window.history.back();
      else setIsMobileNavOpen(false);
    },
    [openMobileNav]
  );
  useEffect(() => {
    window.history.replaceState(
      { ...window.history.state, qlptTab: activeTabRef.current, qlptDepth: window.history.state?.qlptDepth ?? 0 },
      ''
    );
    const onPop = (e: PopStateEvent) => {
      setIsMobileNavOpen(Boolean(e.state?.qlptMenu));
      const tab = e.state?.qlptTab as NavTab | undefined;
      if (tab) {
        activeTabRef.current = tab;
        setActiveTabState(tab);
      }
      setNavDepth((e.state?.qlptDepth as number) ?? 0);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);
  const [pwaQrDataUrl, setPwaQrDataUrl] = useState<string>('');

  useEffect(() => {
    QRCode.toDataURL(MOBILE_WEB_URL, { width: 220, margin: 1 })
      .then(setPwaQrDataUrl)
      .catch(() => {});
  }, []);

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).rooms || SEED_ROOMS;
      } catch {
        return SEED_ROOMS;
      }
    }
    return SEED_ROOMS;
  });

  const [allTenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).tenants || SEED_TENANTS;
      } catch {
        return SEED_TENANTS;
      }
    }
    return SEED_TENANTS;
  });

  const [allVehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).vehicles || SEED_VEHICLES;
      } catch {
        return SEED_VEHICLES;
      }
    }
    return SEED_VEHICLES;
  });

  const [allContracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).contracts || SEED_CONTRACTS;
      } catch {
        return SEED_CONTRACTS;
      }
    }
    return SEED_CONTRACTS;
  });

  const [allInvoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).invoices || SEED_INVOICES;
      } catch {
        return SEED_INVOICES;
      }
    }
    return SEED_INVOICES;
  });

  const [allTransactions, setTransactions] = useState<CashTransaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved).transactions || SEED_TRANSACTIONS;
      } catch {
        return SEED_TRANSACTIONS;
      }
    }
    return SEED_TRANSACTIONS;
  });

  const [sheetsWebAppUrl, setSheetsWebAppUrl] = useState<string>(() => {
    return localStorage.getItem(SHEETS_URL_KEY) || DEFAULT_APPS_SCRIPT_URL;
  });
  // Mã đồng bộ chỉ lưu trên trình duyệt này, không build vào bundle công khai
  const [sheetsSyncToken, setSheetsSyncToken] = useState<string>(() => {
    return localStorage.getItem(SHEETS_TOKEN_KEY) || '';
  });
  const [syncStatus, setSyncStatus] = useState<{
    tone: 'pending' | 'success' | 'error';
    text: string;
  } | null>(null);

  // Sub-filters & view states
  const [roomViewMode, setRoomViewMode] = useState<'floor' | 'list'>('floor');
  const [roomStatusFilter, setRoomStatusFilter] = useState<string>('all');
  const [tenantSubTab, setTenantSubTab] = useState<'tenants' | 'vehicles'>('tenants');
  const [tenantSearch, setTenantSearch] = useState<string>('');
  const [contractFilter, setContractFilter] = useState<string>('active');
  const [invoiceMonth, setInvoiceMonth] = useState<string>(() =>
    shiftMonth(extractBillingMonth(todayVN()), 1)
  );
  const [invoiceSubTab, setInvoiceSubTab] = useState<'by_room' | 'all'>('by_room');
  const [invoiceFilter, setInvoiceFilter] = useState<string>('all');
  const [hoveredChartIdx, setHoveredChartIdx] = useState<number | null>(null);

  // Modals state
  const [isContractModalOpen, setIsContractModalOpen] = useState<boolean>(false);
  const [contractInitialRoom, setContractInitialRoom] = useState<string | undefined>(
    undefined
  );
  const [isMeterModalOpen, setIsMeterModalOpen] = useState<boolean>(false);
  const [meterInitialRoom, setMeterInitialRoom] = useState<string | undefined>(undefined);
  const [zaloModalInvoice, setZaloModalInvoice] = useState<Invoice | null>(null);
  const [collectModalInvoice, setCollectModalInvoice] = useState<Invoice | null>(null);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [isElecToolOpen, setIsElecToolOpen] = useState(false);
  const [isRoomAddOpen, setIsRoomAddOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [moveOutContract, setMoveOutContract] = useState<Contract | null>(null);
  // Lời báo "Tôi đã chuyển" của người thuê, chờ chủ trọ đối chiếu số dư rồi xác nhận
  const [paymentReports, setPaymentReports] = useState<
    Array<{ id: string; invoice_code: string; room_code: string; property_id: string; amount: number; payer_note: string | null; created_at: string }>
  >([]);
  const [confirmingReport, setConfirmingReport] = useState<{ id: string; amount: number } | null>(null);
  const [isTempResidenceOpen, setIsTempResidenceOpen] = useState<boolean>(false);
  const [isRoomPricingOpen, setIsRoomPricingOpen] = useState<boolean>(false);
  const [pricingRoomCode, setPricingRoomCode] = useState<string | undefined>(undefined);
  const [pricingMode, setPricingMode] = useState<'single' | 'bulk'>('single');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Supabase Auth & Cloud / Demo Mode state
  const [authUser, setAuthUser] = useState<{ id: string; email: string } | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);

  // Giao diện ban ngày / ban đêm, nhớ trên trình duyệt này
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Trình duyệt chặn lưu trữ: vẫn đổi được trong phiên này
    }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  // "Hôm nay" và các kỳ: Demo cố định 11/10/2026, tài khoản Cloud theo ngày thật
  setDemoClock(isDemoMode);
  const today = todayVN();
  const curMonth = extractBillingMonth(today);
  const nextMonth = shiftMonth(curMonth, 1);
  const periodLabel = today.slice(3); // 'MM/YYYY'
  useEffect(() => {
    setInvoiceMonth(nextMonth);
  }, [nextMonth]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [cloudLoading, setCloudLoading] = useState<boolean>(false);
  const [cloudLastSavedAt, setCloudLastSavedAt] = useState<string | null>(null);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const [cloudCtx, setCloudCtx] = useState<CloudOwnerContext | null>(null);
  const [staffList, setStaffList] = useState<
    Array<{
      id: string;
      staff_email: string;
      role: string;
      can_record_meters: boolean;
      can_collect_payments: boolean;
      can_view_reports: boolean;
    }>
  >([]);
  const [newStaffEmail, setNewStaffEmail] = useState<string>('');
  const [newStaffRole, setNewStaffRole] = useState<'staff' | 'viewer'>('staff');

  const openRoomPricingModal = (roomCode?: string, mode: 'single' | 'bulk' = 'single') => {
    setPricingRoomCode(roomCode || rooms[0]?.code || 'P101');
    setPricingMode(mode);
    setIsRoomPricingOpen(true);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  // ===== ĐỒNG BỘ SỔ ĐÁM MÂY (user_app_state) =====
  // Mỗi lần lưu chỉ ghi đè khi bản trên mây chưa bị thiết bị khác sửa (khóa theo updated_at).
  // Bản sao trên máy (localStorage) giữ thay đổi chưa lên mây khi mất mạng hoặc đóng tab.
  const cloudVersionRef = useRef<string | null>(null);
  const cloudReadyRef = useRef(false);
  const cloudSnapshotRef = useRef<AppSnapshot | null>(null);
  const cloudPushingRef = useRef(false);
  const cloudPendingRef = useRef(false);
  const cloudCtxRef = useRef<CloudOwnerContext | null>(null);
  cloudCtxRef.current = cloudCtx;

  const applySnapshot = (s: AppSnapshot) => {
    setProperties(s.properties);
    setRooms(s.rooms);
    setTenants(s.tenants);
    setVehicles(s.vehicles);
    setContracts(s.contracts);
    setInvoices(s.invoices);
    setTransactions(s.transactions);
    if (!s.properties.some((p) => p.id === selectedPropertyId)) {
      setSelectedPropertyId(s.properties[0]?.id || '');
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
        const newVersion = new Date().toISOString();
        const row = { state: snapshot, schema_version: SHEETS_SYNC_SCHEMA, updated_at: newVersion };
        const res = cloudVersionRef.current
          ? await supabase
              .from('user_app_state')
              .update(row)
              .eq('owner_id', ctx.ownerId)
              .eq('updated_at', cloudVersionRef.current)
              .select('updated_at')
          : await supabase
              .from('user_app_state')
              .insert({ owner_id: ctx.ownerId, ...row })
              .select('updated_at');
        if (res.error) {
          // 23505: thiết bị khác vừa tạo sổ trước -> coi như xung đột
          setCloudStatus(
            res.error.code === '23505' ? 'conflict' : navigator.onLine ? 'error' : 'offline'
          );
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

  // Tìm sổ được làm việc: sổ của chính mình, hoặc sổ chủ trọ đã cấp quyền tài khoản phụ
  const resolveCloudOwner = async (userId: string) => {
    const own = await supabase
      .from('user_app_state')
      .select('state, updated_at')
      .eq('owner_id', userId)
      .maybeSingle();
    if (own.error || own.data) {
      return { ctx: { ownerId: userId, role: 'owner', propertyIds: null } as CloudOwnerContext, res: own };
    }
    const { data: links } = await supabase
      .from('property_staff')
      .select('owner_id, property_id, role')
      .neq('owner_id', userId);
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
    const res = await supabase
      .from('user_app_state')
      .select('state, updated_at')
      .eq('owner_id', ownerId)
      .maybeSingle();
    return { ctx, res };
  };

  // Tải sổ đám mây khi đăng nhập / quay lại từ Bản Demo
  const loadCloudStateForUser = async (userId: string, userEmail: string) => {
    cloudReadyRef.current = false;
    setCloudLoading(true);
    setCloudStatus('loading');
    try {
      const { ctx, res } = await resolveCloudOwner(userId);
      if (ctx.role !== 'owner' && !res.error && !res.data) {
        showToast('Chủ trọ chưa có sổ đám mây hoặc chưa cấp quyền cho tài khoản này.');
        setCloudStatus('error');
        setIsDemoMode(true);
        return;
      }
      const key = cloudCacheKey(ctx.ownerId, userId);
      const local = readCloudCache(key);
      const decision = decideStartState({
        local,
        remote: res.data
          ? { state: res.data.state, updatedAt: res.data.updated_at as string }
          : null,
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

      if (ctx.role === 'owner') {
        const { data: staffs } = await supabase
          .from('property_staff')
          .select('id, staff_email, role, can_record_meters, can_collect_payments, can_view_reports')
          .eq('owner_id', userId)
          .order('created_at', { ascending: false });
        if (staffs) setStaffList(staffs);
      }
    } finally {
      setCloudLoading(false);
    }
  };

  // Kiểm tra phiên đăng nhập Supabase khi mở ứng dụng
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        const u = { id: session.user.id, email: session.user.email || 'Chủ trọ' };
        setAuthUser(u);
        setIsDemoMode(false);
        loadCloudStateForUser(u.id, u.email);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAuthUser({ id: session.user.id, email: session.user.email || 'Chủ trọ' });
      } else {
        setAuthUser(null);
        setIsDemoMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Chuyển nhanh sang chế độ Bản Demo (12 phòng mẫu) khi đi gặp khách
  const handleSwitchToDemoMode = () => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProperties(parsed.properties || SEED_PROPERTIES);
        setRooms(parsed.rooms || SEED_ROOMS);
        setTenants(parsed.tenants || SEED_TENANTS);
        setVehicles(parsed.vehicles || SEED_VEHICLES);
        setContracts(parsed.contracts || SEED_CONTRACTS);
        setInvoices(parsed.invoices || SEED_INVOICES);
        setTransactions(parsed.transactions || SEED_TRANSACTIONS);
      } catch {
        setProperties(SEED_PROPERTIES);
        setRooms(SEED_ROOMS);
        setTenants(SEED_TENANTS);
        setVehicles(SEED_VEHICLES);
        setContracts(SEED_CONTRACTS);
        setInvoices(SEED_INVOICES);
        setTransactions(SEED_TRANSACTIONS);
      }
    }
    cloudReadyRef.current = false;
    setIsDemoMode(true);
    showToast('Đang ở Chế độ Bản Demo (12 phòng mẫu để giới thiệu khách hàng)');
  };

  const handleSignOutCloud = async () => {
    await supabase.auth.signOut();
    setAuthUser(null);
    setStaffList([]);
    setCloudCtx(null);
    setCloudStatus('idle');
    handleSwitchToDemoMode();
    showToast('Đã đăng xuất và quay về Bản Demo.');
  };

  // P1 #4 Chủ quyền dữ liệu: tải toàn bộ ra Excel, xoá tài khoản + dữ liệu trên máy chủ
  const handleExportXlsx = async () => {
    try {
      await downloadSnapshotXlsx(
        {
          properties,
          rooms,
          tenants: allTenants,
          vehicles: allVehicles,
          contracts: allContracts,
          invoices: allInvoices,
          transactions: allTransactions,
        },
        `QuanLyPhongTro-${today.split('/').reverse().join('-')}.xlsx`
      );
      showToast('Đã tải toàn bộ dữ liệu ra file Excel.');
    } catch {
      showToast('Không tạo được file Excel trên bản này, hãy dùng bản web.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!authUser || cloudCtx?.role !== 'owner') return;
    const typed = window.prompt(
      `Xoá vĩnh viễn tài khoản và TOÀN BỘ dữ liệu trên máy chủ, không khôi phục được. Nên bấm "Tải toàn bộ dữ liệu" trước.\nGõ email ${authUser.email} để xác nhận:`
    );
    if ((typed || '').trim().toLowerCase() !== authUser.email.toLowerCase()) {
      showToast('Email không khớp, chưa xoá gì.');
      return;
    }
    const { error } = await supabase.rpc('delete_my_account');
    if (error) {
      showToast('Không xoá được tài khoản: ' + error.message);
      return;
    }
    Object.keys(localStorage)
      .filter((k) => k.startsWith('qlpt-cloud-') && k.includes(authUser.id))
      .forEach((k) => localStorage.removeItem(k));
    await handleSignOutCloud();
    showToast('Đã xoá tài khoản và toàn bộ dữ liệu trên máy chủ.');
  };

  const handleAddPropertyStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authUser) {
      setIsAuthModalOpen(true);
      return;
    }
    const emailClean = newStaffEmail.trim().toLowerCase();
    if (!emailClean) return;

    const { data, error } = await supabase
      .from('property_staff')
      .upsert(
        {
          owner_id: authUser.id,
          property_id: currentProperty.id,
          staff_email: emailClean,
          role: newStaffRole,
          can_record_meters: true,
          can_collect_payments: newStaffRole === 'staff',
          can_view_reports: false,
        },
        { onConflict: 'owner_id,property_id,staff_email' }
      )
      .select('id, staff_email, role, can_record_meters, can_collect_payments, can_view_reports')
      .single();

    if (error) {
      showToast('Không thêm được tài khoản phụ: ' + error.message);
      return;
    }
    if (data) {
      setStaffList((prev) => [data, ...prev.filter((item) => item.id !== data.id)]);
      setNewStaffEmail('');
      showToast(`Đã phân quyền cho ${emailClean} vào cơ sở ${currentProperty.name}!`);
    }
  };

  const handleRemovePropertyStaff = async (staffId: string, staffEmail: string) => {
    const { error } = await supabase.from('property_staff').delete().eq('id', staffId);
    if (!error) {
      setStaffList((prev) => prev.filter((item) => item.id !== staffId));
      showToast(`Đã thu hồi quyền của ${staffEmail}`);
    }
  };

  // Lưu tự động: Bản Demo -> localStorage; Tài khoản thật -> bản sao trên máy ngay, đẩy lên mây sau 800ms
  useEffect(() => {
    const snapshot: AppSnapshot = {
      properties,
      rooms,
      tenants: allTenants,
      vehicles: allVehicles,
      contracts: allContracts,
      invoices: allInvoices,
      transactions: allTransactions,
    };

    if (isDemoMode || !authUser) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
      return;
    }
    if (!cloudReadyRef.current || !cloudCtx) return;

    const prev = cloudSnapshotRef.current;
    const unchanged =
      prev &&
      (Object.keys(snapshot) as (keyof AppSnapshot)[]).every((k) => prev[k] === snapshot[k]);
    if (unchanged) return;

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
  }, [
    properties,
    rooms,
    allTenants,
    allVehicles,
    allContracts,
    allInvoices,
    allTransactions,
    isDemoMode,
    authUser,
    cloudCtx,
  ]);

  const loadPaymentReports = async () => {
    const ctx = cloudCtxRef.current;
    if (!ctx) return;
    const { data, error } = await supabase
      .from('invoice_payment_reports')
      .select('id, invoice_code, room_code, property_id, amount, payer_note, created_at')
      .eq('owner_id', ctx.ownerId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    if (!error && data) setPaymentReports(data);
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

  // Tài khoản Cloud: mỗi hóa đơn có mã ngẫu nhiên khó đoán để người thuê mở trang hóa đơn từ Zalo
  useEffect(() => {
    if (isDemoMode || !zaloModalInvoice || zaloModalInvoice.publicToken) return;
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const token = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    const updated = { ...zaloModalInvoice, publicToken: token };
    setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
    setZaloModalInvoice(updated);
  }, [zaloModalInvoice, isDemoMode]);

  // Mất mạng / lỗi máy chủ: thử lại khi có mạng và mỗi 30 giây
  useEffect(() => {
    if (isDemoMode || !authUser || (cloudStatus !== 'error' && cloudStatus !== 'offline')) return;
    const retry = () => {
      if (cloudReadyRef.current) pushCloudNow(authUser.id);
    };
    window.addEventListener('online', retry);
    const iv = setInterval(retry, 30000);
    return () => {
      window.removeEventListener('online', retry);
      clearInterval(iv);
    };
  }, [isDemoMode, authUser, cloudStatus]);

  // Hỗ trợ phím Escape đóng hộp thoại đang mở
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsContractModalOpen(false);
        setIsMeterModalOpen(false);
        setZaloModalInvoice(null);
        setCollectModalInvoice(null);
        setEditInvoice(null);
        setIsElecToolOpen(false);
        setIsTempResidenceOpen(false);
        setIsRoomPricingOpen(false);
        setIsPhoneQrOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Tài khoản phụ: không xem báo cáo/lợi nhuận/quỹ, chỉ thấy cơ sở được cấp quyền
  const canViewReports = isDemoMode || !cloudCtx || cloudCtx.role === 'owner';
  const visibleProperties = useMemo(
    () =>
      !isDemoMode && cloudCtx?.propertyIds
        ? properties.filter((p) => cloudCtx.propertyIds!.includes(p.id))
        : properties,
    [properties, isDemoMode, cloudCtx]
  );
  const renderNoPermission = () => (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-sm text-slate-600">
      Tài khoản phụ chỉ ghi số điện nước, lập hóa đơn và thu tiền. Mục này do chủ trọ quản lý.
    </div>
  );

  const currentProperty = useMemo(
    () =>
      visibleProperties.find((p) => p.id === selectedPropertyId) ||
      visibleProperties[0] ||
      properties[0],
    [properties, visibleProperties, selectedPropertyId]
  );

  // Lọc toàn bộ dữ liệu theo cơ sở nhà trọ đang chọn trên thanh đầu trang (Bug 1)
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
    () => allTransactions.filter((tx) => tx.propertyId === currentProperty.id),
    [allTransactions, currentProperty.id]
  );

  // Biểu đồ: Bản Demo giữ số liệu mẫu 5 kỳ; tài khoản thật tính từ sổ thu chi. Lịch luôn tính từ dữ liệu.
  const monthlyChart = useMemo(
    () => (isDemoMode ? SEED_MONTHLY_CHART : buildMonthlyChart(transactions, curMonth)),
    [isDemoMode, transactions, curMonth]
  );
  const calendarEvents = useMemo(
    () => buildCalendarEvents({ today, curMonth, rooms: propertyRooms, invoices, contracts }),
    [today, curMonth, propertyRooms, invoices, contracts]
  );

  const occupiedRooms = useMemo(
    () => propertyRooms.filter((r) => r.status === 'occupied'),
    [propertyRooms]
  );
  const vacantRooms = useMemo(
    () => propertyRooms.filter((r) => r.status === 'vacant'),
    [propertyRooms]
  );
  const maintenanceRooms = useMemo(
    () => propertyRooms.filter((r) => r.status === 'maintenance'),
    [propertyRooms]
  );

  const occupancyRate = useMemo(() => {
    if (propertyRooms.length === 0) return 0;
    return Math.round((occupiedRooms.length / propertyRooms.length) * 100);
  }, [occupiedRooms.length, propertyRooms.length]);

  const totalMonthlyContractRent = useMemo(
    () => occupiedRooms.reduce((sum, r) => sum + r.price, 0),
    [occupiedRooms]
  );

  const monthlyVacancyLoss = useMemo(
    () => vacantRooms.reduce((sum, r) => sum + r.price, 0),
    [vacantRooms]
  );

  // Thu hôm nay
  const collectedToday = useMemo(
    () =>
      transactions
        .filter((t) => t.date === today && t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions, today]
  );

  // Lợi nhuận tháng này
  const currentMonthProfit = useMemo(() => {
    const octTx = transactions.filter((t) => t.date.endsWith('/' + periodLabel));
    const inc = octTx
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + t.amount, 0);
    const exp = octTx
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    return inc - exp;
  }, [transactions, periodLabel]);

  // Hóa đơn quá hạn (các kỳ trước kỳ hiện tại chưa thu đủ)
  const overdueInvoices = useMemo(
    () =>
      invoices.filter(
        (i) => i.billingMonth < curMonth && i.totalAmount - i.paidAmount > 0
      ),
    [invoices, curMonth]
  );
  const overdueTotalAmount = useMemo(
    () =>
      overdueInvoices.reduce(
        (sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount),
        0
      ),
    [overdueInvoices]
  );

  // Hóa đơn tới hạn (kỳ hiện tại đã lập hóa đơn, chưa thu đủ)
  const dueSoonInvoices = useMemo(
    () =>
      invoices.filter(
        (i) =>
          i.billingMonth === curMonth &&
          i.status !== 'draft' &&
          i.totalAmount - i.paidAmount > 0
      ),
    [invoices, curMonth]
  );
  const dueSoonTotalAmount = useMemo(
    () =>
      dueSoonInvoices.reduce(
        (sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount),
        0
      ),
    [dueSoonInvoices]
  );

  // Hóa đơn nháp chờ lập (P103 kỳ 2026-10)
  const draftInvoices = useMemo(
    () => invoices.filter((i) => i.status === 'draft'),
    [invoices]
  );

  // Hóa đơn chưa gửi Zalo (trong kỳ hiện tại)
  const unsentInvoices = useMemo(
    () =>
      invoices.filter(
        (i) => i.billingMonth === curMonth && i.status !== 'draft' && !i.sentZalo
      ),
    [invoices, curMonth]
  );

  // Khoản cọc chờ hoàn trả lại khách (P202 - Huỳnh Thị Hà - 909.334 đ)
  const getContractRefundAmount = (c: Contract) =>
    c.depositRefundAmount !== undefined
      ? c.depositRefundAmount
      : calculateDepositRefund(c.depositAmount, c.depositDeducted || 0).refundAmount;

  const pendingRefundContracts = useMemo(
    () =>
      contracts.filter(
        (c) =>
          c.status === 'terminated' &&
          !c.depositRefunded &&
          getContractRefundAmount(c) > 0
      ),
    [contracts]
  );
  const pendingRefundTotal = useMemo(
    () =>
      pendingRefundContracts.reduce(
        (sum, c) => sum + getContractRefundAmount(c),
        0
      ),
    [pendingRefundContracts]
  );

  // Toàn bộ hóa đơn còn nợ (mọi kỳ, trừ nháp)
  const allUnpaidInvoices = useMemo(
    () =>
      invoices.filter(
        (i) => i.status !== 'draft' && i.totalAmount - i.paidAmount > 0
      ),
    [invoices]
  );
  const quickCollectInvoice = useMemo(
    () => [...allUnpaidInvoices].sort((a, b) => a.billingMonth.localeCompare(b.billingMonth))[0],
    [allUnpaidInvoices]
  );
  const allUnpaidTotalAmount = useMemo(
    () =>
      allUnpaidInvoices.reduce(
        (sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount),
        0
      ),
    [allUnpaidInvoices]
  );

  // Tính công nợ và đã thu theo từng phòng từ hóa đơn thực tế (khớp với màn Công nợ & Báo cáo)
  const roomFinancialStats = useMemo(() => {
    const map: Record<string, { paid: number; debt: number }> = {};
    propertyRooms.forEach((r) => {
      map[r.code] = { paid: 0, debt: 0 };
    });
    invoices.forEach((inv) => {
      if (inv.status === 'draft') return;
      if (!map[inv.roomCode]) {
        map[inv.roomCode] = { paid: 0, debt: 0 };
      }
      map[inv.roomCode].paid += inv.paidAmount;
      map[inv.roomCode].debt += Math.max(0, inv.totalAmount - inv.paidAmount);
    });
    return map;
  }, [propertyRooms, invoices]);

  // ============================================================================
  // HÀNH ĐỘNG NGHIỆP VỤ (Tạo HĐ, Ghi điện nước, Thu tiền FIFO, Hoàn cọc, Đồng bộ)
  // ============================================================================

  // 1. Tạo hợp đồng mới (Bug 5: tính daysRemaining thực tế; Bug 6: tự động lập hóa đơn kỳ đầu)
  const handleCreateContract = (payload: {
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
  }) => {
    if (!propertyRooms.some((r) => r.code === payload.roomCode)) {
      showToast(`Không có phòng ${payload.roomCode || '(chưa chọn)'} trong ${currentProperty.name}`);
      return;
    }
    const newContractCode = nextCode('HD-', allContracts.map((c) => c.code));
    const newTenantId = `t-${Date.now()}`;
    const newTenantCode = nextCode('KH-', allTenants.map((t) => t.code));
    const realDaysRemaining = computeDaysRemaining(payload.endDate);

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
      daysRemaining: realDaysRemaining,
    };

    setContracts((prev) => [newContract, ...prev]);

    const targetRoom = rooms.find(
      (r) => r.code === payload.roomCode && r.propertyId === currentProperty.id
    );

    // Cập nhật trạng thái phòng sang Đã thuê
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

    // Thêm khách thuê mới
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

    // Tự động lập hóa đơn kỳ đầu tiên chia theo số ngày ở thật (Bug 6)
    const firstBillingMonth = extractBillingMonth(payload.startDate);
    const newInvoiceCode = nextCode('HD-IV-', allInvoices.map((i) => i.code), 100);
    const roomElec = targetRoom?.elecIndex ?? 0;
    const roomWater = targetRoom?.waterIndex ?? 0;
    const roomTrash = targetRoom?.trashFee ?? currentProperty.trashFee;
    const roomInternet = targetRoom?.internetFee ?? currentProperty.internetFee;
    const roomVehicles = targetRoom?.vehicleCount ?? 0;
    const roomVehicleAmt = roomVehicles * currentProperty.vehicleFee;
    const firstTotalAmount =
      payload.firstPeriodRent + roomTrash + roomInternet + roomVehicleAmt;

    const firstPeriodInvoice: Invoice = {
      id: `inv-first-${Date.now()}`,
      code: newInvoiceCode,
      propertyId: currentProperty.id,
      roomCode: payload.roomCode,
      floor: targetRoom?.floor ?? 1,
      tenantName: payload.tenantName,
      tenantPhone: payload.tenantPhone,
      contractCode: newContractCode,
      billingMonth: firstBillingMonth,
      periodLabel: payload.firstPeriodLabel,
      issueDate: payload.signDate,
      dueDate: payload.startDate,
      rentAmount: payload.firstPeriodRent,
      elecOld: roomElec,
      elecNew: roomElec,
      elecUsage: 0,
      elecRate: currentProperty.electricityRate,
      elecAmount: 0,
      waterOld: roomWater,
      waterNew: roomWater,
      waterUsage: 0,
      waterRate: currentProperty.waterRate,
      waterAmount: 0,
      trashAmount: roomTrash,
      internetAmount: roomInternet,
      vehicleCount: roomVehicles,
      vehicleAmount: roomVehicleAmt,
      totalAmount: firstTotalAmount,
      paidAmount: 0,
      status: 'unpaid',
      sentZalo: false,
      isOverdue: false,
    };

    setInvoices((prev) => [firstPeriodInvoice, ...prev]);

    // Nếu vừa nhận tiền cọc hôm nay, ghi vào sổ thu chi
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
      `Đã tạo hợp đồng ${newContractCode} & hóa đơn kỳ đầu ${newInvoiceCode} (${formatVND(
        payload.firstPeriodRent
      )})`
    );
  };

  // 2. Lưu chỉ số điện nước & lập hóa đơn hàng loạt
  const handleSaveReadingsAndCreateInvoices = (
    readings: Record<string, { elecNew: number; waterNew: number; photo?: string }>
  ) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.billingMonth !== invoiceMonth || inv.propertyId !== currentProperty.id) {
          return inv;
        }
        const rData = readings[inv.roomCode];
        if (!rData) {
          return inv.status === 'draft' ? { ...inv, status: 'unpaid' } : inv;
        }
        const calc = calculateInvoiceFromReadings(inv, rData);
        return {
          ...inv,
          elecNew: rData.elecNew,
          elecUsage: calc.elecUsage,
          elecAmount: calc.elecAmount,
          waterNew: rData.waterNew,
          waterUsage: calc.waterUsage,
          waterAmount: calc.waterAmount,
          totalAmount: calc.totalAmount,
          status: calc.status,
          meterPhoto: rData.photo || inv.meterPhoto,
        };
      })
    );
    showToast(`Đã cập nhật chỉ số điện nước và lập hóa đơn kỳ ${invoiceMonth}!`);
  };

  // 3. Thu tiền tự động trừ vào hóa đơn cũ nhất trước (FIFO)
  const handleConfirmCollectFIFO = (payload: {
    roomCode: string;
    amount: number;
    paymentDate: string;
    method: 'Chuyển khoản' | 'Tiền mặt';
    note: string;
    billImage?: string;
  }): FifoAllocatedItem[] => {
    const roomInvoices = invoices.filter((i) => i.roomCode === payload.roomCode);
    const { allocatedItems, updatedMap } = allocatePaymentFIFO(roomInvoices, payload.amount);
    const txIsoDate = vnToIsoDate(payload.paymentDate) || vnToIsoDate(today);

    const newTxList: CashTransaction[] = allocatedItems.map((item) => ({
      id: `tx-${item.invoiceCode}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      propertyId: currentProperty.id,
      date: payload.paymentDate,
      isoDate: txIsoDate,
      type: 'income',
      category: 'Thu tiền hóa đơn',
      roomCode: payload.roomCode,
      invoiceCode: item.invoiceCode,
      description: `Thu tiền phòng ${payload.roomCode} - HĐ ${item.invoiceCode}`,
      amount: item.amountAllocated,
      method: payload.method,
      billImage: payload.billImage,
    }));

    setInvoices((prev) =>
      prev.map((inv) => {
        const up = updatedMap[inv.id];
        if (!up) return inv;
        return {
          ...inv,
          paidAmount: inv.paidAmount + up.addPaid,
          status: up.newStatus,
        };
      })
    );

    // Đưa các phiếu thu mới lên đầu danh sách Hoạt động gần đây
    setTransactions((prev) => [...newTxList.reverse(), ...prev]);

    showToast(
      `Đã thu ${formatVND(payload.amount)} phòng ${payload.roomCode} (tự trừ ${
        allocatedItems.length
      } hóa đơn cũ nhất trước)`
    );

    return allocatedItems;
  };

  // 4. Hoàn trả tiền cọc cho khách đã trả phòng
  const handleMarkDepositRefunded = (contract: Contract) => {
    const refundAmt = getContractRefundAmount(contract);
    setContracts((prev) =>
      prev.map((c) =>
        c.id === contract.id ? { ...c, depositRefunded: true } : c
      )
    );
    if (refundAmt > 0) {
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
          amount: refundAmt,
          method: 'Chuyển khoản',
        },
        ...prev,
      ]);
    }
    showToast(
      `Đã xác nhận chuyển trả ${formatVND(refundAmt)} tiền cọc cho ${contract.tenantName}!`
    );
  };

  // 5. Đồng bộ 2 chiều với Google Sheets Web App (Apps Script)
  const handleSyncGoogleSheets = async () => {
    const failSync = (reason: string) => {
      setSyncStatus({ tone: 'error', text: 'Đồng bộ thất bại: ' + reason });
      showToast('Đồng bộ Google Sheets thất bại: ' + reason);
    };
    if (!sheetsWebAppUrl.startsWith('https://script.google.com/')) {
      failSync('URL Web App phải bắt đầu bằng https://script.google.com/');
      return;
    }
    if (!sheetsSyncToken.trim()) {
      failSync('chưa nhập mã đồng bộ (Cài đặt → Kết nối & Đồng bộ Google Sheets).');
      return;
    }
    setSyncStatus({ tone: 'pending', text: 'Đang đồng bộ lên Google Sheets...' });
    try {
      const payload = {
        action: 'syncState',
        schema: SHEETS_SYNC_SCHEMA,
        token: sheetsSyncToken.trim(),
        state: {
          properties,
          rooms,
          tenants: allTenants,
          vehicles: allVehicles,
          contracts: allContracts,
          invoices: allInvoices,
          transactions: allTransactions,
        },
      };
      // text/plain giữ request ở dạng "simple request" (không preflight) nên đọc được phản hồi JSON của Apps Script
      const res = await fetch(sheetsWebAppUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        failSync(`HTTP ${res.status}`);
        return;
      }
      const result = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
      if (!result || result.ok !== true) {
        failSync(result?.error || 'phản hồi không hợp lệ từ Apps Script.');
        return;
      }
      setSyncStatus({
        tone: 'success',
        text: 'Đã đồng bộ thành công với Google Sheets lúc ' + new Date().toLocaleTimeString('vi-VN'),
      });
      showToast('Đã đồng bộ toàn bộ 6 phân hệ lên Google Sheets!');
    } catch (err) {
      failSync(err instanceof Error ? err.message : 'không kết nối được tới Apps Script.');
    }
  };

  // 6. Khôi phục dữ liệu mẫu mặc định (Bug 2: có hộp thoại xác nhận)
  const handleResetDemoData = () => {
    if (
      !window.confirm(
        'Xoá toàn bộ dữ liệu đang có và nạp lại dữ liệu mẫu? Không hoàn tác được.'
      )
    ) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setProperties(SEED_PROPERTIES);
    setRooms(SEED_ROOMS);
    setTenants(SEED_TENANTS);
    setVehicles(SEED_VEHICLES);
    setContracts(SEED_CONTRACTS);
    setInvoices(SEED_INVOICES);
    setTransactions(SEED_TRANSACTIONS);
    showToast('Đã khôi phục dữ liệu mẫu mặc định!');
  };

  // 7. Điều chỉnh giá thuê phòng & tự động đồng bộ Hợp đồng + Hóa đơn chưa thu
  const handleSaveRoomPricing = (payload: {
    updates: RoomPriceUpdateItem[];
    syncActiveContracts: boolean;
    syncUnpaidInvoices: boolean;
  }) => {
    const updateByCode: Record<string, RoomPriceUpdateItem> = {};
    payload.updates.forEach((u) => {
      updateByCode[u.roomCode] = u;
    });

    // Cập nhật danh sách phòng
    setRooms((prev) =>
      prev.map((r) => {
        if (r.propertyId !== currentProperty.id) return r;
        const up = updateByCode[r.code];
        if (!up) return r;
        return {
          ...r,
          price: up.price,
          deposit: up.deposit,
          trashFee: up.trashFee,
          internetFee: up.internetFee,
          vehicleCount: up.vehicleCount,
          status: up.status,
          notes: up.notes !== undefined ? up.notes : r.notes,
        };
      })
    );

    // Đồng bộ Hợp đồng đang hiệu lực nếu được chọn
    if (payload.syncActiveContracts) {
      setContracts((prev) =>
        prev.map((c) => {
          if (c.propertyId !== currentProperty.id) return c;
          const up = updateByCode[c.roomCode];
          if (!up || c.status !== 'active') return c;
          return {
            ...c,
            rentAmount: up.price,
            depositAmount: up.deposit,
          };
        })
      );
    }

    // Đồng bộ Hóa đơn chưa thu / nháp từ kỳ hiện tại trở đi nếu được chọn
    if (payload.syncUnpaidInvoices) {
      setInvoices((prev) =>
        prev.map((inv) => {
          if (inv.propertyId !== currentProperty.id) return inv;
          const up = updateByCode[inv.roomCode];
          if (
            !up ||
            inv.status === 'paid' ||
            inv.billingMonth < curMonth
          ) {
            return inv;
          }
          const oldPrice = propertyRooms.find((r) => r.code === inv.roomCode)?.price ?? 0;
          return applyRoomPricingToInvoice(inv, up, currentProperty.vehicleFee, oldPrice);
        })
      );
    }

    if (payload.updates.length === 1) {
      const u = payload.updates[0];
      showToast(
        `Đã cập nhật giá thuê phòng ${u.roomCode}: ${formatVND(u.price)}/tháng${
          payload.syncActiveContracts ? ' (đã đồng bộ HĐ & Hóa đơn)' : ''
        }`
      );
    } else {
      showToast(
        `Đã cập nhật bảng giá thuê cho ${payload.updates.length} phòng thành công!`
      );
    }
  };

  // Kết quả tìm kiếm nhanh trên thanh Topbar
  const searchResults = useMemo(() => {
    const q = removeAccents(globalSearch.trim());
    if (!q) return [];
    const results: Array<{
      id: string;
      label: string;
      sub: string;
      badge: string;
      onClick: () => void;
    }> = [];

    propertyRooms.forEach((r) => {
      if (
        removeAccents(r.code).includes(q) ||
        removeAccents(r.tenantName || '').includes(q)
      ) {
        results.push({
          id: `sr-r-${r.id}`,
          label: `Phòng ${r.code} (${r.tenantName || 'Trống'})`,
          sub: `${formatVND(r.price)}/tháng · Tầng ${r.floor}`,
          badge: 'Phòng',
          onClick: () => {
            setActiveTab('rooms');
            setGlobalSearch('');
          },
        });
      }
    });

    tenants.forEach((t) => {
      if (
        removeAccents(t.name).includes(q) ||
        t.phone.includes(q) ||
        t.cccd.includes(q)
      ) {
        results.push({
          id: `sr-t-${t.id}`,
          label: `${t.name} (${t.roomCode})`,
          sub: `SĐT: ${t.phone} · CCCD: ${t.cccd}`,
          badge: 'Khách thuê',
          onClick: () => {
            setActiveTab('tenants');
            setTenantSubTab('tenants');
            setGlobalSearch('');
          },
        });
      }
    });

    invoices.forEach((inv) => {
      if (
        removeAccents(inv.code).includes(q) ||
        removeAccents(inv.roomCode).includes(q)
      ) {
        results.push({
          id: `sr-i-${inv.id}`,
          label: `${inv.code} · Phòng ${inv.roomCode} (${inv.billingMonth})`,
          sub: `Tổng: ${formatVND(inv.totalAmount)} · Khách: ${inv.tenantName}`,
          badge: 'Hóa đơn',
          onClick: () => {
            setInvoiceMonth(inv.billingMonth);
            setActiveTab('invoices');
            setGlobalSearch('');
          },
        });
      }
    });

    return results.slice(0, 8);
  }, [globalSearch, propertyRooms, tenants, invoices]);

  // ============================================================================
  // RENDER TỪNG MÀN HÌNH CHÍNH
  // ============================================================================

  // 1. TỔNG QUAN (DASHBOARD TRỰC QUAN + BIỂU ĐỒ)
  const renderOverview = () => {
    const octoberReceivableTotal = invoices
      .filter((i) => i.billingMonth === curMonth && i.status !== 'draft')
      .reduce((sum, i) => sum + i.totalAmount, 0);

    const octoberPaidTotal = invoices
      .filter((i) => i.billingMonth === curMonth && i.status !== 'draft')
      .reduce((sum, i) => sum + i.paidAmount, 0);

    const collectionRatePct =
      octoberReceivableTotal > 0
        ? Math.min(100, Math.round((octoberPaidTotal / octoberReceivableTotal) * 100))
        : 0;

    const safeRoomDenom = Math.max(1, propertyRooms.length);

    const weekday = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][
      (parseDateVN(today) ?? new Date()).getDay()
    ];
    const hour = new Date().getHours();
    const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

    // Dữ liệu cơ cấu khoản thu kỳ hiện tại (Tiền phòng, Điện, Nước, Dịch vụ & Xe)
    const octInvoicesActive = invoices.filter(
      (i) => i.billingMonth === curMonth && i.status !== 'draft'
    );
    const octRentSum = octInvoicesActive.reduce((s, i) => s + i.rentAmount, 0);
    const octElecSum = octInvoicesActive.reduce((s, i) => s + i.elecAmount, 0);
    const octWaterSum = octInvoicesActive.reduce((s, i) => s + i.waterAmount, 0);
    const octServiceSum = octInvoicesActive.reduce(
      (s, i) => s + i.trashAmount + i.internetAmount + i.vehicleAmount,
      0
    );
    const octBreakdownTotal = Math.max(
      1,
      octRentSum + octElecSum + octWaterSum + octServiceSum
    );

    const revenueSegments = [
      {
        label: 'Tiền thuê phòng',
        amount: octRentSum,
        pct: Math.round((octRentSum / octBreakdownTotal) * 100),
        color: '#2563EB',
        bgClass: 'bg-blue-600',
        badgeBg: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'Tiền điện',
        amount: octElecSum,
        pct: Math.round((octElecSum / octBreakdownTotal) * 100),
        color: '#F59E0B',
        bgClass: 'bg-amber-500',
        badgeBg: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Tiền nước',
        amount: octWaterSum,
        pct: Math.round((octWaterSum / octBreakdownTotal) * 100),
        color: '#06B6D4',
        bgClass: 'bg-cyan-500',
        badgeBg: 'bg-cyan-50 text-cyan-700',
      },
      {
        label: 'Rác · Wifi · Gửi xe',
        amount: octServiceSum,
        pct: octServiceSum === 0 ? 0 : Math.max(
          0,
          100 -
            Math.round((octRentSum / octBreakdownTotal) * 100) -
            Math.round((octElecSum / octBreakdownTotal) * 100) -
            Math.round((octWaterSum / octBreakdownTotal) * 100)
        ),
        color: '#10B981',
        bgClass: 'bg-emerald-500',
        badgeBg: 'bg-emerald-50 text-emerald-700',
      },
    ];

    // Thang đo biểu đồ 5 tháng
    const dashboardMaxChart = Math.max(
      1,
      ...monthlyChart.map((d) => Math.max(d.income, d.expense, d.profit))
    );

    // Thông số SVG Donut cho Trạng thái phòng (r = 44 => chu vi C ≈ 276.46)
    const donutRadius = 44;
    const donutCircumference = 2 * Math.PI * donutRadius;
    const occDash = (occupiedRooms.length / safeRoomDenom) * donutCircumference;
    const vacDash = (vacantRooms.length / safeRoomDenom) * donutCircumference;
    const maintDash = (maintenanceRooms.length / safeRoomDenom) * donutCircumference;

    const todoItems = [
      {
        id: 'todo-1',
        borderColor: 'border-l-amber-400',
        icon: <Droplets className="w-4 h-4 text-amber-500" />,
        iconBg: 'bg-amber-50',
        title: `${maintenanceRooms.length} phòng chưa ghi chỉ số tháng này`,
        subtitle:
          maintenanceRooms.length > 0
            ? maintenanceRooms.map((r) => r.code).join(', ')
            : 'Đã ghi đủ chỉ số các phòng',
        actionLabel: 'Ghi chỉ số',
        onClick: () => {
          setMeterInitialRoom(maintenanceRooms[0]?.code || propertyRooms[0]?.code || 'P101');
          setIsMeterModalOpen(true);
        },
      },
      {
        id: 'todo-2',
        borderColor: 'border-l-blue-500',
        icon: <Receipt className="w-4 h-4 text-blue-600" />,
        iconBg: 'bg-blue-50',
        title: `${draftInvoices.length} phòng chưa lập hóa đơn tháng này`,
        subtitle: 'Phòng đã ghi chỉ số sẽ tính ra tiền ngay.',
        actionLabel: 'Lập hóa đơn',
        onClick: () => {
          setInvoiceMonth(curMonth);
          setActiveTab('invoices');
        },
      },
      {
        id: 'todo-3',
        borderColor: 'border-l-blue-500',
        icon: <Send className="w-4 h-4 text-blue-600" />,
        iconBg: 'bg-blue-50',
        title: `${unsentInvoices.length} hóa đơn chưa gửi cho khách`,
        subtitle: 'Sao chép tin nhắn kèm mã QR rồi gửi qua Zalo.',
        actionLabel: 'Gửi',
        onClick: () => {
          setInvoiceMonth(nextMonth);
          setActiveTab('invoices');
        },
      },
      {
        id: 'todo-4',
        borderColor: 'border-l-rose-500',
        icon: <AlertTriangle className="w-4 h-4 text-rose-500" />,
        iconBg: 'bg-rose-50',
        title: `${overdueInvoices.length} hóa đơn quá hạn - ${formatVND(
          overdueTotalAmount
        )}`,
        subtitle: 'Đã qua hạn thanh toán mà chưa thu đủ.',
        actionLabel: 'Xem công nợ',
        onClick: () => {
          setFinanceExpanded(true);
          setActiveTab('finance-debts');
        },
      },
      {
        id: 'todo-5',
        borderColor: 'border-l-amber-400',
        icon: <Clock className="w-4 h-4 text-amber-600" />,
        iconBg: 'bg-amber-50',
        title: `${dueSoonInvoices.length} hóa đơn tới hạn trong 5 ngày - ${formatVND(
          dueSoonTotalAmount
        )}`,
        subtitle: 'Nhắc trước để khách kịp chuẩn bị, đỡ phải đòi khi đã quá hạn.',
        actionLabel: 'Thu nợ',
        onClick: () => {
          setInvoiceMonth(curMonth);
          setActiveTab('invoices');
        },
      },
      {
        id: 'todo-6',
        borderColor: 'border-l-amber-400',
        icon: <Wallet className="w-4 h-4 text-amber-600" />,
        iconBg: 'bg-amber-50',
        title: `${pendingRefundContracts.length} khoản cọc chờ trả lại khách - ${formatVND(
          pendingRefundTotal
        )}`,
        subtitle:
          pendingRefundContracts.length > 0
            ? `${pendingRefundContracts[0].roomCode} (${pendingRefundContracts[0].tenantName})`
            : 'Đã hoàn trả toàn bộ cọc',
        actionLabel: 'Xem',
        onClick: () => {
          setFinanceExpanded(true);
          setActiveTab('finance-deposits');
        },
      },
      {
        id: 'todo-7',
        borderColor: 'border-l-blue-500',
        icon: <LayoutGrid className="w-4 h-4 text-blue-600" />,
        iconBg: 'bg-blue-50',
        title: `${vacantRooms.length} phòng đang trống`,
        subtitle: vacantRooms.map((r) => r.code).join(', ') || 'Không có phòng trống',
        actionLabel: 'Xem sơ đồ',
        onClick: () => setActiveTab('rooms'),
      },
    ];

    return (
      <div className="space-y-6 ui-enter">
        {/* Title + Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Tổng quan vận hành
              </h1>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold border border-blue-200/60">
                {currentProperty.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {greeting} · {weekday}, ngày {today}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMeterInitialRoom(occupiedRooms[0]?.code);
                setIsMeterModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold shadow-2xs transition"
            >
              <Droplets className="w-3.5 h-3.5 text-blue-600" />
              <span>Ghi điện nước</span>
            </button>
            <button
              type="button"
              onClick={() => openRoomPricingModal(propertyRooms[0]?.code || 'P101', 'bulk')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 text-xs font-semibold shadow-2xs transition"
            >
              <Pencil className="w-3.5 h-3.5 text-blue-600" />
              <span>Bảng giá phòng</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setContractInitialRoom(vacantRooms[0]?.code);
                setIsContractModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Lập hợp đồng</span>
            </button>
          </div>
        </div>

        {/* Phòng vừa báo "Tôi đã chuyển" (trang hóa đơn người thuê) */}
        {paymentReports.filter((r) => r.property_id === currentProperty.id).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs" data-testid="payment-reports">
            <div className="font-bold text-amber-900">
              Phòng vừa báo đã chuyển tiền — đối chiếu biến động số dư của bạn rồi bấm Xác nhận
            </div>
            {paymentReports
              .filter((r) => r.property_id === currentProperty.id)
              .map((r) => {
                const inv = invoices.find((i) => i.code === r.invoice_code);
                return (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-xl border border-amber-100 px-3 py-2">
                    <div>
                      <strong>{r.room_code}</strong> · {r.invoice_code} · <strong className="tabular-nums">{formatVND(r.amount)}</strong>
                      {r.payer_note ? <span className="text-slate-500"> · {r.payer_note}</span> : null}
                      <span className="text-slate-400"> · {new Date(r.created_at).toLocaleString('vi-VN')}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        disabled={!inv}
                        onClick={() => {
                          if (!inv) return;
                          setConfirmingReport({ id: r.id, amount: r.amount });
                          setCollectModalInvoice(inv);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-40"
                      >
                        Xác nhận
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportStatus(r.id, 'dismissed')}
                        className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 font-semibold"
                      >
                        Bỏ qua
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* P1 #5: Tổng quan tất cả khu (chỉ hiện khi có từ 2 khu) */}
        {visibleProperties.length > 1 && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs text-xs" data-testid="all-properties">
            <div className="font-bold text-slate-800 mb-2">Tất cả khu · kỳ {periodLabel}</div>
            <div className="overflow-x-auto">
              <table className="w-full tabular-nums">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="py-1.5 pr-3 font-medium">Khu</th>
                    <th className="py-1.5 px-2 font-medium text-right">Đang thuê</th>
                    <th className="py-1.5 px-2 font-medium text-right hidden sm:table-cell">Phòng trống</th>
                    {canViewReports && <th className="py-1.5 px-2 font-medium text-right hidden sm:table-cell">Đã thu kỳ này</th>}
                    <th className="py-1.5 pl-2 font-medium text-right">Còn nợ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {summarizeProperties({
                    properties: visibleProperties,
                    rooms,
                    invoices: allInvoices,
                    transactions: allTransactions,
                    curMonth,
                  }).map((row) => (
                    <tr
                      key={row.id}
                      onClick={() => setSelectedPropertyId(row.id)}
                      className={`cursor-pointer hover:bg-slate-50 ${row.id === currentProperty.id ? 'font-bold text-blue-700' : ''}`}
                    >
                      <td className="py-1.5 pr-3">{row.name}</td>
                      <td className="py-1.5 px-2 text-right">{row.occupied}/{row.rooms}</td>
                      <td className={`py-1.5 px-2 text-right hidden sm:table-cell ${row.vacant > 0 ? 'text-emerald-600' : ''}`}>{row.vacant}</td>
                      {canViewReports && <td className="py-1.5 px-2 text-right whitespace-nowrap hidden sm:table-cell">{formatVND(row.collected)}</td>}
                      <td className={`py-1.5 pl-2 text-right whitespace-nowrap ${row.debt > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{formatVND(row.debt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 4 Top KPI Cards with Mini Visuals */}
        <div
          className={`grid grid-cols-1 ${
            isMobilePreview ? 'gap-3' : 'sm:grid-cols-2 xl:grid-cols-4 gap-4'
          }`}
        >
          {/* Card 1: Tỷ lệ lấp đầy */}
          <div
            onClick={() => setActiveTab('rooms')}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-blue-300 cursor-pointer transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <LayoutGrid className="w-4 h-4" />
                </span>
                <span className="font-semibold text-slate-700">
                  Tỷ lệ lấp đầy ({occupiedRooms.length}/{propertyRooms.length} phòng)
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold">
                {vacantRooms.length} trống
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
                  {occupancyRate}%
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Giá trị HĐ: {formatVND(totalMonthlyContractRent)}/tháng
                </div>
              </div>
              {/* Mini room pill bar */}
              <div className="flex items-center gap-0.5">
                {propertyRooms.slice(0, 12).map((r) => (
                  <span
                    key={r.id}
                    title={`${r.code}: ${r.status}`}
                    className={`w-1.5 h-6 rounded-full ${
                      r.status === 'occupied'
                        ? 'bg-blue-600'
                        : r.status === 'vacant'
                          ? 'bg-emerald-400'
                          : 'bg-rose-400'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-teal-500 transition-all"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>

          {/* Card 2: Thu hôm nay */}
          <div
            onClick={() => setActiveTab('finance-cashbook')}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-emerald-300 cursor-pointer transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
                <span className="font-semibold text-slate-700">Thu hôm nay</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                Khớp VietQR
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-2xl font-extrabold text-emerald-600 tabular-nums">
                  {formatVND(collectedToday)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Đã thu kỳ 10: {formatVND(octoberPaidTotal)} ({collectionRatePct}%)
                </div>
              </div>
              <svg viewBox="0 0 64 28" className="w-16 h-7 shrink-0">
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="2,22 16,18 30,20 44,10 62,4"
                />
              </svg>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all"
                style={{ width: `${collectionRatePct}%` }}
              />
            </div>
          </div>

          {/* Card 3: Lợi nhuận tháng này */}
          {canViewReports && (
          <div
            onClick={() => setActiveTab('reports')}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-blue-300 cursor-pointer transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="font-semibold text-slate-700">Lợi nhuận tháng này</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                Kỳ {periodLabel}
              </span>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <div
                  className={`text-2xl font-extrabold tabular-nums ${
                    currentMonthProfit < 0 ? 'text-rose-600' : 'text-slate-900'
                  }`}
                >
                  {formatVND(currentMonthProfit)}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Thực thu trừ chi phí vận hành & hoàn cọc
                </div>
              </div>
              <div className="flex items-end gap-1 h-7">
                {monthlyChart.map((m, i) => (
                  <span
                    key={m.month}
                    className={`w-2 rounded-t ${
                      i === monthlyChart.length - 1 ? 'bg-indigo-600' : 'bg-indigo-200'
                    }`}
                    style={{
                      height: `${Math.max(25, Math.round((m.profit / dashboardMaxChart) * 100))}%`,
                    }}
                  />
                ))}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-600 w-4/5" />
            </div>
          </div>

          )}

          {/* Card 4: Tổng công nợ cần thu */}
          <div
            onClick={() => {
              setFinanceExpanded(true);
              setActiveTab('finance-debts');
            }}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:border-rose-300 cursor-pointer transition flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle className="w-4 h-4" />
                </span>
                <span className="font-semibold text-slate-700">Công nợ cần thu</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold">
                {overdueInvoices.length} quá hạn
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-rose-600 tabular-nums">
                {formatVND(overdueTotalAmount + dueSoonTotalAmount)}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                Quá hạn: {formatVND(overdueTotalAmount)} · Tới hạn: {formatVND(dueSoonTotalAmount)}
              </div>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden flex">
              <div
                className="h-full bg-rose-500"
                style={{
                  width: `${
                    overdueTotalAmount + dueSoonTotalAmount > 0
                      ? Math.round(
                          (overdueTotalAmount / (overdueTotalAmount + dueSoonTotalAmount)) * 100
                        )
                      : 0
                  }%`,
                }}
              />
              <div className="h-full bg-amber-400 flex-1" />
            </div>
          </div>
        </div>

        {/* ROW BIỂU ĐỒ TRỰC QUAN: Biểu đồ Xu hướng Dòng tiền 5 tháng + Biểu đồ Tròn Donut Trạng thái & Cơ cấu Thu */}
        <div
          className={`grid grid-cols-1 ${
            isMobilePreview ? 'gap-5' : 'xl:grid-cols-3 gap-6'
          }`}
        >
          {/* Biểu đồ kết hợp Cột + Đường: Xu hướng Doanh thu · Chi phí · Lợi nhuận */}
          <div
            className={`bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between ${
              isMobilePreview ? '' : 'xl:col-span-2'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Biểu đồ Dòng tiền & Lợi nhuận qua các kỳ</span>
                </h2>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rê chuột vào từng tháng để xem chi tiết Thu · Chi · Lợi nhuận ròng
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" /> Doanh thu
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Chi phí
                </span>
                <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Lợi nhuận
                </span>
              </div>
            </div>

            <div className="relative h-56 w-full pt-2">
              <svg viewBox="0 0 720 205" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="dashIncomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.85" />
                  </linearGradient>
                  <linearGradient id="dashProfitArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0.01" />
                  </linearGradient>
                </defs>

                {/* Đường lưới ngang */}
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const y = 170 - ratio * 140;
                  const valLabel = Math.round((dashboardMaxChart * ratio) / 1000000);
                  return (
                    <g key={idx}>
                      <line
                        x1="46"
                        y1={y}
                        x2="690"
                        y2={y}
                        stroke="#F1F5F9"
                        strokeWidth="1"
                      />
                      <text
                        x="38"
                        y={y + 4}
                        textAnchor="end"
                        className="fill-slate-400 text-[10px] tabular-nums"
                      >
                        {valLabel === 0 ? '0' : `${valLabel}tr`}
                      </text>
                    </g>
                  );
                })}

                {/* Vùng màu dưới đường lợi nhuận */}
                <polygon
                  points={[
                    '115,170',
                    ...monthlyChart.map((pt, i) => {
                      const x = 115 + i * 130;
                      const y = 170 - (pt.profit / dashboardMaxChart) * 140;
                      return `${x},${y}`;
                    }),
                    `${115 + (monthlyChart.length - 1) * 130},170`,
                  ].join(' ')}
                  fill="url(#dashProfitArea)"
                />

                {/* Cột Doanh thu & Chi phí */}
                {monthlyChart.map((pt, i) => {
                  const xCenter = 115 + i * 130;
                  const incH = (pt.income / dashboardMaxChart) * 140;
                  const expH = Math.max(4, (pt.expense / dashboardMaxChart) * 140);
                  const isHovered = hoveredChartIdx === i;
                  return (
                    <g
                      key={pt.month}
                      onMouseEnter={() => setHoveredChartIdx(i)}
                      onMouseLeave={() => setHoveredChartIdx(null)}
                      className="cursor-pointer"
                    >
                      {isHovered && (
                        <rect
                          x={xCenter - 38}
                          y="20"
                          width="76"
                          height="152"
                          rx="8"
                          fill="#F8FAFC"
                        />
                      )}
                      {/* Cột Thu */}
                      <rect
                        x={xCenter - 22}
                        y={170 - incH}
                        width="20"
                        height={incH}
                        rx="4"
                        fill="url(#dashIncomeGrad)"
                      />
                      {/* Cột Chi */}
                      <rect
                        x={xCenter + 2}
                        y={170 - expH}
                        width="18"
                        height={expH}
                        rx="4"
                        fill="#F59E0B"
                      />
                      {/* Giá trị tóm tắt trên đỉnh cột */}
                      <text
                        x={xCenter - 12}
                        y={170 - incH - 5}
                        textAnchor="middle"
                        className="fill-blue-700 text-[9px] font-bold tabular-nums"
                      >
                        {(pt.income / 1000000).toFixed(1)}tr
                      </text>
                      {/* Nhãn trục X */}
                      <text
                        x={xCenter}
                        y="190"
                        textAnchor="middle"
                        className="fill-slate-600 text-[10px] font-semibold tabular-nums"
                      >
                        {pt.month}
                      </text>
                    </g>
                  );
                })}

                {/* Đường biểu diễn Lợi nhuận */}
                <polyline
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={monthlyChart.map((pt, i) => {
                    const x = 115 + i * 130;
                    const y = 170 - (pt.profit / dashboardMaxChart) * 140;
                    return `${x},${y}`;
                  }).join(' ')}
                />

                {/* Điểm tròn Lợi nhuận */}
                {monthlyChart.map((pt, i) => {
                  const x = 115 + i * 130;
                  const y = 170 - (pt.profit / dashboardMaxChart) * 140;
                  return (
                    <circle
                      key={pt.month}
                      cx={x}
                      cy={y}
                      r={hoveredChartIdx === i ? '5.5' : '4'}
                      className="fill-emerald-500 stroke-white stroke-2 transition-all"
                    />
                  );
                })}
              </svg>

              {hoveredChartIdx !== null && (
                <div className="absolute top-1 right-2 bg-slate-900/95 text-white rounded-xl px-3.5 py-2 text-xs shadow-xl space-y-0.5 pointer-events-none">
                  <div className="font-bold text-slate-200">
                    Kỳ {monthlyChart[hoveredChartIdx].month}
                  </div>
                  <div className="text-sky-300 tabular-nums">
                    Thu: {formatVND(monthlyChart[hoveredChartIdx].income)}
                  </div>
                  <div className="text-amber-300 tabular-nums">
                    Chi: {formatVND(monthlyChart[hoveredChartIdx].expense)}
                  </div>
                  <div className="text-emerald-300 font-bold tabular-nums">
                    Lợi nhuận: {formatVND(monthlyChart[hoveredChartIdx].profit)}
                  </div>
                </div>
              )}
            </div>

            {/* Cơ cấu doanh thu hóa đơn tháng (Stacked Progress Bar) */}
            <div className="pt-4 mt-2 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800">
                  Cơ cấu khoản thu hóa đơn kỳ {periodLabel}
                </span>
                <span className="text-slate-500 font-semibold tabular-nums">
                  Tổng lập HĐ: {formatVND(octoberReceivableTotal)}
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden flex gap-0.5">
                {revenueSegments.map((seg) => (
                  <div
                    key={seg.label}
                    className={`${seg.bgClass} h-full transition-all`}
                    style={{ width: `${Math.max(4, seg.pct)}%` }}
                    title={`${seg.label}: ${formatVND(seg.amount)} (${seg.pct}%)`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-0.5">
                {revenueSegments.map((seg) => (
                  <div
                    key={seg.label}
                    className="p-2 rounded-xl bg-slate-50/80 border border-slate-100 text-[11px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium truncate">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: seg.color }}
                        />
                        <span className="truncate">{seg.label}</span>
                      </span>
                      <span className="font-bold text-slate-500">{seg.pct}%</span>
                    </div>
                    <div className="font-extrabold text-slate-900 mt-0.5 tabular-nums">
                      {formatVND(seg.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Cột phải: Biểu đồ Tròn Donut Trạng thái Phòng + Sơ đồ Ô Phòng Nhanh */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Biểu đồ Trạng thái phòng
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('rooms')}
                  className="text-xs font-semibold text-blue-600 hover:underline"
                >
                  Mở sơ đồ phòng →
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Phân bổ {propertyRooms.length} phòng tại {currentProperty.name}
              </p>
            </div>

            {/* SVG Donut Chart + Legend */}
            <div className="flex items-center gap-4">
              <div className="relative w-28 h-28 shrink-0">
                <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
                  <circle
                    cx="55"
                    cy="55"
                    r={donutRadius}
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="12"
                  />
                  {/* Đã thuê (Blue) */}
                  <circle
                    cx="55"
                    cy="55"
                    r={donutRadius}
                    fill="none"
                    stroke="#2563EB"
                    strokeWidth="12"
                    strokeDasharray={`${occDash} ${donutCircumference}`}
                    strokeDashoffset="0"
                    strokeLinecap="butt"
                  />
                  {/* Trống (Emerald) */}
                  <circle
                    cx="55"
                    cy="55"
                    r={donutRadius}
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="12"
                    strokeDasharray={`${vacDash} ${donutCircumference}`}
                    strokeDashoffset={-occDash}
                    strokeLinecap="butt"
                  />
                  {/* Đang sửa chữa (Rose) */}
                  <circle
                    cx="55"
                    cy="55"
                    r={donutRadius}
                    fill="none"
                    stroke="#F43F5E"
                    strokeWidth="12"
                    strokeDasharray={`${maintDash} ${donutCircumference}`}
                    strokeDashoffset={-(occDash + vacDash)}
                    strokeLinecap="butt"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                    {occupancyRate}%
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">
                    Lấp đầy
                  </span>
                </div>
              </div>

              <div className="flex-1 space-y-2 text-xs tabular-nums">
                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50/60 border border-blue-100">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    Đã thuê
                  </span>
                  <span className="font-bold text-blue-700">
                    {occupiedRooms.length} phòng
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-50/60 border border-emerald-100">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Trống
                  </span>
                  <span className="font-bold text-emerald-700">
                    {vacantRooms.length} phòng
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-rose-50/60 border border-rose-100">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-slate-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Đang sửa chữa
                  </span>
                  <span className="font-bold text-rose-700">
                    {maintenanceRooms.length} phòng
                  </span>
                </div>
              </div>
            </div>

            {/* Bản đồ nhiệt trạng thái từng phòng (Interactive Room Matrix) */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">
                  Bản đồ nhanh {propertyRooms.length} phòng (Bấm để xem):
                </span>
                <span>Xanh dương: Đang ở · Xanh lá: Trống</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {propertyRooms.map((r) => {
                  const hasDebt = invoices.some(
                    (inv) =>
                      inv.roomCode === r.code &&
                      inv.status !== 'draft' &&
                      inv.totalAmount - inv.paidAmount > 0
                  );
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => setActiveTab('rooms')}
                      className={`p-2 rounded-xl border text-left transition flex flex-col justify-between ${
                        r.status === 'occupied'
                          ? 'bg-blue-50/50 border-blue-200 hover:bg-blue-100/70'
                          : r.status === 'vacant'
                            ? 'bg-emerald-50/70 border-emerald-200 hover:bg-emerald-100/70'
                            : 'bg-rose-50/70 border-rose-200 hover:bg-rose-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-xs font-extrabold text-slate-900">
                          {r.code}
                        </span>
                        {hasDebt && (
                          <span
                            title="Còn nợ hóa đơn"
                            className="w-2 h-2 rounded-full bg-rose-500"
                          />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate mt-0.5">
                        {r.tenantName ? r.tenantName.split(' ').slice(-2).join(' ') : r.status === 'maintenance' ? 'Đang sửa' : 'Phòng trống'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid: Left (Việc cần làm hôm nay + Hoạt động gần đây) + Right (Tiến độ thu tháng này) */}
        <div
          className={`grid grid-cols-1 ${
            isMobilePreview ? 'gap-5' : 'xl:grid-cols-3 gap-6'
          }`}
        >
          <div className={isMobilePreview ? 'space-y-5' : 'xl:col-span-2 space-y-6'}>
            {/* Việc cần làm hôm nay */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900">
                  Việc cần làm hôm nay
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold tabular-nums">
                  7 việc
                </span>
              </div>

              <div className="space-y-2.5">
                {todoItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={item.onClick}
                    className={`flex items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/70 hover:bg-slate-100/80 border border-slate-100 border-l-4 ${item.borderColor} cursor-pointer transition`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-full ${item.iconBg} flex items-center justify-center shrink-0`}
                      >
                        {item.icon}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate tabular-nums">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                      }}
                      className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200/90 text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                    >
                      <span>{item.actionLabel}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Tiến độ thu tháng này + Hoạt động gần đây */}
          <div className="space-y-6">
            {/* Tiến độ thu tiền tháng này */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">
                  Tiến độ thu tháng này
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold tabular-nums">
                  Đạt {collectionRatePct}%
                </span>
              </div>

              <div className="space-y-2.5 text-xs tabular-nums">
                <div className="flex justify-between">
                  <span className="text-slate-500">Phải thu kỳ {periodLabel}</span>
                  <span className="font-bold text-slate-900">
                    {formatVND(octoberReceivableTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đã thu trong kỳ</span>
                  <span className="font-bold text-emerald-600">
                    {formatVND(octoberPaidTotal)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Đã thu hôm nay</span>
                  <span className="font-bold text-teal-600">
                    {formatVND(collectedToday)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-100">
                  <span className="text-slate-600 font-medium">Còn phải thu</span>
                  <span className="font-extrabold text-rose-600">
                    {formatVND(dueSoonTotalAmount)}
                  </span>
                </div>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all"
                  style={{ width: `${collectionRatePct}%` }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  if (quickCollectInvoice) setCollectModalInvoice(quickCollectInvoice);
                }}
                disabled={!quickCollectInvoice}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition"
              >
                {quickCollectInvoice
                  ? `Thu tiền nhanh (${quickCollectInvoice.roomCode} · ${quickCollectInvoice.code})`
                  : 'Không còn hóa đơn nào cần thu'}
              </button>
            </div>

            {/* Hoạt động gần đây */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-slate-900">Hoạt động gần đây</h2>
                <button
                  type="button"
                  onClick={() => {
                    setFinanceExpanded(true);
                    setActiveTab('finance-cashbook');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-600"
                >
                  <span>Xem sổ thu chi</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {transactions.slice(0, 5).map((tx) => (
                  <div
                    key={tx.id}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                          tx.type === 'income'
                            ? 'bg-emerald-50 text-emerald-600'
                            : tx.category === 'Vệ sinh'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {tx.category}
                          </span>
                          {tx.roomCode && (
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                              {tx.roomCode}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {tx.date} · {tx.description}
                        </div>
                      </div>
                    </div>

                    <div
                      className={`text-xs font-bold shrink-0 tabular-nums ${
                        tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'
                      }`}
                    >
                      {formatVND(
                        tx.type === 'income' ? tx.amount : -tx.amount,
                        tx.type === 'income'
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 2. PHÒNG - SƠ ĐỒ CHIA THEO TẦNG
  const renderRooms = () => {
    const filteredRooms = propertyRooms.filter((r) => {
      if (roomStatusFilter === 'all') return true;
      return r.status === roomStatusFilter;
    });

    const floors = [...new Set(propertyRooms.map((r) => r.floor))].sort((a, b) => a - b);

    return (
      <div className="space-y-6 ui-enter">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Phòng</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentProperty.name} · {propertyRooms.length} phòng,{' '}
              {occupiedRooms.length} đang thuê, {vacantRooms.length} trống
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {canViewReports && (
              <button
                type="button"
                onClick={() => setIsRoomAddOpen(true)}
                data-testid="add-room"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm phòng
              </button>
            )}
            <button
              type="button"
              disabled={propertyRooms.length === 0}
              onClick={() => openRoomPricingModal(propertyRooms[0]?.code || 'P101', 'bulk')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
            >
              <Pencil className="w-3.5 h-3.5" />
              Điều chỉnh giá thuê phòng
            </button>
            <button
              type="button"
              onClick={() => {
                setContractInitialRoom(vacantRooms[0]?.code || '');
                setIsContractModalOpen(true);
              }}
              disabled={vacantRooms.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              Tạo hợp đồng cho phòng trống
            </button>
          </div>
        </div>

        {/* Sub-tabs & Filter Pills */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRoomViewMode('floor')}
              className={`pb-2 border-b-2 transition ${
                roomViewMode === 'floor'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Cơ sở
            </button>
            <button
              type="button"
              onClick={() => setRoomViewMode('list')}
              className={`pb-2 border-b-2 transition ${
                roomViewMode === 'list'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Tất cả phòng
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'Tất cả', count: propertyRooms.length, dot: '' },
              {
                id: 'vacant',
                label: 'Trống',
                count: vacantRooms.length,
                dot: 'bg-emerald-500',
              },
              {
                id: 'occupied',
                label: 'Đã thuê',
                count: occupiedRooms.length,
                dot: 'bg-slate-600',
              },
              { id: 'moving_in', label: 'Sắp vào ở', count: 0, dot: 'bg-blue-500' },
              { id: 'deposited', label: 'Đặt cọc', count: 0, dot: 'bg-amber-600' },
              {
                id: 'maintenance',
                label: 'Đang sửa',
                count: maintenanceRooms.length,
                dot: 'bg-rose-500',
              },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setRoomStatusFilter(pill.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                  roomStatusFilter === pill.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pill.dot && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      roomStatusFilter === pill.id ? 'bg-white' : pill.dot
                    }`}
                  />
                )}
                <span>{pill.label}</span>
                <span
                  className={`text-[11px] tabular-nums ${
                    roomStatusFilter === pill.id ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 3 KPI Cards */}
        <div
          className={`kpi-grid grid grid-cols-1 ${
            isMobilePreview ? 'gap-3' : 'md:grid-cols-3 gap-4'
          }`}
        >
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <LayoutGrid className="w-4 h-4" />
              </span>
              <span>
                Lấp đầy ({occupiedRooms.length}/{propertyRooms.length} phòng)
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {occupancyRate}%
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </span>
              <span>Tiền thuê/tháng theo hợp đồng</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {formatVND(totalMonthlyContractRent)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200 bg-amber-50/10 p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <span>{vacantRooms.length} phòng trống - hụt mỗi tháng</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 tabular-nums">
              {formatVND(monthlyVacancyLoss)}
            </div>
          </div>
        </div>

        {roomViewMode === 'floor' ? (
          /* Sơ đồ phòng chia theo tầng */
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-6">
            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600">
              <div className="flex flex-wrap items-center gap-4">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Trống
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-500" /> Đã thuê
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-600" /> Sắp vào ở
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-600" /> Đặt cọc
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-600" /> Đang sửa chữa
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                💡 Bấm <b>Sửa giá</b> trên từng phòng để điều chỉnh mức giá thuê riêng
              </span>
            </div>

            {propertyRooms.length === 0 && (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                <p className="text-sm font-semibold text-slate-900">{currentProperty.name} chưa có phòng nào</p>
                <p className="text-xs text-slate-500">Thêm phòng trước, sau đó lập hợp đồng và ghi điện nước.</p>
                {canViewReports && (
                  <button
                    type="button"
                    onClick={() => setIsRoomAddOpen(true)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Thêm phòng đầu tiên
                  </button>
                )}
              </div>
            )}
            {floors.map((floor) => {
              const floorRooms = filteredRooms.filter((r) => r.floor === floor);
              if (floorRooms.length === 0) return null;
              return (
                <div key={floor} className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      TẦNG {floor}
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {floorRooms.filter((r) => r.status === 'occupied').length}/
                      {floorRooms.length} phòng đang thuê
                    </div>
                  </div>
                  <div
                    className={`grid ${
                      isMobilePreview
                        ? 'grid-cols-1 sm:grid-cols-2 gap-3'
                        : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5'
                    }`}
                  >
                    {floorRooms.map((room) => {
                      const isVacant = room.status === 'vacant';
                      const isMaint = room.status === 'maintenance';
                      return (
                        <div
                          key={room.id}
                          onClick={() => {
                            if (isVacant) {
                              setContractInitialRoom(room.code);
                              setIsContractModalOpen(true);
                            } else if (isMaint) {
                              setMeterInitialRoom(room.code);
                              setIsMeterModalOpen(true);
                            } else {
                              setInvoiceMonth(nextMonth);
                              setActiveTab('invoices');
                            }
                          }}
                          className={`group relative rounded-2xl p-4 cursor-pointer transition border ${
                            isVacant
                              ? 'bg-emerald-50/50 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                              : isMaint
                              ? 'bg-white border-slate-200/90 border-l-4 border-l-rose-500 hover:border-slate-300 shadow-2xs'
                              : 'bg-white border-slate-200/90 border-l-4 border-l-blue-600 hover:border-blue-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-extrabold text-slate-900">
                              {room.code}
                            </span>
                            {isVacant ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                                Còn trống
                              </span>
                            ) : isMaint ? (
                              <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-semibold">
                                Đang sửa
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-semibold">
                                Đã thuê
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 mt-2">
                            <span className="text-xs font-extrabold text-slate-900 tabular-nums">
                              {formatVND(room.price)}
                              <span className="text-[10px] font-normal text-slate-400">
                                /th
                              </span>
                            </span>
                            <button
                              type="button"
                              aria-label={`Điều chỉnh giá thuê phòng ${room.code}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openRoomPricingModal(room.code, 'single');
                              }}
                              title={`Điều chỉnh giá thuê phòng ${room.code}`}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 hover:bg-blue-50 text-blue-600 border border-slate-200/80 text-[10px] font-bold transition"
                            >
                              <Pencil className="w-2.5 h-2.5" />
                              Sửa giá
                            </button>
                          </div>

                          <div className="text-xs font-medium text-slate-700 mt-1.5 truncate">
                            {isVacant
                              ? 'Bấm để lập hợp đồng'
                              : isMaint
                              ? 'Đang bảo trì thiết bị'
                              : room.tenantName}
                          </div>

                          <div className="flex items-center justify-between gap-1.5 text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100 tabular-nums">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isVacant
                                    ? 'bg-emerald-500'
                                    : isMaint
                                    ? 'bg-rose-500'
                                    : 'bg-blue-600'
                                }`}
                              />
                              <span>
                                {isVacant
                                  ? 'Trống'
                                  : isMaint
                                  ? 'Đang sửa chữa'
                                  : `${room.vehicleCount} xe · Cọc ${Math.round(
                                      room.deposit / 1000
                                    )}k`}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400">
                              ⚡{room.elecIndex} · 💧{room.waterIndex}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Bảng danh sách tất cả phòng & chỉnh giá nhanh */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 text-left">
                  <th className="py-3.5 px-4 font-medium">Phòng</th>
                  <th className="py-3.5 px-3 font-medium">Tầng</th>
                  <th className="py-3.5 px-3 font-medium">Trạng thái</th>
                  <th className="py-3.5 px-3 font-medium">Khách đang thuê</th>
                  <th className="py-3.5 px-3 font-medium text-right">Giá thuê / tháng</th>
                  <th className="py-3.5 px-3 font-medium text-right">Tiền cọc</th>
                  <th className="py-3.5 px-3 font-medium text-right">Rác + Internet</th>
                  <th className="py-3.5 px-4 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRooms.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-extrabold text-slate-900">
                      {r.code}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600">Tầng {r.floor}</td>
                    <td className="py-3.5 px-3">
                      {r.status === 'occupied' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold">
                          Đã thuê
                        </span>
                      ) : r.status === 'vacant' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                          Còn trống
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 text-[11px] font-semibold">
                          Đang sửa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-slate-800">
                      {r.tenantName || '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-extrabold text-blue-700">
                      {formatVND(r.price)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-600">
                      {formatVND(r.deposit)}
                    </td>
                    <td className="py-3.5 px-3 text-right text-slate-600">
                      {formatVND(r.trashFee + r.internetFee)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openRoomPricingModal(r.code, 'single')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition"
                      >
                        <Pencil className="w-3 h-3" />
                        Sửa giá
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  // 3. KHÁCH THUÊ & DANH SÁCH XE
  const renderTenants = () => {
    const filteredTenants = tenants.filter((t) => {
      if (!tenantSearch.trim()) return true;
      const q = removeAccents(tenantSearch.trim());
      return (
        removeAccents(t.name).includes(q) ||
        t.phone.includes(q) ||
        t.cccd.includes(q) ||
        removeAccents(t.roomCode).includes(q)
      );
    });
    const filteredVehicles = vehicles.filter((v) => {
      if (!tenantSearch.trim()) return true;
      const q = removeAccents(tenantSearch.trim()).replace(/[\s.-]/g, '');
      return [v.plate, v.ownerName, v.phone, v.roomCode].some((f) =>
        removeAccents(f).replace(/[\s.-]/g, '').includes(q)
      );
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Khách thuê</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {tenantSubTab === 'tenants'
                ? 'Danh sách khách, dùng khi khai báo tạm trú.'
                : 'Danh sách xe của khách đang thuê.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsTempResidenceOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
            >
              <FileText className="w-4 h-4" />
              Khai báo tạm trú (CT01)
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTenantSubTab('tenants')}
              className={`pb-2 border-b-2 transition ${
                tenantSubTab === 'tenants'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Danh sách khách
            </button>
            <button
              type="button"
              onClick={() => setTenantSubTab('vehicles')}
              className={`pb-2 border-b-2 transition ${
                tenantSubTab === 'vehicles'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Danh sách xe
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tenantSearch}
              onChange={(e) => setTenantSearch(e.target.value)}
              placeholder="Tìm theo tên, SĐT, CCCD, phòng..."
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-800 focus:border-blue-600 focus:outline-none w-60"
            />
          </div>
        </div>

        {tenantSubTab === 'tenants' ? (
          <>
            {/* 4 KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Users className="w-4 h-4" />
                  </span>
                  <span>Tổng khách trong sổ</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {tenants.length}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <span>Đang thuê</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {tenants.filter((t) => t.status === 'active').length}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                    <Clock className="w-4 h-4" />
                  </span>
                  <span>Đã chuyển đi</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {tenants.filter((t) => t.status === 'moved_out').length}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span>Đã có ảnh CCCD</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {tenants.filter((t) => t.hasCccdPhoto).length}/{tenants.length}
                </div>
              </div>
            </div>

            {/* Điện thoại: mỗi khách một thẻ, bấm số để gọi */}
            <ul className="md:hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 text-xs">
              {filteredTenants.map((t) => {
                const stats = roomFinancialStats[t.roomCode] || { paid: 0, debt: 0 };
                const isRep = t.role === 'representative';
                return (
                  <li key={t.id} className="p-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="font-bold text-slate-900 text-sm truncate">{t.name}</div>
                      <div className="text-[11px] text-slate-500">
                        Phòng {t.roomCode} · {isRep ? 'Đại diện' : 'Ở cùng'} · {t.contractCode}
                      </div>
                      <a href={`tel:${t.phone}`} className="block text-blue-600 font-semibold">
                        {t.phone}
                      </a>
                    </div>
                    <div className="text-right shrink-0 space-y-1.5">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-lg text-[11px] font-semibold ${
                          t.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.status === 'active' ? 'Đang thuê' : 'Đã chuyển đi'}
                      </span>
                      {isRep && stats.debt > 0 && (
                        <div className="font-bold text-rose-600 whitespace-nowrap">Nợ {formatVND(stats.debt)}</div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

            {/* Bảng Danh sách khách thuê */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-left">
                    <th className="py-3.5 px-4 font-medium">Họ tên</th>
                    <th className="py-3.5 px-3 font-medium">Trạng thái</th>
                    <th className="py-3.5 px-3 font-medium">Phòng</th>
                    <th className="py-3.5 px-3 font-medium">Hợp đồng</th>
                    <th className="py-3.5 px-3 font-medium">CCCD/CMND</th>
                    <th className="py-3.5 px-3 font-medium">SĐT</th>
                    <th className="py-3.5 px-3 font-medium text-right">Đã thu</th>
                    <th className="py-3.5 px-4 font-medium text-right">Công nợ</th>
                    <th className="py-3.5 px-4"><span className="sr-only">Thao tác</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTenants.map((t) => {
                    const stats = roomFinancialStats[t.roomCode] || {
                      paid: 0,
                      debt: 0,
                    };
                    const isRep = t.role === 'representative';
                    return (
                      <tr key={t.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-blue-600">{t.name}</div>
                          <div className="text-[11px] text-slate-400">{t.code}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                              t.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {t.status === 'active' ? 'Đang thuê' : 'Đã chuyển đi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-blue-600">
                          {t.roomCode}
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-blue-600">
                            {t.contractCode}
                          </div>
                          <div className="text-[11px] text-slate-400">
                            đến {t.contractEndDate}
                          </div>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                              isRep
                                ? 'bg-blue-50 text-blue-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isRep ? 'Đại diện' : 'Ở cùng'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-700">
                          {t.cccd}
                        </td>
                        <td className="py-3.5 px-3 text-slate-700">{t.phone}</td>
                        <td className="py-3.5 px-3 text-right font-bold text-emerald-700">
                          {isRep && stats.paid > 0 ? formatVND(stats.paid) : '–'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                          {isRep && stats.debt > 0 ? formatVND(stats.debt) : '–'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex items-center gap-2 text-slate-400">
                            <button
                              type="button"
                              onClick={() => setIsTempResidenceOpen(true)}
                              className="hover:text-blue-600"
                              title="Xem chi tiết tạm trú"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setTenants((prev) =>
                                  prev.map((x) =>
                                    x.id === t.id
                                      ? { ...x, hasCccdPhoto: !x.hasCccdPhoto }
                                      : x
                                  )
                                )
                              }
                              className="hover:text-blue-600"
                              title="Đánh dấu đã chụp CCCD"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Xóa khách ${t.name} (phòng ${t.roomCode})?`))
                                  setTenants((prev) => prev.filter((x) => x.id !== t.id));
                              }}
                              className="hover:text-rose-600"
                              title="Xóa khách"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          /* Tab Danh sách xe */
          <div className="space-y-5">
            <div className="kpi-grid grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Car className="w-4 h-4" />
                  </span>
                  <span>Xe đang gửi</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {vehicles.length}
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600">
                    <Users className="w-4 h-4" />
                  </span>
                  <span>Chủ xe</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {vehicles.length}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-left">
                    <th className="py-3.5 px-5 font-medium">Biển số</th>
                    <th className="py-3.5 px-4 font-medium">Chủ xe</th>
                    <th className="py-3.5 px-4 font-medium">SĐT</th>
                    <th className="py-3.5 px-4 font-medium">Phòng hiện tại</th>
                    <th className="py-3.5 px-4 font-medium">Loại xe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredVehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5 font-bold text-slate-900">
                        {v.plate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-800">{v.ownerName}</td>
                      <td className="py-3.5 px-4 text-slate-600">{v.phone}</td>
                      <td className="py-3.5 px-4 font-bold text-blue-600">
                        {v.roomCode}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{v.vehicleType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 4. HỢP ĐỒNG
  const renderContracts = () => {
    const activeContracts = contracts.filter((c) => c.status === 'active');
    const endedContracts = contracts.filter((c) => c.status === 'ended');
    const terminatedContracts = contracts.filter((c) => c.status === 'terminated');
    const expiringSoonContracts = activeContracts.filter(
      (c) => c.daysRemaining <= 60
    );

    const debtRoomCodes = new Set(allUnpaidInvoices.map((i) => i.roomCode));
    const debtContracts = activeContracts.filter((c) => debtRoomCodes.has(c.roomCode));

    const displayedContracts = contracts.filter((c) => {
      if (contractFilter === 'expiring') return c.status === 'active' && c.daysRemaining <= 60;
      if (contractFilter === 'debt') return debtContracts.includes(c);
      if (contractFilter === 'terminated') return c.status === 'terminated';
      if (contractFilter === 'ended') return c.status === 'ended';
      return c.status === 'active';
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hợp đồng</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeContracts.length} / {contracts.length} hợp đồng
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setContractInitialRoom(vacantRooms[0]?.code);
              setIsContractModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Tạo hợp đồng mới
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {[
            {
              id: 'expiring',
              label: 'Hết hạn trong 60 ngày',
              count: expiringSoonContracts.length,
              dot: 'bg-amber-500',
            },
            {
              id: 'debt',
              label: 'Còn nợ',
              count: debtContracts.length,
              dot: 'bg-rose-500',
            },
            {
              id: 'active',
              label: 'Còn hiệu lực',
              count: activeContracts.length,
              dot: '',
            },
            {
              id: 'ended',
              label: 'Đã kết thúc',
              count: endedContracts.length,
              dot: '',
            },
            {
              id: 'terminated',
              label: 'Đã thanh lý',
              count: terminatedContracts.length,
              dot: '',
            },
          ].map((pill) => (
            <button
              key={pill.id}
              type="button"
              onClick={() => setContractFilter(pill.id)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                contractFilter === pill.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pill.dot && (
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    contractFilter === pill.id ? 'bg-white' : pill.dot
                  }`}
                />
              )}
              <span>{pill.label}</span>
              <span
                className={`text-[11px] ${
                  contractFilter === pill.id ? 'text-white' : 'text-slate-400'
                }`}
              >
                {pill.count}
              </span>
            </button>
          ))}
        </div>

        {/* 3 KPI Cards */}
        <div className="kpi-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <FileText className="w-4 h-4" />
              </span>
              <span>Hợp đồng đang hiệu lực</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {activeContracts.length}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
                <Wallet className="w-4 h-4" />
              </span>
              <span>Tổng tiền thuê mỗi tháng</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {formatVND(totalMonthlyContractRent)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <span>Sắp hết hạn / quá hạn</span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {expiringSoonContracts.length}
            </div>
          </div>
        </div>

        {/* Điện thoại: mỗi hợp đồng một thẻ */}
        <ul className="md:hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 text-xs">
          {displayedContracts.map((c) => (
            <li key={c.id} className="p-3.5 flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <div className="flex items-baseline gap-2 min-w-0">
                  <span className="font-extrabold text-slate-900 text-sm">{c.roomCode}</span>
                  <span className="text-slate-700 truncate">{c.tenantName}</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  {c.code} · {c.startDate} → {c.endDate}
                </div>
                <div className="text-[11px]">
                  {c.status === 'terminated' ? (
                    <span className="text-slate-500">Đã thanh lý ({c.moveOutDate})</span>
                  ) : (
                    <span className={c.daysRemaining <= 60 ? 'text-amber-700 font-semibold' : 'text-slate-500'}>
                      Còn {c.daysRemaining} ngày
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 space-y-1">
                <div className="font-bold text-slate-900 whitespace-nowrap">{formatVND(c.rentAmount)}</div>
                <div className="text-[11px] text-slate-500 whitespace-nowrap">Cọc {formatVND(c.depositAmount)}</div>
                {c.status === 'active' && canViewReports && (
                  <button
                    type="button"
                    onClick={() => setMoveOutContract(c)}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold"
                  >
                    Trả phòng
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Bảng Hợp đồng */}
        <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100 text-left">
                <th className="py-3.5 px-4 font-medium">Mã HĐ</th>
                <th className="py-3.5 px-3 font-medium">Phòng</th>
                <th className="py-3.5 px-3 font-medium">Khách đại diện</th>
                <th className="py-3.5 px-3 font-medium">Từ ngày</th>
                <th className="py-3.5 px-3 font-medium">Đến ngày</th>
                <th className="py-3.5 px-3 font-medium">Còn lại</th>
                <th className="py-3.5 px-4 font-medium text-right">Giá thuê</th>
                <th className="py-3.5 px-4 font-medium text-right">Tiền cọc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayedContracts.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {c.code}
                  </td>
                  <td className="py-3.5 px-3 font-bold text-blue-600">
                    {c.roomCode}
                  </td>
                  <td className="py-3.5 px-3 font-medium text-slate-900">
                    {c.tenantName}
                  </td>
                  <td className="py-3.5 px-3 text-slate-600">{c.startDate}</td>
                  <td className="py-3.5 px-3 text-slate-600">{c.endDate}</td>
                  <td className="py-3.5 px-3">
                    {c.status === 'terminated' ? (
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                        Đã thanh lý ({c.moveOutDate})
                      </span>
                    ) : c.daysRemaining <= 60 ? (
                      <span className="px-2 py-0.5 rounded border border-amber-200 bg-amber-50 text-amber-800 text-[11px] font-semibold">
                        Còn {c.daysRemaining} ngày
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        Còn {c.daysRemaining} ngày
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <span>{formatVND(c.rentAmount)}</span>
                      <button
                        type="button"
                        onClick={() => openRoomPricingModal(c.roomCode, 'single')}
                        title={`Điều chỉnh giá thuê phòng ${c.roomCode}`}
                        className="p-1 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right text-slate-600">
                    {formatVND(c.depositAmount)}
                    {c.status === 'active' && canViewReports && (
                      <button
                        type="button"
                        onClick={() => setMoveOutContract(c)}
                        className="block ml-auto mt-1 px-2 py-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 text-[11px] font-semibold"
                      >
                        Trả phòng
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // 5. HÓA ĐƠN & GHI ĐIỆN NƯỚC
  const renderInvoices = () => {
    const monthInvoices = invoices.filter((i) => i.billingMonth === invoiceMonth);
    const activeMonthInvoices = monthInvoices.filter((i) => i.status !== 'draft');
    const monthTotal = activeMonthInvoices.reduce((s, i) => s + i.totalAmount, 0);
    const monthPaid = activeMonthInvoices.reduce((s, i) => s + i.paidAmount, 0);
    const monthRemaining = Math.max(0, monthTotal - monthPaid);

    const filteredInvoices = monthInvoices.filter((inv) => {
      if (invoiceFilter === 'draft') return inv.status === 'draft';
      if (invoiceFilter === 'unsent') return inv.status !== 'draft' && !inv.sentZalo;
      if (invoiceFilter === 'unpaid')
        return inv.status !== 'draft' && inv.totalAmount - inv.paidAmount > 0;
      return true;
    });

    const availableMonths = Array.from(
      new Set([
        shiftMonth(curMonth, -1),
        curMonth,
        nextMonth,
        ...invoices.map((i) => i.billingMonth),
        invoiceMonth,
      ])
    ).sort();

    const formatMonthLabel = (ym: string) => {
      const [y, m] = ym.split('-');
      if (y && m) return `tháng ${m} ${y}`;
      return ym;
    };

    // Ô bấm dùng chung cho bảng (máy tính) và thẻ (điện thoại)
    const meterButton = (inv: Invoice) => (
      <button
        type="button"
        onClick={() => {
          setMeterInitialRoom(inv.roomCode);
          setIsMeterModalOpen(true);
        }}
        className="inline-flex px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold text-[11px] transition"
      >
        {inv.elecUsage} kWh · {inv.waterUsage} m3
      </button>
    );
    const codeCell = (inv: Invoice) => (
      <>
        {inv.status === 'draft' ? (
          <button
            type="button"
            onClick={() =>
              setInvoices((prev) =>
                prev.map((x) =>
                  x.id === inv.id ? { ...x, status: 'unpaid' } : x
                )
              )
            }
            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-[11px]"
          >
            Nháp — điền chỉ số
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZaloModalInvoice(inv)}
              className="font-bold text-blue-600 hover:underline"
            >
              {inv.code}
            </button>
            <button
              type="button"
              onClick={() => setEditInvoice(inv)}
              aria-label={`Sửa hóa đơn ${inv.code}`}
              className="px-1.5 py-0.5 rounded-md text-[10px] font-semibold text-slate-500 border border-slate-200 hover:bg-slate-100"
            >
              Sửa
            </button>
          </span>
        )}
      </>
    );
    const sendButton = (inv: Invoice) => (
      <button
        type="button"
        onClick={() => setZaloModalInvoice(inv)}
        className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
          inv.sentZalo
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
        }`}
      >
        {inv.sentZalo ? 'Đã gửi' : 'Gửi'}
      </button>
    );
    const collectCell = (inv: Invoice, rem: number) => (
      <>
        {rem > 0 ? (
          <button
            type="button"
            onClick={() => setCollectModalInvoice(inv)}
            className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-800 text-xs font-semibold transition"
          >
            Thu
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-600">
            ✓ Xong
          </span>
        )}
      </>
    );

    const stepMonth = (dir: -1 | 1) => {
      const idx = availableMonths.indexOf(invoiceMonth);
      const next = availableMonths[idx + dir];
      if (next) setInvoiceMonth(next);
    };

    return (
      <div className="space-y-6">
        {/* Header & Month Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Hóa đơn</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Phải thu <strong className="text-slate-800">{formatVND(monthTotal)}</strong> ·
              đã thu <strong className="text-emerald-600">{formatVND(monthPaid)}</strong> ·
              còn lại{' '}
              <strong className="text-rose-600">{formatVND(monthRemaining)}</strong> ·{' '}
              {occupiedRooms.length} phòng đang thuê
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={availableMonths.indexOf(invoiceMonth) <= 0}
              onClick={() => stepMonth(-1)}
              aria-label="Tháng trước"
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
            >
              ←<span className="hidden sm:inline"> Tháng trước</span>
            </button>
            <select
              aria-label="Chọn kỳ hóa đơn"
              value={invoiceMonth}
              onChange={(e) => setInvoiceMonth(e.target.value)}
              className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none"
            >
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={
                availableMonths.indexOf(invoiceMonth) >= availableMonths.length - 1
              }
              onClick={() => stepMonth(1)}
              aria-label="Tháng sau"
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Tháng sau </span>→
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setInvoiceSubTab('by_room')}
            className={`pb-2.5 border-b-2 transition ${
              invoiceSubTab === 'by_room'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Theo phòng
          </button>
          <button
            type="button"
            onClick={() => setInvoiceSubTab('all')}
            className={`pb-2.5 border-b-2 transition ${
              invoiceSubTab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tất cả hóa đơn
          </button>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Từng phòng đang ở đâu ({formatMonthLabel(invoiceMonth)})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Bấm thẳng vào ô cần làm. Mỗi phòng theo chu kỳ tính tiền của hợp đồng phòng
                đó.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setMeterInitialRoom(occupiedRooms[0]?.code);
                  setIsMeterModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
              >
                <Droplets className="w-3.5 h-3.5 text-slate-600" />
                Ghi chỉ số hàng loạt
              </button>
              <button
                type="button"
                onClick={() => {
                  const firstInv = activeMonthInvoices[0];
                  if (firstInv) setZaloModalInvoice(firstInv);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-xs transition"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi {activeMonthInvoices.length} hóa đơn
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Tất cả', count: monthInvoices.length },
              {
                id: 'draft',
                label: 'Nháp chờ chỉ số',
                count: monthInvoices.filter((i) => i.status === 'draft').length,
              },
              {
                id: 'unsent',
                label: 'Chưa gửi',
                count: monthInvoices.filter(
                  (i) => i.status !== 'draft' && !i.sentZalo
                ).length,
              },
              {
                id: 'unpaid',
                label: 'Còn nợ',
                count: monthInvoices.filter(
                  (i) => i.status !== 'draft' && i.totalAmount - i.paidAmount > 0
                ).length,
              },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setInvoiceFilter(pill.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition ${
                  invoiceFilter === pill.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                }`}
              >
                <span>{pill.label}</span>
                <span
                  className={`text-[11px] ${
                    invoiceFilter === pill.id ? 'text-white' : 'text-slate-500'
                  }`}
                >
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

          {/* Điện thoại: mỗi hóa đơn một thẻ, không cuộn ngang */}
          <ul className="md:hidden divide-y divide-slate-100 text-xs" data-testid="invoice-cards">
            {filteredInvoices.map((inv) => {
              const rem = Math.max(0, inv.totalAmount - inv.paidAmount);
              return (
                <li key={inv.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="font-extrabold text-slate-900 text-sm">{inv.roomCode}</span>
                      <span className="text-[11px] text-slate-500 truncate">{inv.tenantName}</span>
                    </div>
                    <div className="text-[11px] text-slate-500">{inv.periodLabel}</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {meterButton(inv)}
                      {codeCell(inv)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1.5">
                    <div
                      className={`font-bold whitespace-nowrap ${
                        rem > 0 ? 'text-rose-600' : inv.status === 'draft' ? 'text-slate-400' : 'text-emerald-600'
                      }`}
                    >
                      {inv.status === 'draft' ? 'Chưa lập' : rem > 0 ? formatVND(rem) : 'Đã thu đủ'}
                    </div>
                    {inv.paidAmount > 0 && (
                      <div className="text-[11px] text-slate-500 whitespace-nowrap">Tổng {formatVND(inv.totalAmount)}</div>
                    )}
                    <div className="flex items-center justify-end gap-1.5">
                      {sendButton(inv)}
                      {collectCell(inv, rem)}
                    </div>
                  </div>
                </li>
              );
            })}
            <li className="py-3 flex justify-between font-extrabold text-slate-900">
              <span>Tổng {activeMonthInvoices.length} hóa đơn</span>
              <span className="text-rose-600 whitespace-nowrap">Còn {formatVND(monthRemaining)}</span>
            </li>
          </ul>

          {/* Table */}
          <div className="overflow-x-auto hidden md:block">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 text-left">
                  <th className="py-3 px-3 font-medium">Phòng</th>
                  <th className="py-3 px-3 font-medium">Kỳ tính tiền</th>
                  <th className="py-3 px-3 font-medium">Chỉ số</th>
                  <th className="py-3 px-3 font-medium">Hóa đơn</th>
                  <th className="py-3 px-3 font-medium text-right">Số tiền</th>
                  <th className="py-3 px-3 font-medium text-right">Đã thu</th>
                  <th className="py-3 px-3 font-medium text-right">Công nợ</th>
                  <th className="py-3 px-2 font-medium text-center">Gửi</th>
                  <th className="py-3 px-2 font-medium text-center">Thu</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const rem = Math.max(0, inv.totalAmount - inv.paidAmount);
                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-3">
                        <div className="font-extrabold text-slate-900">
                          {inv.roomCode}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {inv.tenantName}
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        {inv.periodLabel}
                      </td>
                      <td className="py-3.5 px-3">
                        {meterButton(inv)}
                      </td>
                      <td className="py-3.5 px-3">
                        {codeCell(inv)}
                      </td>
                      <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                        {formatVND(inv.totalAmount)}
                      </td>
                      <td className="py-3.5 px-3 text-right text-emerald-600 font-semibold">
                        {inv.paidAmount > 0 ? formatVND(inv.paidAmount) : '–'}
                      </td>
                      <td
                        className={`py-3.5 px-3 text-right font-bold ${
                          rem > 0
                            ? 'text-rose-600'
                            : inv.status === 'draft'
                            ? 'text-slate-400'
                            : 'text-emerald-600'
                        }`}
                      >
                        {inv.status === 'draft'
                          ? 'Chưa lập'
                          : rem > 0
                          ? formatVND(rem)
                          : 'Đã thu đủ'}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        {sendButton(inv)}
                      </td>
                      <td className="py-3.5 px-2 text-center">
                        {collectCell(inv, rem)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-200 font-extrabold text-slate-900">
                  <td colSpan={4} className="py-3.5 px-3">
                    Tổng {activeMonthInvoices.length} hóa đơn
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    {formatVND(monthTotal)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-emerald-600">
                    {formatVND(monthPaid)}
                  </td>
                  <td className="py-3.5 px-3 text-right text-rose-600">
                    {formatVND(monthRemaining)}
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // 6. TÀI CHÍNH (Sổ thu chi, Quỹ, Công nợ, Cọc phải trả)
  const renderFinance = () => {
    const fundBalance = (method: CashTransaction['method']) =>
      transactions
        .filter((t) => t.method === method)
        .reduce((s, t) => s + (t.type === 'income' ? t.amount : -t.amount), 0);
    const financeSubTabs: Array<{ id: NavTab; label: string }> = [
      { id: 'finance-cashbook', label: 'Sổ thu chi' },
      { id: 'finance-funds', label: 'Quỹ' },
      { id: 'finance-debts', label: 'Công nợ' },
      { id: 'finance-deposits', label: 'Cọc phải trả' },
    ];

    const titleMap: Record<string, { title: string; sub: string }> = {
      'finance-cashbook': {
        title: 'Sổ thu chi',
        sub: 'Toàn bộ lịch sử thu tiền phòng, tiền cọc và các khoản chi bảo trì, vệ sinh.',
      },
      'finance-funds': {
        title: 'Quỹ tiền mặt & Ngân hàng',
        sub: 'Theo dõi số dư thực tế trong tài khoản Vietcombank và két tiền mặt.',
      },
      'finance-debts': {
        title: 'Công nợ',
        sub: 'Toàn bộ hóa đơn chưa thu đủ, gồm cả các tháng trước.',
      },
      'finance-deposits': {
        title: 'Cọc phải trả lại',
        sub: 'Tiền cọc đang cầm của khách, và những khoản đã tới lúc phải chuyển trả.',
      },
    };

    const headerInfo = titleMap[activeTab] || titleMap['finance-debts'];

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{headerInfo.title}</h1>
          <p className="text-xs text-slate-500 mt-0.5">{headerInfo.sub}</p>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold">
          {financeSubTabs.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => setActiveTab(st.id)}
              className={`pb-2.5 border-b-2 transition ${
                activeTab === st.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>

        {/* TAB: CÔNG NỢ */}
        {activeTab === 'finance-debts' && (
          <div className="space-y-5">
            <div className="kpi-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <span>Tổng còn nợ ({allUnpaidInvoices.length} hóa đơn)</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {formatVND(allUnpaidTotalAmount)}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Clock className="w-4 h-4" />
                  </span>
                  <span>Trong đó quá hạn ({overdueInvoices.length} hóa đơn)</span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {formatVND(overdueTotalAmount)}
                </div>
              </div>
            </div>

            {/* Điện thoại: mỗi khoản nợ một thẻ, bấm số điện thoại để gọi */}
            <ul className="md:hidden bg-white rounded-2xl border border-slate-200/80 shadow-sm divide-y divide-slate-100 text-xs">
              {allUnpaidInvoices.map((inv) => {
                const rem = Math.max(0, inv.totalAmount - inv.paidAmount);
                return (
                  <li key={inv.id} className="p-3.5 flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-baseline gap-2 min-w-0">
                        <span className="font-extrabold text-slate-900 text-sm">{inv.roomCode}</span>
                        <span className="text-slate-700 truncate">{inv.tenantName}</span>
                      </div>
                      <a href={`tel:${inv.tenantPhone}`} className="block text-blue-600 font-semibold">
                        {inv.tenantPhone}
                      </a>
                      <div className="text-[11px] text-slate-500">
                        {inv.code} · hạn {inv.dueDate}
                        {inv.isOverdue && (
                          <span className="ml-1.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                            Quá hạn
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 space-y-1.5">
                      <div className="font-bold text-rose-600 whitespace-nowrap">{formatVND(rem)}</div>
                      <button
                        type="button"
                        onClick={() => setCollectModalInvoice(inv)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                      >
                        Thu nợ
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-left">
                    <th className="py-3.5 px-4 font-medium">Phòng</th>
                    <th className="py-3.5 px-3 font-medium">Khách</th>
                    <th className="py-3.5 px-3 font-medium">SĐT</th>
                    <th className="py-3.5 px-3 font-medium">Mã HĐ</th>
                    <th className="py-3.5 px-3 font-medium">Hạn TT</th>
                    <th className="py-3.5 px-4 font-medium text-right">Còn nợ</th>
                    <th className="py-3.5 px-4 font-medium text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allUnpaidInvoices.map((inv) => {
                    const rem = Math.max(0, inv.totalAmount - inv.paidAmount);
                    return (
                      <tr key={inv.id} className="hover:bg-slate-50 transition">
                        <td className="py-3.5 px-4 font-bold text-blue-600">
                          {inv.roomCode}
                        </td>
                        <td className="py-3.5 px-3 font-medium text-slate-900">
                          {inv.tenantName}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">
                          {inv.tenantPhone}
                        </td>
                        <td className="py-3.5 px-3 text-slate-600">{inv.code}</td>
                        <td className="py-3.5 px-3">
                          <span className="text-slate-700 mr-2">{inv.dueDate}</span>
                          {inv.isOverdue && (
                            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600 text-[10px] font-bold">
                              Quá hạn
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                          {formatVND(rem)}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => setCollectModalInvoice(inv)}
                            className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                          >
                            Thu nợ
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: CỌC PHẢI TRẢ */}
        {activeTab === 'finance-deposits' && (
          <div className="space-y-6">
            <div className="kpi-grid grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                    <Wallet className="w-4 h-4" />
                  </span>
                  <span>
                    Đang giữ hộ khách (
                    {contracts.filter((c) => c.status === 'active').length} khoản)
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {formatVND(
                    contracts
                      .filter((c) => c.status === 'active')
                      .reduce((s, c) => s + c.depositAmount, 0)
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Khách còn thuê — chưa tới lúc trả
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-amber-200 p-5 shadow-sm">
                <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                  <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <span>
                    Tới hạn trả lại ({pendingRefundContracts.length} khoản)
                  </span>
                </div>
                <div className="text-2xl font-extrabold text-slate-900">
                  {formatVND(pendingRefundTotal)}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Đã thanh lý, chờ chuyển tiền về cho khách
                </div>
              </div>
            </div>

            {/* Tới hạn trả lại */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Tới hạn trả lại</h2>
                <p className="text-xs text-slate-500">
                  Khách đã dọn đi, tiền cọc còn nằm trong két của bạn.
                </p>
              </div>

              {pendingRefundContracts.length === 0 ? (
                <div className="text-xs text-emerald-600 font-semibold py-4">
                  ✓ Đã hoàn trả toàn bộ tiền cọc cho các hợp đồng đã thanh lý.
                </div>
              ) : (
                <>
                <ul className="md:hidden divide-y divide-slate-100 text-xs">
                  {pendingRefundContracts.map((c) => (
                    <li key={c.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-extrabold text-slate-900 text-sm">{c.roomCode}</span>
                          <span className="text-slate-700 truncate">{c.tenantName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          Trả phòng {c.moveOutDate} · cọc {formatVND(c.depositAmount)}, trừ {formatVND(c.depositDeducted || 0)}
                        </div>
                        {c.refundBankAccount && (
                          <div className="text-[11px] text-slate-500">
                            {c.refundBankAccount} {c.refundBankName}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0 space-y-1.5">
                        <div className="font-extrabold text-slate-900 whitespace-nowrap">{formatVND(getContractRefundAmount(c))}</div>
                        <button
                          type="button"
                          onClick={() => handleMarkDepositRefunded(c)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                        >
                          Đã chuyển trả
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="overflow-x-auto hidden md:block">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-slate-400 border-b border-slate-100 text-left">
                        <th className="py-3 px-3 font-medium">Phòng</th>
                        <th className="py-3 px-3 font-medium">Khách</th>
                        <th className="py-3 px-3 font-medium">Ngày trả phòng</th>
                        <th className="py-3 px-3 font-medium text-right">Cọc</th>
                        <th className="py-3 px-3 font-medium text-right">Đã trừ</th>
                        <th className="py-3 px-3 font-medium text-right">
                          Phải trả lại
                        </th>
                        <th className="py-3 px-3 font-medium">Tài khoản nhận</th>
                        <th className="py-3 px-3 font-medium text-right"><span className="sr-only">Thao tác</span></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pendingRefundContracts.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3.5 px-3 font-bold text-blue-600">
                            {c.roomCode}
                          </td>
                          <td className="py-3.5 px-3 font-medium text-slate-900">
                            {c.tenantName}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600">
                            {c.moveOutDate}
                          </td>
                          <td className="py-3.5 px-3 text-right text-slate-700">
                            {formatVND(c.depositAmount)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-bold text-rose-600">
                            – {formatVND(c.depositDeducted || 0)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-extrabold text-slate-900">
                            {formatVND(getContractRefundAmount(c))}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600">
                            <span className="font-mono">{c.refundBankAccount}</span>{' '}
                            <span className="text-slate-400">{c.refundBankName}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right">
                            <button
                              type="button"
                              onClick={() => handleMarkDepositRefunded(c)}
                              className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                            >
                              Đã chuyển trả
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                </>
              )}
            </div>

            {/* Đang giữ hộ khách */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-bold text-slate-900">
                  Đang giữ hộ khách
                </h2>
                <p className="text-xs text-slate-500">
                  Khách còn thuê. Chưa phải trả, nhưng đây là tiền của họ.
                </p>
              </div>
              <ul className="md:hidden divide-y divide-slate-100 text-xs">
                {contracts
                  .filter((c) => c.status === 'active')
                  .map((c) => (
                    <li key={c.id} className="py-3 flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-baseline gap-2 min-w-0">
                          <span className="font-extrabold text-slate-900 text-sm">{c.roomCode}</span>
                          <span className="text-slate-700 truncate">{c.tenantName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {c.startDate} → {c.endDate}
                        </div>
                      </div>
                      <div className="shrink-0 font-bold text-slate-900 whitespace-nowrap">{formatVND(c.depositAmount)}</div>
                    </li>
                  ))}
              </ul>
              <div className="overflow-x-auto hidden md:block">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-100 text-left">
                      <th className="py-3 px-3 font-medium">Phòng</th>
                      <th className="py-3 px-3 font-medium">Khách</th>
                      <th className="py-3 px-3 font-medium">Ngày nhận cọc</th>
                      <th className="py-3 px-3 font-medium">Hết hạn hợp đồng</th>
                      <th className="py-3 px-3 font-medium text-right">Tiền cọc</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {contracts
                      .filter((c) => c.status === 'active')
                      .map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-3 px-3 font-bold text-blue-600">
                            {c.roomCode}
                          </td>
                          <td className="py-3 px-3 text-slate-800">
                            {c.tenantName}
                          </td>
                          <td className="py-3 px-3 text-slate-600">{c.startDate}</td>
                          <td className="py-3 px-3 text-slate-600">{c.endDate}</td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900">
                            {formatVND(c.depositAmount)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB: SỔ THU CHI */}
        {activeTab === 'finance-cashbook' && (
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-bold text-slate-900">
                Nhật ký Sổ thu chi ({transactions.length} bút toán)
              </h2>
              <button
                type="button"
                onClick={() => setIsExpenseOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Ghi khoản chi
              </button>
            </div>

            {/* Điện thoại: mỗi bút toán một dòng */}
            <ul className="md:hidden divide-y divide-slate-100 text-xs">
              {transactions.map((tx) => (
                <li key={tx.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="font-semibold text-slate-900">{tx.category}</div>
                    <div className="text-[11px] text-slate-500">
                      {tx.date} · {tx.method}
                      {tx.roomCode ? ` · Phòng ${tx.roomCode}` : ''}
                    </div>
                    <div className="text-[11px] text-slate-500 line-clamp-2">{tx.description}</div>
                  </div>
                  <div
                    className={`shrink-0 font-bold whitespace-nowrap ${
                      tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {formatVND(tx.type === 'income' ? tx.amount : -tx.amount, tx.type === 'income')}
                  </div>
                </li>
              ))}
            </ul>

            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-400 border-b border-slate-100 text-left">
                    <th className="py-3 px-3 font-medium">Ngày</th>
                    <th className="py-3 px-3 font-medium">Hạng mục</th>
                    <th className="py-3 px-3 font-medium">Phòng</th>
                    <th className="py-3 px-3 font-medium">Diễn giải</th>
                    <th className="py-3 px-3 font-medium">Hình thức</th>
                    <th className="py-3 px-3 font-medium text-right">Số tiền</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50">
                      <td className="py-3 px-3 text-slate-600">{tx.date}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800">
                        {tx.category}
                      </td>
                      <td className="py-3 px-3 font-bold text-blue-600">
                        {tx.roomCode || '–'}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{tx.description}</td>
                      <td className="py-3 px-3 text-slate-500">{tx.method}</td>
                      <td
                        className={`py-3 px-3 text-right font-bold ${
                          tx.type === 'income' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatVND(
                          tx.type === 'income' ? tx.amount : -tx.amount,
                          tx.type === 'income'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: QUỸ */}
        {activeTab === 'finance-funds' && (
          <div className="kpi-grid grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
              <div className="text-xs text-slate-500">
                Quỹ Ngân hàng ({currentProperty.bankName} ·{' '}
                {currentProperty.bankAccount})
              </div>
              <div
                className={`text-2xl font-extrabold tabular-nums ${
                  fundBalance('Chuyển khoản') < 0 ? 'text-rose-600' : 'text-blue-600'
                }`}
              >
                {formatVND(fundBalance('Chuyển khoản'))}
              </div>
              <div className="text-[11px] text-slate-400">
                Thu trừ chi bằng chuyển khoản trong sổ thu chi (chưa gồm số dư đầu kỳ)
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-2">
              <div className="text-xs text-slate-500">Quỹ Tiền mặt tại nhà trọ</div>
              <div
                className={`text-2xl font-extrabold tabular-nums ${
                  fundBalance('Tiền mặt') < 0 ? 'text-rose-600' : 'text-emerald-600'
                }`}
              >
                {formatVND(fundBalance('Tiền mặt'))}
              </div>
              <div className="text-[11px] text-slate-400">
                Thu trừ chi bằng tiền mặt trong sổ thu chi (chưa gồm số dư đầu kỳ)
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // 7. BÁO CÁO KINH DOANH
  const renderReports = () => {
    // Thực thu lấy từ sổ thu chi (gồm cả các khoản thu gộp của những kỳ không còn hóa đơn chi tiết)
    const totalRevenue = transactions
      .filter((t) => t.type === 'income' && t.category === 'Thu tiền hóa đơn')
      .reduce((s, t) => s + t.amount, 0);
    const totalExpense = transactions
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + t.amount, 0);
    const netProfit = totalRevenue - totalExpense;
    const totalInvoiced = invoices
      .filter((i) => i.status !== 'draft')
      .reduce((s, i) => s + i.totalAmount, 0);
    const totalDebtReport = allUnpaidTotalAmount;
    const depositIncome = transactions
      .filter((t) => t.type === 'income' && t.category === 'Thu tiền cọc')
      .reduce((s, t) => s + t.amount, 0);
    const incomeTotal = totalRevenue + depositIncome;
    const expenseByCategory = Object.entries(
      transactions
        .filter((t) => t.type === 'expense')
        .reduce<Record<string, number>>((m, t) => {
          m[t.category] = (m[t.category] || 0) + t.amount;
          return m;
        }, {})
    ).sort((a, b) => b[1] - a[1]);
    const roomStats = Object.values(
      invoices
        .filter((i) => i.status !== 'draft')
        .reduce<Record<string, { code: string; paid: number; debt: number }>>((m, i) => {
          const r = m[i.roomCode] || (m[i.roomCode] = { code: i.roomCode, paid: 0, debt: 0 });
          r.paid += i.paidAmount;
          r.debt += Math.max(0, i.totalAmount - i.paidAmount);
          return m;
        }, {})
    );
    const bestRooms = roomStats
      .filter((r) => r.paid > 0)
      .sort((a, b) => b.paid - a.paid)
      .slice(0, 3);
    const watchRooms = roomStats
      .filter((r) => r.debt > 0)
      .sort((a, b) => b.debt - a.debt)
      .slice(0, 3);
    const pctOf = (v: number, total: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

    const maxChartVal = 30000000;

    const handleCopyReport = () => {
      const summary = `BÁO CÁO KINH DOANH - ${currentProperty.name}
- Doanh thu thực thu: ${formatVND(totalRevenue)}
- Chi phí: ${formatVND(totalExpense)}
- Lợi nhuận ròng: ${formatVND(netProfit)}
- Tỷ lệ lấp đầy: ${occupancyRate}% (${occupiedRooms.length}/${propertyRooms.length} phòng)`;
      navigator.clipboard?.writeText(summary);
      showToast('Đã sao chép số liệu báo cáo kinh doanh!');
    };

    const handleExportReportCsv = () => {
      const rows = [
        ['Tháng', 'Doanh thu (VND)', 'Chi phí (VND)', 'Lợi nhuận (VND)'],
        ...monthlyChart.map((m) => [
          m.month,
          String(m.income),
          String(m.expense),
          String(m.profit),
        ]),
      ];
      const csv =
        '\uFEFF' + rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bao-cao-kinh-doanh-Quan-ly-phong-tro-2026.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Đã xuất file Excel/CSV Báo cáo kinh doanh!');
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Báo cáo kinh doanh</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Tính trên toàn bộ hóa đơn và sổ thu chi của {currentProperty.name}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <Copy className="w-3.5 h-3.5" />
              Sao chép số liệu
            </button>
            <button
              type="button"
              onClick={handleExportReportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              Xuất báo cáo
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div
          className={`grid ${
            isMobilePreview
              ? 'grid-cols-2 gap-3'
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'
          }`}
        >
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <ArrowUpRight className="w-4 h-4" />
              </span>
              <span className="truncate">Doanh thu thực thu</span>
            </div>
            <div
              className={`${
                isMobilePreview ? 'text-base' : 'text-2xl'
              } font-extrabold text-slate-900 tabular-nums`}
            >
              {formatVND(totalRevenue)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <ArrowDownRight className="w-4 h-4" />
              </span>
              <span className="truncate">Chi phí</span>
            </div>
            <div
              className={`${
                isMobilePreview ? 'text-base' : 'text-2xl'
              } font-extrabold text-slate-900 tabular-nums`}
            >
              {formatVND(totalExpense)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 shrink-0">
                <TrendingUp className="w-4 h-4" />
              </span>
              <span className="truncate">Lợi nhuận</span>
            </div>
            <div
              className={`${
                isMobilePreview ? 'text-base' : 'text-2xl'
              } font-extrabold text-slate-900 tabular-nums`}
            >
              {formatVND(netProfit)}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
              <span className="p-1.5 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                <LayoutGrid className="w-4 h-4" />
              </span>
              <span className="truncate">
                Lấp đầy ({occupiedRooms.length}/{propertyRooms.length})
              </span>
            </div>
            <div
              className={`${
                isMobilePreview ? 'text-base' : 'text-2xl'
              } font-extrabold text-slate-900 tabular-nums`}
            >
              {occupancyRate}%
            </div>
          </div>
        </div>

        {/* Biểu đồ kết hợp Cột + Đường (Doanh thu · Chi phí · Lợi nhuận) */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              Doanh thu · Chi phí · Lợi nhuận
            </h2>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" /> Thu
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" /> Chi
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Lợi nhuận
              </span>
            </div>
          </div>

          <div className="relative h-64 w-full pt-4">
            <svg
              viewBox="0 0 750 220"
              className="w-full h-full overflow-visible"
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                const y = 185 - ratio * 155;
                const labelMap = ['0', '7,3tr', '15tr', '22tr', '29tr'];
                return (
                  <g key={idx}>
                    <line
                      x1="50"
                      y1={y}
                      x2="720"
                      y2={y}
                      stroke="#F1F5F9"
                      strokeWidth="1"
                    />
                    <text
                      x="40"
                      y={y + 4}
                      textAnchor="end"
                      className="fill-slate-400 text-[10px]"
                    >
                      {labelMap[idx]}
                    </text>
                  </g>
                );
              })}

              {/* Area under profit line */}
              <polygon
                points={[
                  `130,185`,
                  ...monthlyChart.map((pt, i) => {
                    const x = 130 + i * 135;
                    const y = 185 - (pt.profit / maxChartVal) * 155;
                    return `${x},${y}`;
                  }),
                  `${130 + (monthlyChart.length - 1) * 135},185`,
                ].join(' ')}
                fill="rgba(16, 185, 129, 0.08)"
              />

              {/* Bars */}
              {monthlyChart.map((pt, i) => {
                const xCenter = 130 + i * 135;
                const incH = (pt.income / maxChartVal) * 155;
                const expH = Math.max(4, (pt.expense / maxChartVal) * 155);
                return (
                  <g
                    key={pt.month}
                    onMouseEnter={() => setHoveredChartIdx(i)}
                    onMouseLeave={() => setHoveredChartIdx(null)}
                    className="cursor-pointer"
                  >
                    {/* Income bar */}
                    <rect
                      x={xCenter - 20}
                      y={185 - incH}
                      width="20"
                      height={incH}
                      rx="3"
                      fill="#0284C7"
                    />
                    {/* Expense bar */}
                    <rect
                      x={xCenter + 2}
                      y={185 - expH}
                      width="18"
                      height={expH}
                      rx="3"
                      fill="#9333EA"
                    />
                    {/* X-axis label */}
                    <text
                      x={xCenter}
                      y="204"
                      textAnchor="middle"
                      className="fill-slate-500 text-[10px] font-medium"
                    >
                      {pt.month}
                    </text>
                  </g>
                );
              })}

              {/* Profit Line */}
              <polyline
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                points={monthlyChart.map((pt, i) => {
                  const x = 130 + i * 135;
                  const y = 185 - (pt.profit / maxChartVal) * 155;
                  return `${x},${y}`;
                }).join(' ')}
              />

              {/* Profit Dots */}
              {monthlyChart.map((pt, i) => {
                const x = 130 + i * 135;
                const y = 185 - (pt.profit / maxChartVal) * 155;
                return (
                  <circle
                    key={pt.month}
                    cx={x}
                    cy={y}
                    r="4"
                    className="fill-emerald-500 stroke-white stroke-2"
                  />
                );
              })}
            </svg>

            {hoveredChartIdx !== null && (
              <div className="absolute top-2 right-4 bg-slate-900 text-white rounded-xl px-3.5 py-2 text-xs shadow-lg space-y-0.5">
                <div className="font-bold">
                  {monthlyChart[hoveredChartIdx].month}
                </div>
                <div className="text-sky-300">
                  Thu: {formatVND(monthlyChart[hoveredChartIdx].income)}
                </div>
                <div className="text-purple-300">
                  Chi: {formatVND(monthlyChart[hoveredChartIdx].expense)}
                </div>
                <div className="text-emerald-300 font-bold">
                  Lợi nhuận: {formatVND(monthlyChart[hoveredChartIdx].profit)}
                </div>
              </div>
            )}
          </div>

          <p className="text-[11px] text-slate-400">
            Rê chuột vào cột hoặc điểm để xem số tiền. Cột và đường dùng chung một thang đo
            nên so sánh trực tiếp được.
          </p>
        </div>

        {/* Nguồn thu & Khoản chi */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Nguồn thu</h3>
              <p className="text-xs text-slate-400">Tổng {formatVND(incomeTotal)}</p>
            </div>
            <div className="space-y-3 text-xs">
              {[
                ['Thu tiền hóa đơn', totalRevenue],
                ['Thu tiền cọc', depositIncome],
              ].map(([label, value]) => (
                <div key={label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700">{label}</span>
                    <span className="font-bold text-slate-900">
                      {formatVND(Number(value))} ·{' '}
                      <span className="text-slate-400">{pctOf(Number(value), incomeTotal)}%</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{ width: `${pctOf(Number(value), incomeTotal)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Khoản chi</h3>
              <p className="text-xs text-slate-400">Tổng {formatVND(totalExpense)}</p>
            </div>
            <div className="space-y-3 text-xs">
              {expenseByCategory.length === 0 && (
                <div className="text-slate-400 py-2">Chưa có khoản chi tại cơ sở này.</div>
              )}
              {expenseByCategory.map(([category, value]) => (
                <div key={category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-slate-700">{category}</span>
                    <span className="font-bold text-slate-900">
                      {formatVND(value)} ·{' '}
                      <span className="text-slate-400">{pctOf(value, totalExpense)}%</span>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-purple-600"
                      style={{ width: `${pctOf(value, totalExpense)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Theo cơ sở */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900">Theo cơ sở</h3>
          <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Báo cáo theo cơ sở">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-100 text-left">
                  <th className="py-2.5 px-3 font-medium">Cơ sở</th>
                  <th className="py-2.5 px-3 font-medium">Phòng</th>
                  <th className="py-2.5 px-3 font-medium">Lấp đầy</th>
                  <th className="py-2.5 px-3 font-medium text-right">Đã lập HĐ</th>
                  <th className="py-2.5 px-3 font-medium text-right">Đã thu</th>
                  <th className="py-2.5 px-3 font-medium text-right">Chi phí</th>
                  <th className="py-2.5 px-3 font-medium text-right">Còn nợ</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-50">
                  <td className="py-3 px-3 font-bold text-slate-900">
                    {currentProperty.name}
                  </td>
                  <td className="py-3 px-3 text-slate-600">
                    {occupiedRooms.length}/{propertyRooms.length}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-bold text-[11px]">
                      {occupancyRate}%
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">
                    {formatVND(totalInvoiced)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-600">
                    {formatVND(totalRevenue)}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-700">
                    {formatVND(totalExpense)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-rose-600">
                    {formatVND(totalDebtReport)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Phòng cho thuê tốt nhất & Phòng cần để ý */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Phòng cho thuê tốt nhất
              </h3>
              <p className="text-xs text-slate-400">
                Xếp theo tiền đã thu được, không phải tiền đã lập hóa đơn.
              </p>
            </div>
            <div className="space-y-3 text-xs">
              {bestRooms.length > 0 ? (
                bestRooms.map((item, idx) => (
                  <div key={item.code} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-blue-600">{item.code}</span>
                        <span className="text-slate-400">· nợ {formatVND(item.debt)}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        {formatVND(item.paid)}
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-800"
                        style={{ width: `${pctOf(item.paid, bestRooms[0].paid)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 py-2">
                  Chưa có dữ liệu thu tiền của cơ sở này.
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Phòng cần để ý</h3>
              <p className="text-xs text-slate-400">
                Thu được ít nhất trong kỳ, hoặc đang nợ nhiều.
              </p>
            </div>
            <div className="space-y-3 text-xs">
              {watchRooms.length > 0 ? (
                watchRooms.map((item, idx) => (
                  <div key={item.code} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="font-bold text-blue-600">{item.code}</span>
                        <span className="text-slate-400">· đã thu {formatVND(item.paid)}</span>
                      </div>
                      <span className="font-bold text-rose-600">nợ {formatVND(item.debt)}</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-rose-500"
                        style={{ width: `${pctOf(item.debt, watchRooms[0].debt)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 py-2">
                  Chưa có phòng phát sinh cảnh báo tại cơ sở này.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 8. LỊCH SỰ KIỆN NHÀ TRỌ (`calendar`)
  const renderCalendar = () => {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Lịch vận hành nhà trọ</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Theo dõi lịch ghi điện nước, hạn thu tiền hóa đơn, chốt kỳ theo ngày vào ở và hợp
            đồng sắp hết hạn.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {calendarEvents.length === 0 && (
            <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
              Chưa có việc nào trong tháng này. Lịch tự hiện khi có phòng đang thuê, hóa đơn và hợp đồng.
            </div>
          )}
          {calendarEvents.map((ev) => (
            <div
              key={ev.id}
              onClick={() => setActiveTab(ev.actionTab)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:border-blue-300 cursor-pointer flex items-start justify-between gap-4 transition"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex flex-col items-center justify-center shrink-0">
                  <span className="text-sm font-extrabold">{ev.dayOfMonth}</span>
                  <span className="text-[10px] font-medium">{ev.monthYear}</span>
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">{ev.title}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{ev.subtitle}</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 9. CÀI ĐẶT & ĐỒNG BỘ GOOGLE SHEETS (`settings`)
  const renderSettings = () => {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Cài đặt hệ thống</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cấu hình đơn giá điện nước, dịch vụ cố định, tài khoản VietQR và liên kết Google
            Sheets Apps Script.
          </p>
        </div>

        {/* Giao diện ngày / đêm */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              {theme === 'dark' ? <Moon className="w-[18px] h-[18px]" /> : <Sun className="w-[18px] h-[18px]" />}
            </span>
            <div>
              <div id="theme-switch-label" className="text-sm font-bold text-slate-900">Chế độ ban đêm</div>
              <div className="text-xs text-slate-500">Nền tối, dịu mắt khi dùng buổi tối</div>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={theme === 'dark'}
            aria-labelledby="theme-switch-label"
            onClick={toggleTheme}
            className={`relative w-[51px] h-[31px] rounded-full shrink-0 transition-colors ${
              theme === 'dark' ? 'bg-emerald-500' : 'bg-slate-200'
            }`}
          >
            <span
              className={`absolute top-[2px] w-[27px] h-[27px] rounded-full bg-white shadow-md transition-all ${
                theme === 'dark' ? 'left-[22px]' : 'left-[2px]'
              }`}
            />
          </button>
        </div>

        {/* Đơn giá & Ngân hàng */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-slate-900">
              1. Khu trọ, đơn giá điện nước & Tài khoản nhận tiền VietQR ({currentProperty.name})
            </h2>
            {canViewReports && (
              <button
                type="button"
                onClick={() => {
                  const id = `prop-${Date.now().toString(36)}`;
                  setProperties((prev) => [
                    ...prev,
                    { ...currentProperty, id, name: `Khu mới ${prev.length + 1}`, address: '' },
                  ]);
                  setSelectedPropertyId(id);
                  showToast('Đã thêm khu mới. Đổi tên và địa chỉ ngay bên dưới.');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                Thêm khu
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-medium text-slate-600 mb-1">Tên khu trọ</label>
              <input aria-label="Tên khu trọ"
                type="text"
                value={currentProperty.name}
                onChange={(e) =>
                  setProperties((prev) =>
                    prev.map((p) => (p.id === currentProperty.id ? { ...p, name: e.target.value } : p))
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Địa chỉ</label>
              <input aria-label="Địa chỉ"
                type="text"
                value={currentProperty.address}
                onChange={(e) =>
                  setProperties((prev) =>
                    prev.map((p) => (p.id === currentProperty.id ? { ...p, address: e.target.value } : p))
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Giá điện (đ/kWh)
              </label>
              <input aria-label="Giá điện (đ/kWh)"
                type="number"
                value={currentProperty.electricityRate}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setProperties((prev) =>
                    prev.map((p) =>
                      p.id === currentProperty.id
                        ? { ...p, electricityRate: val }
                        : p
                    )
                  );
                }}
                aria-describedby="elec-rate-note"
                className={`w-full rounded-xl border px-3.5 py-2 text-slate-900 font-semibold ${
                  currentProperty.electricityRate > ELECTRICITY_RATE_CAP ? 'border-amber-400' : 'border-slate-200'
                }`}
              />
              {currentProperty.electricityRate > ELECTRICITY_RATE_CAP && (
                <p id="elec-rate-note" className="mt-1.5 text-amber-700">
                  Cao hơn giá bán lẻ bậc cao nhất ({formatVND(ELECTRICITY_RATE_CAP)}/kWh). Thu tiền điện
                  cao hơn giá bán lẻ có thể bị phạt 20–30 triệu theo NĐ 133/2026. Đối chiếu với hóa đơn
                  EVN; các khoản điện dùng chung, bơm nước, vệ sinh nên ghi thành phí dịch vụ riêng
                  trong hợp đồng.
                </p>
              )}
              <button
                type="button"
                onClick={() => setIsElecToolOpen(true)}
                className="mt-2 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold text-[11px]"
              >
                ⚡ Tính lại cơ cấu giá điện & in phụ lục hợp đồng
              </button>
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Giá nước (đ/m3)
              </label>
              <input aria-label="Giá nước (đ/m3)"
                type="number"
                value={currentProperty.waterRate}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 0;
                  setProperties((prev) =>
                    prev.map((p) =>
                      p.id === currentProperty.id ? { ...p, waterRate: val } : p
                    )
                  );
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Ngân hàng nhận chuyển khoản
              </label>
              <select aria-label="Ngân hàng nhận chuyển khoản"
                value={currentProperty.bankBin}
                onChange={(e) => {
                  const bank = VIETQR_BANKS.find((x) => x.bin === e.target.value);
                  setProperties((prev) =>
                    prev.map((p) =>
                      p.id === currentProperty.id
                        ? { ...p, bankBin: e.target.value, bankName: bank?.name || p.bankName }
                        : p
                    )
                  );
                }}
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-slate-900 font-semibold"
              >
                {!VIETQR_BANKS.some((x) => x.bin === currentProperty.bankBin) && (
                  <option value={currentProperty.bankBin}>{currentProperty.bankName}</option>
                )}
                {VIETQR_BANKS.map((x) => (
                  <option key={x.bin} value={x.bin}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">Tên chủ tài khoản (không dấu)</label>
              <input aria-label="Tên chủ tài khoản (không dấu)"
                type="text"
                value={currentProperty.bankOwner}
                onChange={(e) =>
                  setProperties((prev) =>
                    prev.map((p) => (p.id === currentProperty.id ? { ...p, bankOwner: e.target.value.toUpperCase() } : p))
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-slate-900 font-semibold"
              />
            </div>
            <div>
              <label className="block font-medium text-slate-600 mb-1">
                Số tài khoản VietQR
              </label>
              <input aria-label="Số tài khoản VietQR"
                type="text"
                value={currentProperty.bankAccount}
                onChange={(e) =>
                  setProperties((prev) =>
                    prev.map((p) =>
                      p.id === currentProperty.id
                        ? { ...p, bankAccount: e.target.value }
                        : p
                    )
                  )
                }
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-slate-900 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Google Sheets Sync */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                2. Kết nối & Đồng bộ Google Sheets (Google Apps Script Web App)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tự động khởi tạo 7 trang tính (Phong, KhachThue, Xe, HopDong, HoaDon,
                SoThuChi, CaiDat) trên Google Sheets.
              </p>
            </div>
            <Sparkles className="w-5 h-5 text-blue-600" />
          </div>

          <div className="space-y-2 text-xs">
            <label className="block font-medium text-slate-600">
              URL Google Apps Script Web App (`.../exec`)
            </label>
            <input aria-label="URL Google Apps Script Web App (`.../exec`)"
              type="text"
              value={sheetsWebAppUrl}
              onChange={(e) => {
                setSheetsWebAppUrl(e.target.value);
                localStorage.setItem(SHEETS_URL_KEY, e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-slate-800"
            />
            <label className="block font-medium text-slate-600 pt-1">
              Mã đồng bộ (SYNC_TOKEN)
            </label>
            <input aria-label="Mã đồng bộ (SYNC_TOKEN)"
              type="password"
              autoComplete="off"
              value={sheetsSyncToken}
              onChange={(e) => {
                setSheetsSyncToken(e.target.value);
                localStorage.setItem(SHEETS_TOKEN_KEY, e.target.value);
              }}
              placeholder="Dán mã từ menu 🏠 Quản lý phòng trọ → 🔑 Tạo / xem mã đồng bộ trên Google Sheets"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 font-mono text-slate-800"
            />
            <p className="text-slate-500">
              Mã chỉ lưu trên trình duyệt này. Thiếu mã thì Apps Script từ chối đọc/ghi dữ liệu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleSyncGoogleSheets}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Đồng bộ ngay lên Google Sheets
            </button>
            {sheetsWebAppUrl.startsWith('https://script.google.com') && (
              <a
                href={sheetsWebAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Mở Web App trên Google Apps Script
              </a>
            )}
            <button
              type="button"
              onClick={handleResetDemoData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Khôi phục dữ liệu mẫu
            </button>
          </div>

          {syncStatus && (
            <div
              role={syncStatus.tone === 'error' ? 'alert' : 'status'}
              className={`text-xs font-medium pt-1 ${
                syncStatus.tone === 'error'
                  ? 'text-rose-600'
                  : syncStatus.tone === 'success'
                    ? 'text-emerald-600'
                    : 'text-slate-500'
              }`}
            >
              {syncStatus.tone === 'error' ? '✕' : syncStatus.tone === 'success' ? '✓' : '…'}{' '}
              {syncStatus.text}
            </div>
          )}
        </div>

        {/* 3. Tài khoản Đám mây Supabase & Phân quyền Quản lý / Người nhà */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                3. Tài khoản Đám mây (Supabase) & Phân quyền Quản lý / Người nhà
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tách biệt dữ liệu tuyệt đối theo từng chủ trọ (Row Level Security) và vẫn giữ nút chuyển nhanh sang Bản Demo khi đi gặp khách.
              </p>
            </div>
            <Cloud className="w-5 h-5 text-teal-600" />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <div className="font-bold text-slate-900">
                Trạng thái hiện tại:{' '}
                {isDemoMode ? (
                  <span className="text-amber-700">🎭 Đang ở Chế độ Bản Demo (12 phòng mẫu)</span>
                ) : (
                  <span className="text-teal-700">☁️ Đang dùng Sổ Đám mây ({authUser?.email})</span>
                )}
              </div>
              <div className="text-slate-500 mt-0.5">
                {isDemoMode
                  ? 'Mọi thao tác sửa/xóa chỉ nằm trên trình duyệt này để bạn tự tin demo với khách.'
                  : 'Mọi thay đổi được tự động đồng bộ vào cơ sở dữ liệu Supabase của riêng bạn.'}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isDemoMode && authUser ? (
                <button
                  type="button"
                  onClick={handleSwitchToDemoMode}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition"
                >
                  Chuyển sang Bản Demo
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition"
                >
                  Đăng nhập / Tạo tài khoản Chủ trọ
                </button>
              )}
            </div>
          </div>

          {/* Chủ quyền dữ liệu */}
          {canViewReports && (
            <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
              <div className="font-bold text-slate-800">Dữ liệu của bạn</div>
              <p className="text-slate-500">
                Tải toàn bộ sổ (phòng, khách, hợp đồng, hóa đơn, sổ thu chi) ra file Excel bất cứ lúc nào.
                {!isDemoMode && authUser ? ' Xoá tài khoản sẽ xoá sạch dữ liệu trên máy chủ.' : ''}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleExportXlsx}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition"
                >
                  ⬇ Tải toàn bộ dữ liệu (.xlsx)
                </button>
                {!isDemoMode && authUser && cloudCtx?.role === 'owner' && (
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="px-3.5 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 font-bold transition"
                  >
                    Xoá tài khoản và toàn bộ dữ liệu
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Phân quyền tài khoản phụ */}
          {canViewReports && (
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div className="font-bold text-slate-800">
              Cấp quyền Tài khoản phụ cho Quản lý / Người nhà tại cơ sở: {currentProperty.name}
            </div>
            <form onSubmit={handleAddPropertyStaff} className="flex flex-wrap gap-2">
              <input
                type="email"
                value={newStaffEmail}
                onChange={(e) => setNewStaffEmail(e.target.value)}
                placeholder="Nhập email người quản lý / người nhà..."
                className="flex-1 min-w-[220px] rounded-xl border border-slate-200 px-3.5 py-2 text-slate-900"
              />
              <select
                aria-label="Quyền của tài khoản phụ"
                value={newStaffRole}
                onChange={(e) => setNewStaffRole(e.target.value as 'staff' | 'viewer')}
                className="rounded-xl border border-slate-200 px-3 py-2 font-semibold text-slate-700 bg-white"
              >
                <option value="staff">Quản lý (Ghi điện nước & Thu tiền, ẩn Lợi nhuận)</option>
                <option value="viewer">Chỉ xem sơ đồ phòng & hóa đơn</option>
              </select>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold flex items-center gap-1.5 transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Cấp quyền</span>
              </button>
            </form>

            {staffList.length > 0 ? (
              <div className="space-y-2 pt-1">
                {staffList.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{st.staff_email}</span>
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                        {st.role === 'staff' ? 'Ghi số & Thu tiền (Ẩn lợi nhuận)' : 'Chỉ xem'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemovePropertyStaff(st.id, st.staff_email)}
                      className="text-rose-600 hover:underline font-semibold"
                    >
                      Thu hồi
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">
                {authUser
                  ? 'Chưa có tài khoản phụ nào được cấp quyền tại cơ sở này.'
                  : 'Đăng nhập tài khoản Chủ trọ để thêm và quản lý danh sách nhân viên/người nhà.'}
              </p>
            )}
          </div>
          )}
        </div>
      </div>
    );
  };

  // Hóa đơn nợ kỳ trước của hóa đơn đang mở trong Zalo Modal
  const zaloPreviousDebt = useMemo(() => {
    if (!zaloModalInvoice) return 0;
    return invoices
      .filter(
        (i) =>
          i.roomCode === zaloModalInvoice.roomCode &&
          i.id !== zaloModalInvoice.id &&
          i.billingMonth < zaloModalInvoice.billingMonth &&
          i.status !== 'draft'
      )
      .reduce((sum, i) => sum + Math.max(0, i.totalAmount - i.paidAmount), 0);
  }, [zaloModalInvoice, invoices]);

  // Danh sách hóa đơn còn nợ của phòng đang mở trong Collect Payment Modal
  const collectUnpaidRoomInvoices = useMemo(() => {
    if (!collectModalInvoice) return [];
    return invoices
      .filter(
        (i) =>
          i.roomCode === collectModalInvoice.roomCode &&
          i.status !== 'draft' &&
          i.totalAmount - i.paidAmount > 0
      )
      .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));
  }, [collectModalInvoice, invoices]);

  const MOBILE_ROOT_TABS: NavTab[] = ['overview', 'rooms', 'invoices'];
  const isSecondaryTab = !MOBILE_ROOT_TABS.includes(activeTab) && !activeTab.startsWith('finance-');
  const goBack = () => (navDepth > 0 ? window.history.back() : setActiveTab('overview'));

  const mobileBottomNavItems: Array<{
    id: NavTab | 'more';
    label: string;
    icon: React.ReactNode;
    isActive: boolean;
  }> = [
    {
      id: 'overview',
      label: 'Tổng quan',
      icon: <BarChart3 className="w-[22px] h-[22px]" />,
      isActive: activeTab === 'overview',
    },
    {
      id: 'rooms',
      label: 'Phòng',
      icon: <LayoutGrid className="w-[22px] h-[22px]" />,
      isActive: activeTab === 'rooms',
    },
    {
      id: 'invoices',
      label: 'Hóa đơn',
      icon: <Receipt className="w-[22px] h-[22px]" />,
      isActive: activeTab === 'invoices',
    },
    {
      id: 'finance-debts',
      label: 'Tài chính',
      icon: <Wallet className="w-[22px] h-[22px]" />,
      isActive: activeTab.startsWith('finance-'),
    },
    {
      id: 'more',
      label: 'Thêm',
      icon: <Menu className="w-[22px] h-[22px]" />,
      isActive: isSecondaryTab,
    },
  ];

  return (
    <div className="min-h-dvh flex text-slate-900">
      {/* LEFT SIDEBAR */}
      <aside className="w-60 lg-glass rounded-[28px] m-3 mr-0 shrink-0 hidden md:flex flex-col justify-between sticky top-3 self-start h-[calc(100dvh-1.5rem)] overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center justify-between px-2">
            <div
              onClick={() => setActiveTab('overview')}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <BrandLogoIcon className="w-8 h-8 shrink-0" />
              <div className="leading-tight">
                <div className="text-sm font-extrabold tracking-tight text-slate-900">
                  Quản lý phòng trọ
                </div>
                <div className="text-[10px] font-medium text-slate-400">
                  Sổ quản lý nhà trọ
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="space-y-1 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Tổng quan</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calendar')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'calendar'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Lịch</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'rooms'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Phòng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('tenants')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'tenants'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Khách thuê</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contracts')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'contracts'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Hợp đồng</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('invoices')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'invoices'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Hóa đơn</span>
            </button>

            {/* Tài chính expandable */}
            <div>
              <button
                type="button"
                onClick={() => {
                  setFinanceExpanded(!financeExpanded);
                  if (!activeTab.startsWith('finance-')) {
                    setActiveTab('finance-debts');
                  }
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                  activeTab.startsWith('finance-')
                    ? 'bg-blue-50 text-blue-600 font-bold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Wallet className="w-4 h-4" />
                  <span>Tài chính</span>
                </span>
                {financeExpanded ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>

              {financeExpanded && (
                <div className="mt-1 ml-6 pl-3 border-l border-slate-200 space-y-1">
                  {[
                    { id: 'finance-cashbook', label: 'Sổ thu chi' },
                    { id: 'finance-funds', label: 'Quỹ' },
                    { id: 'finance-debts', label: 'Công nợ' },
                    { id: 'finance-deposits', label: 'Cọc phải trả' },
                  ].map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setActiveTab(sub.id as NavTab)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                        activeTab === sub.id
                          ? 'text-blue-600 font-bold bg-blue-50/50'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      {sub.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === 'reports'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Báo cáo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('settings')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition ${
                activeTab === 'settings'
                  ? 'bg-blue-50 text-blue-600 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Cài đặt</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </nav>
        </div>

        {/* Bottom Google Sheets Sync Status */}
        <div className="p-4 border-t border-slate-100 space-y-2">
          <button
            type="button"
            onClick={handleSyncGoogleSheets}
            className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold flex items-center justify-center gap-2 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Đồng bộ Google Sheets
          </button>
          <button
            type="button"
            onClick={handleResetDemoData}
            className="w-full py-1.5 px-3 rounded-lg text-slate-400 hover:text-slate-600 text-[11px] flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3 h-3" />
            Khôi phục dữ liệu mẫu
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {isDemoMode ? (
          <div
            role="region"
            aria-label="Thông báo bản demo"
            className="bg-amber-50 border-b border-amber-200 px-4 lg:px-8 py-2 text-xs text-amber-900 flex flex-wrap items-center justify-between gap-2"
          >
            <div>
              <strong>Bản demo.</strong> Dữ liệu chỉ lưu trên trình duyệt này. Không nhập họ tên, SĐT hay
              CCCD của khách thuê thật.
            </div>
            <div className="flex items-center gap-2">
              {authUser ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsDemoMode(false);
                    loadCloudStateForUser(authUser.id, authUser.email);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-teal-700 hover:bg-teal-800 text-white font-bold text-[11px] transition flex items-center gap-1"
                >
                  <Cloud className="w-3 h-3" />
                  <span>Quay lại Sổ Đám mây ({authUser.email})</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-amber-900 hover:bg-slate-900 text-white font-bold text-[11px] transition flex items-center gap-1"
                >
                  <LogIn className="w-3 h-3" />
                  <span>Đăng nhập Chủ trọ (Lưu Đám mây)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div
            role="region"
            aria-label="Thông báo bản demo"
            className="bg-teal-50 border-b border-teal-200 px-4 lg:px-8 py-2 text-xs text-teal-900 flex flex-wrap items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-700 shrink-0" />
              <span>
                <strong>Sổ Quản lý Đám mây (Supabase RLS):</strong> Đang đăng nhập tài khoản{' '}
                <strong>{authUser?.email}</strong>
                {cloudCtx && cloudCtx.role !== 'owner'
                  ? cloudCtx.role === 'staff'
                    ? ' · Tài khoản phụ (ghi số, thu tiền)'
                    : ' · Chỉ xem'
                  : ''}
                {' · '}
                <span data-testid="cloud-status" className={cloudStatus === 'error' || cloudStatus === 'conflict' ? 'text-rose-700 font-bold' : cloudStatus === 'offline' ? 'text-amber-700 font-bold' : ''}>
                  {cloudStatus === 'loading' && 'Đang tải sổ...'}
                  {cloudStatus === 'saving' && 'Đang lưu...'}
                  {cloudStatus === 'saved' && `Đã lưu lên mây lúc ${cloudLastSavedAt ?? ''}`}
                  {cloudStatus === 'offline' && 'Mất mạng: thay đổi đang giữ trên máy, sẽ tự đồng bộ'}
                  {cloudStatus === 'error' && 'Lưu lên mây lỗi, đang thử lại (dữ liệu vẫn giữ trên máy)'}
                  {cloudStatus === 'conflict' && 'Sổ vừa được sửa ở thiết bị khác'}
                </span>
                {cloudStatus === 'conflict' && authUser && (
                  <button
                    type="button"
                    onClick={() => loadCloudStateForUser(authUser.id, authUser.email)}
                    className="ml-2 px-2 py-0.5 rounded-lg bg-rose-600 text-white font-bold text-[11px]"
                  >
                    Tải bản mới nhất
                  </button>
                )}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSwitchToDemoMode}
                className="px-2.5 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] border border-amber-300 transition"
              >
                🎭 Bật Chế độ Demo (Khi gặp khách)
              </button>
              <button
                type="button"
                onClick={handleSignOutCloud}
                className="px-2.5 py-1 rounded-lg bg-white hover:bg-rose-50 text-rose-600 font-bold text-[11px] border border-rose-200 transition flex items-center gap-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        )}
        {/* TOPBAR */}
        <header className="lg-glass rounded-[28px] mx-3 mt-3 md:mx-4 px-4 lg:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 sticky top-3 z-30">
          <div className="flex items-center gap-3 flex-1 min-w-[260px]">
            {isSecondaryTab && (
              <button
                type="button"
                onClick={goBack}
                aria-label="Quay lại"
                data-testid="mobile-back"
                className="md:hidden h-9 rounded-xl flex items-center justify-center shrink-0 gap-0.5 px-2 text-blue-600 font-semibold text-sm"
              >
                <ChevronLeft className="w-5 h-5" />
                <span>Quay lại</span>
              </button>
            )}
            {/* Property Selector */}
            <select
              aria-label="Chọn cơ sở nhà trọ"
              value={currentProperty.id}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 focus:border-blue-600 focus:outline-none"
            >
              {visibleProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Global Search */}
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                aria-label="Tìm kiếm phòng, khách thuê, hóa đơn"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Tìm phòng, khách, SĐT, mã hóa đơn..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50/60 focus:bg-white pl-9 pr-4 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-none transition"
              />
              {searchResults.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  {searchResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={res.onClick}
                      className="w-full px-4 py-2 text-left hover:bg-slate-50 flex items-center justify-between gap-2"
                    >
                      <div>
                        <div className="text-xs font-bold text-slate-900">
                          {res.label}
                        </div>
                        <div className="text-[11px] text-slate-500 tabular-nums">{res.sub}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-semibold">
                        {res.badge}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Topbar Action Buttons (Mobile & Expo Go + Google Sheets) */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Chuyển sang ban ngày' : 'Chuyển sang ban đêm'}
              title={theme === 'dark' ? 'Ban ngày' : 'Ban đêm'}
              className="hidden md:inline-flex w-10 h-10 rounded-full items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              data-testid="theme-toggle"
            >
              {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <a
              href={DEFAULT_GOOGLE_SHEETS_URL}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold border border-emerald-200 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Google Sheets</span>
            </a>

            <button
              type="button"
              onClick={() => setIsMobilePreview((v) => !v)}
              className={`hidden md:inline-flex px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                isMobilePreview
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {isMobilePreview ? '💻 Giao diện Web' : '📱 Khung Mobile'}
            </button>

            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                !isDemoMode && authUser
                  ? 'bg-teal-50 text-teal-800 border-teal-200 hover:bg-teal-100'
                  : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{!isDemoMode && authUser ? 'Tài khoản Cloud' : 'Đăng nhập / Demo'}</span>
              <span className="sr-only sm:hidden">{!isDemoMode && authUser ? 'Tài khoản Cloud' : 'Đăng nhập'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPhoneQrOpen(true)}
              className="hidden md:flex px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition items-center gap-1.5"
            >
              <span>📲 Mở trên điện thoại</span>
            </button>
          </div>

        </header>

        {/* PAGE CONTENT */}
        <main
          className={`w-full mx-auto transition-all ${
            isMobilePreview
              ? 'relative max-w-[420px] h-[760px] my-3 bg-[#F8FAFC] rounded-[44px] border-[10px] border-slate-900 shadow-2xl overflow-hidden flex flex-col shrink-0'
              : 'p-4 pb-32 md:pb-8 lg:p-8 max-w-7xl flex-1'
          }`}
        >
          {isMobilePreview && (
            <>
              {/* Thanh trạng thái iOS + Dynamic Island, trong suốt theo nền */}
              <div className="px-7 pt-2.5 pb-1 grid grid-cols-3 items-center text-[13px] font-semibold text-slate-900 select-none">
                <span className="tabular-nums">9:41</span>
                <span className="justify-self-center w-[92px] h-[26px] rounded-full bg-black" />
                <span className="justify-self-end flex items-center gap-1">
                  <Signal className="w-4 h-4" />
                  <Wifi className="w-4 h-4" />
                  <BatteryFull className="w-5 h-5" />
                </span>
              </div>

              {/* Mobile App Header Banner */}
              <div className="lg-glass mx-3 mt-1 mb-2 rounded-[22px] px-4 py-2.5 flex items-center justify-between text-slate-900">
                <div className="flex items-center gap-2.5">
                  {isSecondaryTab && (
                    <button
                      type="button"
                      onClick={goBack}
                      aria-label="Quay lại"
                      data-testid="mobile-back"
                      className="h-8 -ml-1 rounded-xl flex items-center justify-center shrink-0 gap-0.5 px-2 text-blue-600 font-semibold text-sm"
                    >
                      <ChevronLeft className="w-5 h-5" />
                      <span>Quay lại</span>
                    </button>
                  )}
                  <BrandLogoIcon className="w-8 h-8 shrink-0" />
                  <div>
                    <div className="text-xs font-extrabold tracking-tight flex items-center gap-1.5">
                      <span>Quản lý phòng trọ</span>
                      <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-bold">
                        PWA
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {currentProperty.name} · {propertyRooms.length} phòng
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPhoneQrOpen(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] transition"
                >
                  Mã QR
                </button>
              </div>

            </>
          )}

          <div className={isMobilePreview ? 'p-4 flex-1 overflow-y-auto space-y-5' : ''}>
            {!canViewReports && !STAFF_TABS.includes(activeTab) ? (
              renderNoPermission()
            ) : (
              <>
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'calendar' && renderCalendar()}
                {activeTab === 'rooms' && renderRooms()}
                {activeTab === 'tenants' && renderTenants()}
                {activeTab === 'contracts' && renderContracts()}
                {activeTab === 'invoices' && renderInvoices()}
                {activeTab.startsWith('finance-') && renderFinance()}
                {activeTab === 'reports' && renderReports()}
                {activeTab === 'settings' && renderSettings()}
              </>
            )}
          </div>

          {/* Thanh tab nổi trong Khung Mobile */}
          {isMobilePreview && (
            <nav
              aria-label="Điều hướng di động"
              className="sticky bottom-4 mx-4 mb-4 z-20 lg-clear rounded-full h-[62px] p-[5px] flex items-center gap-1"
            >
              {mobileBottomNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => (item.id === 'more' ? openMobileNav() : setActiveTab(item.id))}
                  aria-label={item.label}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`lg-tab h-full rounded-full flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-all duration-200 ${
                    item.isActive ? 'lg-tab-on flex-[1.9] px-3' : 'flex-1'
                  }`}
                >
                  {item.icon}
                  {item.isActive && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </nav>
          )}

          {isMobilePreview && (
            <MobileNavDrawer
              variant="frame"
              items={MOBILE_NAV}
              isItemActive={(id) => (id === 'finance-debts' ? activeTab.startsWith('finance-') : activeTab === id)}
              onSelect={setActiveTab}
              isOpen={isMobileNavOpen}
              onOpenChange={setMobileNavOpen}
              brand={<BrandLogoIcon className="w-9 h-9 shrink-0" />}
              title="Quản lý phòng trọ"
              subtitle={`${currentProperty.name} · ${propertyRooms.length} phòng`}
            />
          )}
        </main>

        {/* Thanh tab nổi trên điện thoại thật (< 768px) */}
        {!isMobilePreview && (
            <nav
              aria-label="Điều hướng di động"
              className="md:hidden fixed left-4 right-4 bottom-[max(16px,env(safe-area-inset-bottom))] z-40 lg-clear rounded-full h-[62px] p-[5px] flex items-center gap-1"
            >
              {mobileBottomNavItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => (item.id === 'more' ? openMobileNav() : setActiveTab(item.id))}
                  aria-label={item.label}
                  aria-current={item.isActive ? 'page' : undefined}
                  className={`lg-tab h-full rounded-full flex items-center justify-center gap-1.5 text-[13px] font-semibold transition-all duration-200 ${
                    item.isActive ? 'lg-tab-on flex-[1.9] px-3' : 'flex-1'
                  }`}
                >
                  {item.icon}
                  {item.isActive && <span className="truncate">{item.label}</span>}
                </button>
              ))}
            </nav>
        )}
        {!isMobilePreview && (
          <MobileNavDrawer
            variant="screen"
            items={MOBILE_NAV}
            isItemActive={(id) => (id === 'finance-debts' ? activeTab.startsWith('finance-') : activeTab === id)}
            onSelect={setActiveTab}
            isOpen={isMobileNavOpen}
            onOpenChange={setMobileNavOpen}
            brand={<BrandLogoIcon className="w-9 h-9 shrink-0" />}
            title="Quản lý phòng trọ"
            subtitle={`${currentProperty.name} · ${propertyRooms.length} phòng`}
          />
        )}
      </div>

      {/* MODALS */}
      <CreateContractModal
        key={`contract-${today}-${isContractModalOpen ? `${currentProperty.id}-${contractInitialRoom}` : 'closed'}`}
        isOpen={isContractModalOpen && canViewReports}
        onClose={() => setIsContractModalOpen(false)}
        property={currentProperty}
        rooms={propertyRooms}
        tenants={tenants}
        initialRoomCode={contractInitialRoom}
        onCreateContract={handleCreateContract}
      />

      <MeterReadingModal
        isOpen={isMeterModalOpen}
        onClose={() => setIsMeterModalOpen(false)}
        rooms={propertyRooms}
        invoicesForMonth={invoices.filter((i) => i.billingMonth === invoiceMonth)}
        initialRoomCode={meterInitialRoom}
        onSaveReadingsAndCreateInvoices={handleSaveReadingsAndCreateInvoices}
      />

      <InvoiceZaloModal
        isOpen={!!zaloModalInvoice}
        onClose={() => setZaloModalInvoice(null)}
        invoice={zaloModalInvoice}
        property={currentProperty}
        previousDebtAmount={zaloPreviousDebt}
        depositHeld={
          propertyRooms.find((r) => r.code === zaloModalInvoice?.roomCode)?.deposit || 0
        }
        publicInvoiceUrl={
          !isDemoMode && zaloModalInvoice?.publicToken
            ? `${PUBLIC_WEB_URL}?hd=${zaloModalInvoice.publicToken}`
            : undefined
        }
        onMarkSentZalo={(invId) =>
          setInvoices((prev) =>
            prev.map((i) => (i.id === invId ? { ...i, sentZalo: true } : i))
          )
        }
      />

      <CollectPaymentModal
        key={`collect-${today}`}
        isOpen={!!collectModalInvoice}
        onClose={() => {
          setCollectModalInvoice(null);
          setConfirmingReport(null);
        }}
        targetInvoice={collectModalInvoice}
        unpaidRoomInvoices={collectUnpaidRoomInvoices}
        initialAmount={confirmingReport?.amount}
        onConfirmCollect={(payload) => {
          const res = handleConfirmCollectFIFO(payload);
          if (confirmingReport && res.length > 0) {
            setReportStatus(confirmingReport.id, 'confirmed');
            setConfirmingReport(null);
          }
          return res;
        }}
      />

      <InvoiceEditModal
        invoice={editInvoice}
        onClose={() => setEditInvoice(null)}
        onSave={(updated) => {
          const old = allInvoices.find((i) => i.id === updated.id);
          setInvoices((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
          // Hóa đơn mới nhất của phòng: chỉ số đồng hồ của phòng đi theo số vừa sửa
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
          setEditInvoice(null);
          showToast(
            updated.sentZalo
              ? `Đã lưu hóa đơn ${updated.code}`
              : `Đã lưu hóa đơn ${updated.code}: tổng mới ${formatVND(updated.totalAmount)}, nhớ gửi lại phiếu cho khách`
          );
        }}
        onCancelInvoice={(inv) => {
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
          setEditInvoice(null);
          showToast(`Đã huỷ hóa đơn ${inv.code}`);
        }}
      />

      <ExpenseModal
        isOpen={isExpenseOpen}
        propertyId={currentProperty.id}
        rooms={propertyRooms}
        onClose={() => setIsExpenseOpen(false)}
        onSave={(tx) => {
          setTransactions((prev) => [tx, ...prev]);
          setIsExpenseOpen(false);
          showToast(`Đã ghi khoản chi ${formatVND(tx.amount)} vào sổ thu chi`);
        }}
      />

      <MoveOutModal
        contract={canViewReports ? moveOutContract : null}
        room={
          rooms.find((r) => r.propertyId === moveOutContract?.propertyId && r.code === moveOutContract?.roomCode) ??
          // Hợp đồng trỏ tới phòng đã không còn (dữ liệu lỗi cũ): vẫn cho thanh lý, phòng giả không ghi lại vào sổ
          (moveOutContract
            ? ({ id: '', propertyId: moveOutContract.propertyId, code: moveOutContract.roomCode, floor: 1, price: 0, deposit: 0, status: 'occupied', elecIndex: 0, waterIndex: 0, trashFee: 0, internetFee: 0, vehicleCount: 0 } as Room)
            : undefined)
        }
        roomInvoices={allInvoices.filter(
          (i) => i.propertyId === moveOutContract?.propertyId && i.roomCode === moveOutContract?.roomCode
        )}
        property={currentProperty}
        finalInvoiceCode={nextCode('HD-IV-', allInvoices.map((i) => i.code), 100)}
        onClose={() => setMoveOutContract(null)}
        onConfirm={(plan) => {
          const c = plan.contract;
          setContracts((prev) => prev.map((x) => (x.id === c.id ? c : x)));
          setRooms((prev) => prev.map((x) => (x.id === plan.room.id ? plan.room : x)));
          setTenants((prev) =>
            prev.map((t) =>
              t.propertyId === c.propertyId && t.contractCode === c.code ? { ...t, status: 'moved_out' } : t
            )
          );
          setInvoices((prev) => {
            const kept = prev
              .filter((i) => !plan.removeInvoiceIds.includes(i.id))
              .map((i) => {
                const up = plan.invoiceUpdates[i.id];
                return up ? { ...i, paidAmount: i.paidAmount + up.addPaid, status: up.newStatus } : i;
              });
            return plan.finalInvoice ? [plan.finalInvoice, ...kept] : kept;
          });
          setMoveOutContract(null);
          showToast(
            `Đã trả phòng ${c.roomCode}. Hoàn cọc ${formatVND(plan.refund)}${
              plan.extraDue > 0 ? `, khách còn thiếu ${formatVND(plan.extraDue)}` : ''
            }`
          );
        }}
      />

      <RoomAddModal
        isOpen={isRoomAddOpen && canViewReports}
        property={currentProperty}
        rooms={rooms}
        onClose={() => setIsRoomAddOpen(false)}
        onAdd={(room) => {
          setRooms((prev) => [...prev, room]);
          showToast(`Đã thêm phòng ${room.code}`);
        }}
      />

      <ElectricityRestructureModal
        isOpen={isElecToolOpen && canViewReports}
        onClose={() => setIsElecToolOpen(false)}
        property={currentProperty}
        rooms={propertyRooms}
        invoices={invoices}
        contracts={contracts}
        rateCap={ELECTRICITY_RATE_CAP}
        effectiveDate={`01/${nextMonth.slice(5)}/${nextMonth.slice(0, 4)}`}
        onApply={(newRate, inc) => {
          const pid = currentProperty.id;
          setProperties((prev) => prev.map((x) => (x.id === pid ? { ...x, electricityRate: newRate } : x)));
          setRooms((prev) =>
            prev.map((r) => (r.propertyId === pid && inc[r.code] ? { ...r, price: r.price + inc[r.code] } : r))
          );
          setContracts((prev) =>
            prev.map((c) =>
              c.propertyId === pid && c.status === 'active' && inc[c.roomCode]
                ? { ...c, rentAmount: c.rentAmount + inc[c.roomCode] }
                : c
            )
          );
          setIsElecToolOpen(false);
          showToast(`Đã áp dụng giá điện ${formatVND(newRate)}/kWh và tiền phòng mới từ kỳ sau`);
        }}
      />

      <TempResidenceModal
        isOpen={isTempResidenceOpen}
        onClose={() => setIsTempResidenceOpen(false)}
        tenants={tenants}
        property={currentProperty}
      />

      <RoomPricingModal
        isOpen={isRoomPricingOpen && canViewReports}
        onClose={() => setIsRoomPricingOpen(false)}
        property={currentProperty}
        rooms={propertyRooms}
        contracts={contracts}
        initialRoomCode={pricingRoomCode}
        initialMode={pricingMode}
        onSaveRoomPricing={handleSaveRoomPricing}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        isCurrentlyCloud={!isDemoMode && !!authUser}
        currentEmail={authUser?.email}
        onSwitchToDemo={handleSwitchToDemoMode}
        onAuthSuccess={(email) => {
          supabase.auth.getUser().then(({ data: { user } }) => {
            if (user) {
              setAuthUser({ id: user.id, email });
              setIsDemoMode(false);
              loadCloudStateForUser(user.id, email);
            }
          });
        }}
      />

      {/* MÃ QR MỞ BẢN WEB TRÊN ĐIỆN THOẠI */}
      {isPhoneQrOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 ui-enter">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  📲 Mở trên điện thoại
                </h3>
                <p className="text-xs text-slate-500">
                  Quét bằng Camera hoặc Zalo, không cần cài app
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng cửa sổ QR"
                onClick={() => setIsPhoneQrOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-600"
              >
                Đóng
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
              {pwaQrDataUrl && (
                <img
                  src={pwaQrDataUrl}
                  alt="Mã QR mở bản web trên điện thoại"
                  className="w-44 h-44 mx-auto rounded-xl border border-slate-200 bg-white p-1.5"
                />
              )}
              <div className="text-[11px] font-mono text-blue-700 bg-blue-50 py-1 px-2 rounded-lg break-all">
                {MOBILE_WEB_URL}
              </div>
              <p className="text-[11px] text-slate-500">
                Mở bằng Safari / Chrome rồi chọn <b>Thêm vào Màn hình chính</b> để dùng như app
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold ui-enter"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

export default App;
