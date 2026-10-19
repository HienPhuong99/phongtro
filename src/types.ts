export type RoomStatus = 'occupied' | 'vacant' | 'moving_in' | 'deposited' | 'maintenance';

export type NavTab =
  | 'overview'
  | 'calendar'
  | 'rooms'
  | 'tenants'
  | 'contracts'
  | 'invoices'
  | 'finance-cashbook'
  | 'finance-funds'
  | 'finance-debts'
  | 'finance-deposits'
  | 'reports'
  | 'settings';

export interface Property {
  id: string;
  name: string;
  address: string;
  electricityRate: number;
  waterRate: number;
  trashFee: number;
  internetFee: number;
  vehicleFee: number;
  bankBin: string;
  bankName: string;
  bankAccount: string;
  bankOwner: string;
}

export interface Room {
  id: string;
  propertyId: string;
  code: string;
  floor: number;
  price: number;
  deposit: number;
  status: RoomStatus;
  tenantId?: string;
  tenantName?: string;
  tenantPhone?: string;
  contractCode?: string;
  elecIndex: number;
  waterIndex: number;
  trashFee: number;
  internetFee: number;
  vehicleCount: number;
  notes?: string;
}

export interface Tenant {
  id: string;
  code: string;
  propertyId: string;
  name: string;
  phone: string;
  cccd: string;
  roomCode: string;
  contractCode: string;
  contractEndDate: string;
  role: 'representative' | 'co_tenant';
  status: 'active' | 'moved_out';
  hasCccdPhoto: boolean;
  cccdFrontUrl?: string;
  dob?: string;
  hometown?: string;
  tempResidenceDeclared: boolean;
}

export interface Vehicle {
  id: string;
  propertyId: string;
  plate: string;
  ownerName: string;
  phone: string;
  roomCode: string;
  vehicleType: string;
}

export interface Contract {
  id: string;
  code: string;
  propertyId: string;
  roomCode: string;
  tenantId: string;
  tenantName: string;
  tenantPhone: string;
  coTenantNames: string[];
  startDate: string; // DD/MM/YYYY
  endDate: string;   // DD/MM/YYYY
  signDate: string;  // DD/MM/YYYY
  paymentCycle: string;
  billingCycle: 'calendar_month' | 'move_in_date';
  rentAmount: number;
  depositAmount: number;
  depositMode: 'received_today' | 'received_before' | 'pending';
  status: 'active' | 'ended' | 'terminated';
  daysRemaining: number;
  moveOutDate?: string;
  depositDeducted?: number;
  depositRefundAmount?: number;
  refundBankAccount?: string;
  refundBankName?: string;
  depositRefunded?: boolean;
}

export interface Invoice {
  id: string;
  code: string;
  propertyId: string;
  roomCode: string;
  floor: number;
  tenantName: string;
  tenantPhone: string;
  contractCode: string;
  billingMonth: string;
  periodLabel: string;
  issueDate: string;
  dueDate: string;
  rentAmount: number;
  elecOld: number;
  elecNew: number;
  elecUsage: number;
  elecRate: number;
  elecAmount: number;
  waterOld: number;
  waterNew: number;
  waterUsage: number;
  waterRate: number;
  waterAmount: number;
  trashAmount: number;
  internetAmount: number;
  vehicleCount: number;
  vehicleAmount: number;
  totalAmount: number;
  paidAmount: number;
  status: 'draft' | 'unpaid' | 'partial' | 'paid';
  sentZalo: boolean;
  isOverdue: boolean;
  meterPhoto?: string;
}

export interface CashTransaction {
  id: string;
  propertyId: string;
  date: string; // DD/MM/YYYY
  isoDate: string; // YYYY-MM-DD
  type: 'income' | 'expense';
  category: 'Thu tiền hóa đơn' | 'Thu tiền cọc' | 'Bảo trì/Sửa chữa' | 'Vệ sinh' | 'Hoàn tiền cọc' | 'Chi phí khác';
  roomCode?: string;
  invoiceCode?: string;
  description: string;
  amount: number;
  method: 'Chuyển khoản' | 'Tiền mặt';
  billImage?: string;
}

export interface FifoAllocatedItem {
  invoiceId: string;
  invoiceCode: string;
  monthLabel: string;
  amountAllocated: number;
  fullyPaid: boolean;
}

export interface CalendarEventItem {
  id: string;
  date: string; // DD/MM/YYYY
  dayOfMonth: number;
  monthYear: string; // MM/YYYY
  title: string;
  subtitle: string;
  type: 'meter' | 'invoice' | 'due' | 'contract' | 'maintenance';
  roomCode?: string;
  actionTab: NavTab;
}

export interface RoomPriceUpdateItem {
  roomCode: string;
  price: number;
  deposit: number;
  trashFee: number;
  internetFee: number;
  vehicleCount: number;
  status: RoomStatus;
  notes?: string;
}

