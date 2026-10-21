import type {
  CashTransaction,
  Contract,
  Invoice,
  Property,
  Room,
  Tenant,
  Vehicle,
} from '../types.ts';

/** Toàn bộ sổ của 1 chủ trọ, lưu thành 1 dòng `user_app_state.state`. */
export interface AppSnapshot {
  properties: Property[];
  rooms: Room[];
  tenants: Tenant[];
  vehicles: Vehicle[];
  contracts: Contract[];
  invoices: Invoice[];
  transactions: CashTransaction[];
}

/** Bản sao trên máy: giữ thay đổi chưa lên mây khi mạng chập chờn hoặc đóng tab giữa chừng. */
export interface LocalCloudCache {
  state: AppSnapshot;
  /** `updated_at` của bản trên mây mà bản này được sửa từ đó. */
  baseVersion: string | null;
  dirty: boolean;
}

export type CloudStatus = 'idle' | 'loading' | 'saving' | 'saved' | 'offline' | 'error' | 'conflict';

export const cloudCacheKey = (ownerId: string, userId: string) =>
  `qlpt-cloud-v1-${ownerId}-${userId}`;

export function readCloudCache(key: string): LocalCloudCache | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as LocalCloudCache;
    return parsed && parsed.state ? parsed : null;
  } catch {
    return null;
  }
}

export function writeCloudCache(key: string, cache: LocalCloudCache): void {
  try {
    localStorage.setItem(key, JSON.stringify(cache));
  } catch {
    // Hết dung lượng localStorage: vẫn còn bản trên mây, bỏ qua.
  }
}

/** Sổ trống cho tài khoản mới: 1 cơ sở chưa có phòng, chờ nhập liệu hộ. */
export function emptySnapshot(ownerEmail: string): AppSnapshot {
  return {
    properties: [
      {
        id: 'prop-1',
        name: `Nhà trọ của ${ownerEmail.split('@')[0]}`,
        address: '',
        electricityRate: 3460,
        waterRate: 18000,
        trashFee: 30000,
        internetFee: 100000,
        vehicleFee: 100000,
        bankBin: '970436',
        bankName: 'Vietcombank',
        bankAccount: '',
        bankOwner: '',
      },
    ],
    rooms: [],
    tenants: [],
    vehicles: [],
    contracts: [],
    invoices: [],
    transactions: [],
  };
}

export function normalizeSnapshot(raw: unknown): AppSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const st = raw as Record<string, unknown>;
  if (!Array.isArray(st.properties) || st.properties.length === 0) return null;
  const arr = <T,>(v: unknown) => (Array.isArray(v) ? (v as T[]) : []);
  return {
    properties: st.properties as Property[],
    rooms: arr<Room>(st.rooms),
    tenants: arr<Tenant>(st.tenants),
    vehicles: arr<Vehicle>(st.vehicles),
    contracts: arr<Contract>(st.contracts),
    invoices: arr<Invoice>(st.invoices),
    transactions: arr<CashTransaction>(st.transactions),
  };
}

export type StartDecision =
  | { use: 'remote'; state: AppSnapshot; push: false; backupLocal: boolean }
  | { use: 'local'; state: AppSnapshot; push: true }
  | { use: 'empty'; push: true }
  | { use: 'offline-local'; state: AppSnapshot }
  | { use: 'offline-none' };

/**
 * Chọn dữ liệu khởi đầu khi đăng nhập.
 * - Có thay đổi chưa lên mây và bản mây chưa bị ai sửa từ đó -> dùng bản máy rồi đẩy lên.
 * - Bản mây đã đổi trong lúc máy này có thay đổi chưa lưu -> lấy bản mây, sao lưu bản máy để không mất.
 */
export function decideStartState(params: {
  local: LocalCloudCache | null;
  remote: { state: unknown; updatedAt: string } | null;
  remoteFailed: boolean;
}): StartDecision {
  const { local, remote, remoteFailed } = params;
  if (remoteFailed) return local ? { use: 'offline-local', state: local.state } : { use: 'offline-none' };
  const remoteState = remote ? normalizeSnapshot(remote.state) : null;
  if (local?.dirty && (local.baseVersion ?? null) === (remoteState ? remote!.updatedAt : null)) {
    return { use: 'local', state: local.state, push: true };
  }
  if (remoteState) {
    return { use: 'remote', state: remoteState, push: false, backupLocal: !!local?.dirty };
  }
  return { use: 'empty', push: true };
}

/** Chủ sổ mà tài khoản này được làm việc cùng (tài khoản phụ) hoặc chính mình. */
export interface CloudOwnerContext {
  ownerId: string;
  role: 'owner' | 'staff' | 'viewer';
  propertyIds: string[] | null; // null = mọi cơ sở
}
