import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';

type MobileTab = 'overview' | 'rooms' | 'invoices' | 'finance' | 'tenants';

interface RoomItem {
  id: string;
  name: string;
  floor: number;
  status: 'rented' | 'vacant' | 'maintenance';
  price: number;
  deposit: number;
  tenantName?: string;
  tenantPhone?: string;
  occupantsCount: number;
  maxOccupants: number;
  vehiclesCount: number;
  contractCode?: string;
  contractEnd?: string;
  debt: number;
  note?: string;
}

interface InvoiceItem {
  id: string;
  code: string;
  period: '2026-09' | '2026-10' | '2026-11';
  periodLabel: string;
  roomId: string;
  roomName: string;
  tenantName: string;
  tenantPhone: string;
  rentAmount: number;
  oldElec: number;
  newElec: number;
  elecAmount: number;
  oldWater: number;
  newWater: number;
  waterAmount: number;
  serviceAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'paid' | 'unpaid';
}

interface TenantItem {
  id: string;
  code: string;
  name: string;
  phone: string;
  cccd: string;
  roomId?: string;
  roomName?: string;
  role: 'representative' | 'member' | 'former';
  status: 'staying' | 'moved_out';
  totalPaid: number;
  debt: number;
}

interface VehicleItem {
  id: string;
  roomId: string;
  tenantName: string;
  type: string;
  licensePlate: string;
  note: string;
}

interface TransactionItem {
  id: string;
  code: string;
  date: string;
  type: 'income' | 'expense';
  title: string;
  roomName: string;
  amount: number;
  method: string;
}

const INITIAL_ROOMS: RoomItem[] = [
  { id: 'P101', name: 'Phòng P101', floor: 1, status: 'rented', price: 2500000, deposit: 2500000, tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', occupantsCount: 2, maxOccupants: 3, vehiclesCount: 2, contractCode: 'HD-00001', contractEnd: '21/01/2027', debt: 6961800 },
  { id: 'P102', name: 'Phòng P102', floor: 1, status: 'rented', price: 2500000, deposit: 2500000, tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', occupantsCount: 2, maxOccupants: 3, vehiclesCount: 2, contractCode: 'HD-00002', contractEnd: '21/04/2027', debt: 7378400 },
  { id: 'P103', name: 'Phòng P103', floor: 1, status: 'rented', price: 2800000, deposit: 2800000, tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 0, contractCode: 'HD-00003', contractEnd: '19/02/2027', debt: 8742900 },
  { id: 'P104', name: 'Phòng P104', floor: 1, status: 'rented', price: 2800000, deposit: 2800000, tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 0, contractCode: 'HD-00004', contractEnd: '21/12/2026', debt: 6691100 },
  { id: 'P201', name: 'Phòng P201', floor: 2, status: 'rented', price: 2500000, deposit: 2500000, tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 1, contractCode: 'HD-00005', contractEnd: '21/11/2026', debt: 7327400 },
  { id: 'P202', name: 'Phòng P202', floor: 2, status: 'vacant', price: 2500000, deposit: 2500000, occupantsCount: 0, maxOccupants: 3, vehiclesCount: 0, debt: 0, note: 'Huỳnh Thị Hà đã trả phòng (chờ hoàn cọc 909.334đ)' },
  { id: 'P203', name: 'Phòng P203', floor: 2, status: 'rented', price: 2500000, deposit: 2500000, tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 1, contractCode: 'HD-00006', contractEnd: '21/04/2027', debt: 7076900 },
  { id: 'P204', name: 'Phòng P204', floor: 2, status: 'maintenance', price: 2200000, deposit: 2200000, occupantsCount: 0, maxOccupants: 3, vehiclesCount: 0, debt: 0, note: 'Đang sửa chữa máy lạnh & chống thấm (1.050.000đ)' },
  { id: 'P301', name: 'Phòng P301', floor: 3, status: 'rented', price: 2200000, deposit: 2200000, tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 1, contractCode: 'HD-00007', contractEnd: '21/10/2026', debt: 7872500 },
  { id: 'P302', name: 'Phòng P302', floor: 3, status: 'rented', price: 2200000, deposit: 2200000, tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', occupantsCount: 2, maxOccupants: 3, vehiclesCount: 2, contractCode: 'HD-00008', contractEnd: '21/10/2026', debt: 6759400 },
  { id: 'P303', name: 'Phòng P303', floor: 3, status: 'rented', price: 2500000, deposit: 2500000, tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', occupantsCount: 3, maxOccupants: 3, vehiclesCount: 0, contractCode: 'HD-00009', contractEnd: '21/01/2027', debt: 6812500 },
  { id: 'P304', name: 'Phòng P304', floor: 3, status: 'vacant', price: 2700000, deposit: 2700000, occupantsCount: 0, maxOccupants: 3, vehiclesCount: 0, debt: 0, note: 'Phòng trống sẵn sàng đón khách' },
];

const INITIAL_INVOICES: InvoiceItem[] = [
  { id: 'HD-IV-00052', code: 'HD-IV-00052', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P101', roomName: 'Phòng P101', tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', rentAmount: 2500000, oldElec: 1120, newElec: 1188, elecAmount: 238000, oldWater: 42, newWater: 46, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2940000, paidAmount: 1776200, remainingAmount: 1163800, status: 'unpaid' },
  { id: 'HD-IV-00070', code: 'HD-IV-00070', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P101', roomName: 'Phòng P101', tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', rentAmount: 2500000, oldElec: 1188, newElec: 1240, elecAmount: 182000, oldWater: 46, newWater: 49, waterAmount: 58000, serviceAmount: 130000, totalAmount: 2870000, paidAmount: 0, remainingAmount: 2870000, status: 'unpaid' },
  { id: 'HD-IV-00089', code: 'HD-IV-00089', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P101', roomName: 'Phòng P101', tenantName: 'Trần Văn Nam', tenantPhone: '0971770075', rentAmount: 2500000, oldElec: 1240, newElec: 1304, elecAmount: 224000, oldWater: 49, newWater: 53, waterAmount: 74000, serviceAmount: 130000, totalAmount: 2928000, paidAmount: 0, remainingAmount: 2928000, status: 'unpaid' },
  { id: 'HD-IV-00053', code: 'HD-IV-00053', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P102', roomName: 'Phòng P102', tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', rentAmount: 2500000, oldElec: 940, newElec: 1012, elecAmount: 252000, oldWater: 31, newWater: 35, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2954000, paidAmount: 1528600, remainingAmount: 1425400, status: 'unpaid' },
  { id: 'HD-IV-00071', code: 'HD-IV-00071', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P102', roomName: 'Phòng P102', tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', rentAmount: 2500000, oldElec: 1012, newElec: 1090, elecAmount: 273000, oldWater: 35, newWater: 39, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2975000, paidAmount: 0, remainingAmount: 2975000, status: 'unpaid' },
  { id: 'HD-IV-00090', code: 'HD-IV-00090', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P102', roomName: 'Phòng P102', tenantName: 'Phạm Văn Đức', tenantPhone: '0971317972', rentAmount: 2500000, oldElec: 1090, newElec: 1168, elecAmount: 273000, oldWater: 39, newWater: 43, waterAmount: 75000, serviceAmount: 130000, totalAmount: 2978000, paidAmount: 0, remainingAmount: 2978000, status: 'unpaid' },
  { id: 'HD-IV-00054', code: 'HD-IV-00054', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P103', roomName: 'Phòng P103', tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', rentAmount: 2800000, oldElec: 1410, newElec: 1502, elecAmount: 322000, oldWater: 55, newWater: 61, waterAmount: 108000, serviceAmount: 130000, totalAmount: 3360000, paidAmount: 1353100, remainingAmount: 2006900, status: 'unpaid' },
  { id: 'HD-IV-00072', code: 'HD-IV-00072', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P103', roomName: 'Phòng P103', tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', rentAmount: 2800000, oldElec: 1502, newElec: 1594, elecAmount: 322000, oldWater: 61, newWater: 67, waterAmount: 108000, serviceAmount: 130000, totalAmount: 3360000, paidAmount: 0, remainingAmount: 3360000, status: 'unpaid' },
  { id: 'HD-IV-00091', code: 'HD-IV-00091', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P103', roomName: 'Phòng P103', tenantName: 'Võ Văn Hải', tenantPhone: '0911191902', rentAmount: 2800000, oldElec: 1594, newElec: 1690, elecAmount: 336000, oldWater: 67, newWater: 73, waterAmount: 110000, serviceAmount: 130000, totalAmount: 3376000, paidAmount: 0, remainingAmount: 3376000, status: 'unpaid' },
  { id: 'HD-IV-00055', code: 'HD-IV-00055', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P104', roomName: 'Phòng P104', tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', rentAmount: 2800000, oldElec: 880, newElec: 960, elecAmount: 280000, oldWater: 28, newWater: 33, waterAmount: 90000, serviceAmount: 130000, totalAmount: 3300000, paidAmount: 3300000, remainingAmount: 0, status: 'paid' },
  { id: 'HD-IV-00073', code: 'HD-IV-00073', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P104', roomName: 'Phòng P104', tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', rentAmount: 2800000, oldElec: 960, newElec: 1052, elecAmount: 322000, oldWater: 33, newWater: 38, waterAmount: 91100, serviceAmount: 130000, totalAmount: 3343100, paidAmount: 0, remainingAmount: 3343100, status: 'unpaid' },
  { id: 'HD-IV-00092', code: 'HD-IV-00092', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P104', roomName: 'Phòng P104', tenantName: 'Đặng Văn Khoa', tenantPhone: '0918445222', rentAmount: 2800000, oldElec: 1052, newElec: 1146, elecAmount: 329000, oldWater: 38, newWater: 43, waterAmount: 89000, serviceAmount: 130000, totalAmount: 3348000, paidAmount: 0, remainingAmount: 3348000, status: 'unpaid' },
  { id: 'HD-IV-00056', code: 'HD-IV-00056', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P201', roomName: 'Phòng P201', tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', rentAmount: 2500000, oldElec: 760, newElec: 834, elecAmount: 259000, oldWater: 24, newWater: 29, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2979000, paidAmount: 1581600, remainingAmount: 1397400, status: 'unpaid' },
  { id: 'HD-IV-00074', code: 'HD-IV-00074', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P201', roomName: 'Phòng P201', tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', rentAmount: 2500000, oldElec: 834, newElec: 904, elecAmount: 245000, oldWater: 29, newWater: 34, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2965000, paidAmount: 0, remainingAmount: 2965000, status: 'unpaid' },
  { id: 'HD-IV-00093', code: 'HD-IV-00093', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P201', roomName: 'Phòng P201', tenantName: 'Ngô Văn Minh', tenantPhone: '0987857729', rentAmount: 2500000, oldElec: 904, newElec: 974, elecAmount: 245000, oldWater: 34, newWater: 39, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2965000, paidAmount: 0, remainingAmount: 2965000, status: 'unpaid' },
  { id: 'HD-IV-00057', code: 'HD-IV-00057', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P203', roomName: 'Phòng P203', tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', rentAmount: 2500000, oldElec: 610, newElec: 682, elecAmount: 252000, oldWater: 19, newWater: 23, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2954000, paidAmount: 1759100, remainingAmount: 1194900, status: 'unpaid' },
  { id: 'HD-IV-00075', code: 'HD-IV-00075', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P203', roomName: 'Phòng P203', tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', rentAmount: 2500000, oldElec: 682, newElec: 750, elecAmount: 238000, oldWater: 23, newWater: 27, waterAmount: 73000, serviceAmount: 130000, totalAmount: 2941000, paidAmount: 0, remainingAmount: 2941000, status: 'unpaid' },
  { id: 'HD-IV-00094', code: 'HD-IV-00094', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P203', roomName: 'Phòng P203', tenantName: 'Lý Văn Phong', tenantPhone: '0932325107', rentAmount: 2500000, oldElec: 750, newElec: 818, elecAmount: 238000, oldWater: 27, newWater: 31, waterAmount: 73000, serviceAmount: 130000, totalAmount: 2941000, paidAmount: 0, remainingAmount: 2941000, status: 'unpaid' },
  { id: 'HD-IV-00058', code: 'HD-IV-00058', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P301', roomName: 'Phòng P301', tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', rentAmount: 2200000, oldElec: 1310, newElec: 1396, elecAmount: 301000, oldWater: 41, newWater: 46, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2721000, paidAmount: 290500, remainingAmount: 2430500, status: 'unpaid' },
  { id: 'HD-IV-00076', code: 'HD-IV-00076', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P301', roomName: 'Phòng P301', tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', rentAmount: 2200000, oldElec: 1396, newElec: 1482, elecAmount: 301000, oldWater: 46, newWater: 51, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2721000, paidAmount: 0, remainingAmount: 2721000, status: 'unpaid' },
  { id: 'HD-IV-00095', code: 'HD-IV-00095', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P301', roomName: 'Phòng P301', tenantName: 'Trương Văn Quân', tenantPhone: '0911732568', rentAmount: 2200000, oldElec: 1482, newElec: 1568, elecAmount: 301000, oldWater: 51, newWater: 56, waterAmount: 90000, serviceAmount: 130000, totalAmount: 2721000, paidAmount: 0, remainingAmount: 2721000, status: 'unpaid' },
  { id: 'HD-IV-00059', code: 'HD-IV-00059', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P302', roomName: 'Phòng P302', tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', rentAmount: 2200000, oldElec: 540, newElec: 610, elecAmount: 245000, oldWater: 18, newWater: 22, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2647000, paidAmount: 1181600, remainingAmount: 1465400, status: 'unpaid' },
  { id: 'HD-IV-00077', code: 'HD-IV-00077', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P302', roomName: 'Phòng P302', tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', rentAmount: 2200000, oldElec: 610, newElec: 680, elecAmount: 245000, oldWater: 22, newWater: 26, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2647000, paidAmount: 0, remainingAmount: 2647000, status: 'unpaid' },
  { id: 'HD-IV-00096', code: 'HD-IV-00096', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P302', roomName: 'Phòng P302', tenantName: 'Đinh Văn Sơn', tenantPhone: '0979608804', rentAmount: 2200000, oldElec: 680, newElec: 750, elecAmount: 245000, oldWater: 26, newWater: 30, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2647000, paidAmount: 0, remainingAmount: 2647000, status: 'unpaid' },
  { id: 'HD-IV-00060', code: 'HD-IV-00060', period: '2026-09', periodLabel: 'Tháng 9/2026', roomId: 'P303', roomName: 'Phòng P303', tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', rentAmount: 2500000, oldElec: 820, newElec: 890, elecAmount: 245000, oldWater: 29, newWater: 33, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2947000, paidAmount: 2028500, remainingAmount: 918500, status: 'unpaid' },
  { id: 'HD-IV-00078', code: 'HD-IV-00078', period: '2026-10', periodLabel: 'Tháng 10/2026', roomId: 'P303', roomName: 'Phòng P303', tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', rentAmount: 2500000, oldElec: 890, newElec: 960, elecAmount: 245000, oldWater: 33, newWater: 37, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2947000, paidAmount: 0, remainingAmount: 2947000, status: 'unpaid' },
  { id: 'HD-IV-00097', code: 'HD-IV-00097', period: '2026-11', periodLabel: 'Tháng 11/2026', roomId: 'P303', roomName: 'Phòng P303', tenantName: 'Lương Văn Tùng', tenantPhone: '0916808935', rentAmount: 2500000, oldElec: 960, newElec: 1030, elecAmount: 245000, oldWater: 37, newWater: 41, waterAmount: 72000, serviceAmount: 130000, totalAmount: 2947000, paidAmount: 0, remainingAmount: 2947000, status: 'unpaid' },
];

const INITIAL_TENANTS: TenantItem[] = [
  { id: 'KH-00001', code: 'KH-00001', name: 'Trần Văn Nam', phone: '0971770075', cccd: '079201001001', roomId: 'P101', roomName: 'Phòng P101', role: 'representative', status: 'staying', totalPaid: 13265000, debt: 6961800 },
  { id: 'KH-00002', code: 'KH-00002', name: 'Lê Thị Hoa', phone: '0932751487', cccd: '079201001002', roomId: 'P101', roomName: 'Phòng P101', role: 'member', status: 'staying', totalPaid: 0, debt: 0 },
  { id: 'KH-00003', code: 'KH-00003', name: 'Phạm Văn Đức', phone: '0971317972', cccd: '079201001003', roomId: 'P102', roomName: 'Phòng P102', role: 'representative', status: 'staying', totalPaid: 10948700, debt: 7378400 },
  { id: 'KH-00004', code: 'KH-00004', name: 'Nguyễn Thị Mai', phone: '0989021863', cccd: '079201001004', roomId: 'P102', roomName: 'Phòng P102', role: 'member', status: 'staying', totalPaid: 0, debt: 0 },
  { id: 'KH-00005', code: 'KH-00005', name: 'Võ Văn Hải', phone: '0911191902', cccd: '079201001005', roomId: 'P103', roomName: 'Phòng P103', role: 'representative', status: 'staying', totalPaid: 11798300, debt: 8742900 },
  { id: 'KH-00008', code: 'KH-00008', name: 'Đặng Văn Khoa', phone: '0918445222', cccd: '079201001008', roomId: 'P104', roomName: 'Phòng P104', role: 'representative', status: 'staying', totalPaid: 13965200, debt: 6691100 },
  { id: 'KH-00011', code: 'KH-00011', name: 'Ngô Văn Minh', phone: '0987857729', cccd: '079201001011', roomId: 'P201', roomName: 'Phòng P201', role: 'representative', status: 'staying', totalPaid: 10961200, debt: 7327400 },
  { id: 'KH-00014', code: 'KH-00014', name: 'Lý Văn Phong', phone: '0932325107', cccd: '079201001014', roomId: 'P203', roomName: 'Phòng P203', role: 'representative', status: 'staying', totalPaid: 11240000, debt: 7076900 },
  { id: 'KH-00017', code: 'KH-00017', name: 'Trương Văn Quân', phone: '0911732568', cccd: '079201001017', roomId: 'P301', roomName: 'Phòng P301', role: 'representative', status: 'staying', totalPaid: 9850000, debt: 7872500 },
  { id: 'KH-00020', code: 'KH-00020', name: 'Đinh Văn Sơn', phone: '0979608804', cccd: '079201001020', roomId: 'P302', roomName: 'Phòng P302', role: 'representative', status: 'staying', totalPaid: 10120000, debt: 6759400 },
  { id: 'KH-00022', code: 'KH-00022', name: 'Lương Văn Tùng', phone: '0916808935', cccd: '079201001022', roomId: 'P303', roomName: 'Phòng P303', role: 'representative', status: 'staying', totalPaid: 11450000, debt: 6812500 },
  { id: 'KH-00025', code: 'KH-00025', name: 'Huỳnh Thị Hà', phone: '0936221034', cccd: '079201001025', role: 'former', status: 'moved_out', totalPaid: 8550000, debt: 0 },
];

const INITIAL_VEHICLES: VehicleItem[] = [
  { id: 'XE-01', roomId: 'P101', tenantName: 'Trần Văn Nam', type: 'Xe máy', licensePlate: '59X1-10000', note: 'Honda AirBlade đen' },
  { id: 'XE-02', roomId: 'P101', tenantName: 'Lê Thị Hoa', type: 'Xe máy', licensePlate: '59X1-12193', note: 'Honda Vision trắng' },
  { id: 'XE-03', roomId: 'P102', tenantName: 'Phạm Văn Đức', type: 'Xe máy', licensePlate: '59X1-14386', note: 'Yamaha Exciter xanh' },
  { id: 'XE-04', roomId: 'P102', tenantName: 'Nguyễn Thị Mai', type: 'Xe máy', licensePlate: '59X1-16579', note: 'Honda Lead bạc' },
  { id: 'XE-05', roomId: 'P201', tenantName: 'Ngô Văn Minh', type: 'Xe máy', licensePlate: '59X1-18772', note: 'Wave Alpha đỏ' },
  { id: 'XE-06', roomId: 'P203', tenantName: 'Lý Văn Phong', type: 'Xe máy', licensePlate: '59X1-20965', note: 'Honda Vario xám' },
  { id: 'XE-07', roomId: 'P301', tenantName: 'Trương Văn Quân', type: 'Xe máy', licensePlate: '59X1-23158', note: 'Yamaha Sirius đen' },
  { id: 'XE-08', roomId: 'P302', tenantName: 'Đinh Văn Sơn', type: 'Xe máy', licensePlate: '59X1-25351', note: 'Honda Future xanh' },
  { id: 'XE-09', roomId: 'P302', tenantName: 'Lâm Thị Bích', type: 'Xe máy', licensePlate: '59X1-27544', note: 'Yamaha Grande trắng' },
];

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  { id: 'TX-01', code: 'PT-00031', date: '16/10/2026', type: 'expense', title: 'Sửa chữa phòng — Phòng P204', roomName: 'P204', amount: 1050000, method: 'Tiền mặt' },
  { id: 'TX-02', code: 'PT-00030', date: '25/09/2026', type: 'income', title: 'Thu tiền HĐ HD-IV-00055 — Phòng P104', roomName: 'P104', amount: 3300000, method: 'Chuyển khoản' },
];

function formatVND(amount: number): string {
  return Math.round(amount).toLocaleString('vi-VN') + ' đ';
}

export default function App() {
  const [tab, setTab] = useState<MobileTab>('overview');
  const [rooms, setRooms] = useState<RoomItem[]>(INITIAL_ROOMS);
  const [invoices, setInvoices] = useState<InvoiceItem[]>(INITIAL_INVOICES);
  const [tenants, setTenants] = useState<TenantItem[]>(INITIAL_TENANTS);
  const [vehicles] = useState<VehicleItem[]>(INITIAL_VEHICLES);
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'2026-09' | '2026-10' | '2026-11'>('2026-11');
  const [tenantSubTab, setTenantSubTab] = useState<'tenants' | 'vehicles'>('tenants');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal Thu tiền FIFO
  const [fifoRoomId, setFifoRoomId] = useState<string | null>(null);
  const [fifoInputAmount, setFifoInputAmount] = useState<string>('');
  const [fifoMethod, setFifoMethod] = useState<'Chuyển khoản' | 'Tiền mặt'>('Chuyển khoản');

  // Modal Tạo hợp đồng mới (Pro-rata)
  const [contractModalRoom, setContractModalRoom] = useState<RoomItem | null>(null);
  const [newTenantName, setNewTenantName] = useState<string>('Nguyễn Văn An');
  const [newTenantPhone, setNewTenantPhone] = useState<string>('0909123456');
  const [startDateDay, setStartDateDay] = useState<string>('11');

  // Modal Điều chỉnh giá thuê phòng
  const [priceEditRoom, setPriceEditRoom] = useState<RoomItem | null>(null);
  const [priceEditValue, setPriceEditValue] = useState<string>('');
  const [priceEditDeposit, setPriceEditDeposit] = useState<string>('');

  // Thống kê tổng hợp
  const rentedRoomsCount = useMemo(() => rooms.filter((r) => r.status === 'rented').length, [rooms]);
  const occupancyRate = useMemo(() => Math.round((rentedRoomsCount / rooms.length) * 100), [rentedRoomsCount, rooms.length]);
  const unpaidInvoices = useMemo(() => invoices.filter((i) => i.status === 'unpaid'), [invoices]);
  const totalDebt = useMemo(
    () => unpaidInvoices.reduce((sum, i) => sum + i.remainingAmount, 0),
    [unpaidInvoices]
  );

  const todayIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'income' && t.date === '17/10/2026')
        .reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  );

  const monthProfit = useMemo(() => todayIncome - 1050000, [todayIncome]);

  // Tính phân bổ FIFO cho phòng đang chọn
  const fifoRoomInvoices = useMemo(() => {
    if (!fifoRoomId) return [];
    return invoices
      .filter((inv) => inv.roomId === fifoRoomId && inv.status === 'unpaid')
      .sort((a, b) => a.period.localeCompare(b.period));
  }, [fifoRoomId, invoices]);

  const fifoTotalRoomDebt = useMemo(
    () => fifoRoomInvoices.reduce((s, i) => s + i.remainingAmount, 0),
    [fifoRoomInvoices]
  );

  const fifoAllocation = useMemo(() => {
    let remainingToAllocate = Number(fifoInputAmount.replace(/\D/g, '')) || 0;
    return fifoRoomInvoices.map((inv) => {
      const allocated = Math.min(remainingToAllocate, inv.remainingAmount);
      remainingToAllocate = Math.max(0, remainingToAllocate - allocated);
      const afterDebt = inv.remainingAmount - allocated;
      return {
        invoice: inv,
        allocated,
        afterDebt,
        willBePaid: afterDebt === 0 && allocated > 0,
      };
    });
  }, [fifoRoomInvoices, fifoInputAmount]);

  const openFifoModal = (roomId: string) => {
    const roomInvs = invoices.filter((i) => i.roomId === roomId && i.status === 'unpaid');
    const debt = roomInvs.reduce((s, i) => s + i.remainingAmount, 0);
    setFifoRoomId(roomId);
    setFifoInputAmount(String(debt));
  };

  const confirmFifoPayment = () => {
    if (!fifoRoomId) return;
    const payAmount = Number(fifoInputAmount.replace(/\D/g, '')) || 0;
    if (payAmount <= 0) {
      Alert.alert('Thông báo', 'Vui lòng nhập số tiền cần thu lớn hơn 0.');
      return;
    }

    let left = payAmount;
    const updatedInvoices = invoices.map((inv) => {
      if (inv.roomId !== fifoRoomId || inv.status === 'paid' || left <= 0) return inv;
      const deduct = Math.min(left, inv.remainingAmount);
      left -= deduct;
      const newRemaining = inv.remainingAmount - deduct;
      return {
        ...inv,
        paidAmount: inv.paidAmount + deduct,
        remainingAmount: newRemaining,
        status: newRemaining === 0 ? ('paid' as const) : ('unpaid' as const),
      };
    });

    const newRoomDebt = updatedInvoices
      .filter((i) => i.roomId === fifoRoomId && i.status === 'unpaid')
      .reduce((s, i) => s + i.remainingAmount, 0);

    setInvoices(updatedInvoices);
    setRooms((prev) =>
      prev.map((r) => (r.id === fifoRoomId ? { ...r, debt: newRoomDebt } : r))
    );
    setTenants((prev) =>
      prev.map((t) =>
        t.roomId === fifoRoomId && t.role === 'representative'
          ? { ...t, totalPaid: t.totalPaid + payAmount, debt: newRoomDebt }
          : t
      )
    );

    const roomObj = rooms.find((r) => r.id === fifoRoomId);
    setTransactions((prev) => [
      {
        id: 'TX-' + Date.now(),
        code: 'PT-000' + (32 + prev.length),
        date: '17/10/2026',
        type: 'income',
        title: `Thu tiền theo phòng (FIFO) — ${roomObj?.name || fifoRoomId}`,
        roomName: fifoRoomId,
        amount: payAmount,
        method: fifoMethod,
      },
      ...prev,
    ]);

    if (Platform.OS !== 'web') {
      Vibration.vibrate(60);
    }
    setFifoRoomId(null);
    Alert.alert(
      '✅ Đã thu tiền thành công (FIFO)',
      `Đã thu ${formatVND(payAmount)} của phòng ${fifoRoomId} theo thứ tự hóa đơn cũ nhất trước!`
    );
  };

  // Đồng bộ Google Sheets đang tắt: dữ liệu demo của app này khác schema Web App (RoomItem.name,
  // status 'rented', ...) nên gửi syncState sẽ ghi đè dữ liệu thật của Web App bằng các dòng không tương thích.
  // Apps Script cũng từ chối gói dữ liệu không có SYNC_TOKEN và schema 'optirent-web-v1'.
  const handleSyncGoogleSheets = () => {
    Alert.alert(
      '☁️ Chưa hỗ trợ đồng bộ',
      'Bản di động đang dùng dữ liệu demo nên không đồng bộ lên Google Sheets. Hãy đồng bộ từ Web App (Cài đặt → Kết nối & Đồng bộ Google Sheets).'
    );
  };

  const handleCreateContract = () => {
    if (!contractModalRoom) return;
    const day = Math.max(1, Math.min(31, Number(startDateDay) || 11));
    const daysRemaining = 31 - day + 1;
    const prorataAmount = Math.round((contractModalRoom.price * daysRemaining) / 31);

    setRooms((prev) =>
      prev.map((r) =>
        r.id === contractModalRoom.id
          ? {
              ...r,
              status: 'rented',
              tenantName: newTenantName,
              tenantPhone: newTenantPhone,
              occupantsCount: 1,
              contractCode: 'HD-00011',
              contractEnd: '11/10/2027',
              note: `Kỳ đầu ${daysRemaining}/31 ngày: ${formatVND(prorataAmount)}`,
            }
          : r
      )
    );
    setContractModalRoom(null);
    Alert.alert(
      '🎉 Tạo hợp đồng thành công',
      `Đã ký hợp đồng phòng ${contractModalRoom.id} cho ${newTenantName}.\nTiền phòng kỳ đầu (${daysRemaining}/31 ngày): ${formatVND(prorataAmount)}`
    );
  };

  const openPriceEditModal = (room: RoomItem) => {
    setPriceEditRoom(room);
    setPriceEditValue(String(room.price));
    setPriceEditDeposit(String(room.deposit));
  };

  const confirmPriceEdit = () => {
    if (!priceEditRoom) return;
    const newPrice = Math.max(0, Number(priceEditValue.replace(/\D/g, '')) || priceEditRoom.price);
    const newDeposit = Math.max(
      0,
      Number(priceEditDeposit.replace(/\D/g, '')) || newPrice
    );

    setRooms((prev) =>
      prev.map((r) =>
        r.id === priceEditRoom.id
          ? { ...r, price: newPrice, deposit: newDeposit }
          : r
      )
    );

    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.roomId !== priceEditRoom.id || inv.status === 'paid') return inv;
        const diff = newPrice - inv.rentAmount;
        const newTotal = Math.max(0, inv.totalAmount + diff);
        const newRem = Math.max(0, newTotal - inv.paidAmount);
        return {
          ...inv,
          rentAmount: newPrice,
          totalAmount: newTotal,
          remainingAmount: newRem,
        };
      })
    );

    const code = priceEditRoom.id;
    setPriceEditRoom(null);
    Alert.alert(
      '🏷️ Đã cập nhật giá thuê phòng',
      `Phòng ${code} đã được điều chỉnh thành ${formatVND(newPrice)}/tháng (đã đồng bộ Hóa đơn chưa thu).`
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* Topbar Mobile */}
      <View style={styles.topbar}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>OR</Text>
          </View>
          <View>
            <Text style={styles.brandTitle}>OptiRent Mobile</Text>
            <Text style={styles.brandSub}>Nhà trọ Bình An · 12 phòng · 3 tầng</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.syncBtn}
          onPress={handleSyncGoogleSheets}
        >
          <Text style={styles.syncBtnText}>☁️ Sheets (tắt)</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
        {tab === 'overview' && (
          <View>
            {/* Hero Occupancy Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View>
                  <Text style={styles.heroLabel}>TỶ LỆ LẤP ĐẦY NHÀ TRỌ BÌNH AN</Text>
                  <Text style={styles.heroValue}>{occupancyRate}% ({rentedRoomsCount}/{rooms.length} phòng)</Text>
                </View>
                <View style={styles.heroPill}>
                  <Text style={styles.heroPillText}>2 trống · 1 bảo trì</Text>
                </View>
              </View>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${occupancyRate}%` }]} />
              </View>
              <Text style={styles.heroFooter}>
                Doanh thu hợp đồng: 22.500.000 đ/tháng · Thất thu phòng trống: 5.200.000 đ/tháng
              </Text>
            </View>

            {/* Quick Actions Bar (1-Tap Mobile Actions) */}
            <View style={styles.quickActionRow}>
              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => openPriceEditModal(rooms[0])}
              >
                <Text style={styles.quickActionIcon}>🏷️</Text>
                <Text style={styles.quickActionLabel}>Sửa giá phòng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => openFifoModal('P101')}
              >
                <Text style={styles.quickActionIcon}>💰</Text>
                <Text style={styles.quickActionLabel}>Thu nợ FIFO</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => {
                  const vacantRoom = rooms.find((r) => r.status === 'vacant') || rooms[5];
                  setContractModalRoom(vacantRoom);
                }}
              >
                <Text style={styles.quickActionIcon}>📝</Text>
                <Text style={styles.quickActionLabel}>Lập hợp đồng</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.quickActionBtn}
                onPress={() => setTab('invoices')}
              >
                <Text style={styles.quickActionIcon}>🧾</Text>
                <Text style={styles.quickActionLabel}>Gửi VietQR</Text>
              </TouchableOpacity>
            </View>

            {/* 4 KPI Cards */}
            <View style={styles.kpiGrid}>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>THU HÔM NAY</Text>
                <Text style={[styles.kpiValue, { color: '#059669' }]}>{formatVND(todayIncome)}</Text>
                <Text style={styles.kpiSub}>Tự động phân bổ FIFO</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>LỢI NHUẬN THÁNG</Text>
                <Text style={[styles.kpiValue, { color: monthProfit >= 0 ? '#0F172A' : '#E11D48' }]}>
                  {formatVND(monthProfit)}
                </Text>
                <Text style={styles.kpiSub}>Chi bảo trì P204: 1,05tr</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>CÔNG NỢ CẦN THU</Text>
                <Text style={[styles.kpiValue, { color: '#D97706' }]}>{formatVND(totalDebt)}</Text>
                <Text style={styles.kpiSub}>{unpaidInvoices.length} hóa đơn chưa thu</Text>
              </View>
              <View style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>CỌC PHẢI TRẢ</Text>
                <Text style={[styles.kpiValue, { color: '#E11D48' }]}>909.334 đ</Text>
                <Text style={styles.kpiSub}>P202 · Huỳnh Thị Hà</Text>
              </View>
            </View>

            {/* Việc cần làm hôm nay */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>📋 Việc cần làm hôm nay (7)</Text>
                <TouchableOpacity onPress={() => setTab('finance')}>
                  <Text style={styles.linkText}>Thu nợ ngay →</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.todoItem} onPress={() => openFifoModal('P101')}>
                <View style={[styles.todoDot, { backgroundColor: '#EF4444' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.todoTitle}>Thu công nợ Phòng P101 — Trần Văn Nam</Text>
                  <Text style={styles.todoSub}>3 kỳ hóa đơn (T9, T10, T11/2026) · Bấm để thu FIFO</Text>
                </View>
                <Text style={styles.todoAmount}>{formatVND(rooms[0].debt)}</Text>
              </TouchableOpacity>

              <View style={styles.todoItem}>
                <View style={[styles.todoDot, { backgroundColor: '#F59E0B' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.todoTitle}>Hoàn cọc Phòng P202 — Huỳnh Thị Hà</Text>
                  <Text style={styles.todoSub}>Cọc 2.500.000đ · Trừ nợ 1.590.666đ · Hạn 16/10/2026</Text>
                </View>
                <Text style={styles.todoAmount}>909.334 đ</Text>
              </View>

              <View style={styles.todoItem}>
                <View style={[styles.todoDot, { backgroundColor: '#2563EB' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.todoTitle}>Gia hạn hợp đồng P301 & P302</Text>
                  <Text style={styles.todoSub}>Trương Văn Quân & Đinh Văn Sơn · Hết hạn 21/10/2026</Text>
                </View>
                <Text style={[styles.todoAmount, { color: '#2563EB' }]}>Còn 4 ngày</Text>
              </View>
            </View>
          </View>
        )}

        {tab === 'rooms' && (
          <View>
            <View style={styles.filterRow}>
              {(['all', 1, 2, 3] as const).map((fl) => (
                <TouchableOpacity
                  key={String(fl)}
                  style={[styles.filterChip, selectedFloor === fl && styles.filterChipActive]}
                  onPress={() => setSelectedFloor(fl)}
                >
                  <Text style={[styles.filterChipText, selectedFloor === fl && styles.filterChipTextActive]}>
                    {fl === 'all' ? 'Tất cả (12)' : `Tầng ${fl}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {rooms
              .filter((r) => selectedFloor === 'all' || r.floor === selectedFloor)
              .map((room) => (
                <View key={room.id} style={styles.roomCard}>
                  <View style={styles.roomTop}>
                    <View>
                      <Text style={styles.roomName}>{room.name} · Tầng {room.floor}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <Text style={styles.roomPrice}>Giá thuê: {formatVND(room.price)}/tháng</Text>
                        <TouchableOpacity
                          style={styles.secondarySmallBtn}
                          onPress={() => openPriceEditModal(room)}
                        >
                          <Text style={styles.secondarySmallBtnText}>🏷️ Sửa giá</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        room.status === 'rented'
                          ? { backgroundColor: '#EFF6FF' }
                          : room.status === 'vacant'
                          ? { backgroundColor: '#ECFDF5' }
                          : { backgroundColor: '#FFF1F2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          room.status === 'rented'
                            ? { color: '#1D4ED8' }
                            : room.status === 'vacant'
                            ? { color: '#047857' }
                            : { color: '#BE123C' },
                        ]}
                      >
                        {room.status === 'rented'
                          ? 'Đang thuê'
                          : room.status === 'vacant'
                          ? 'Phòng trống'
                          : 'Đang bảo trì'}
                      </Text>
                    </View>
                  </View>

                  {room.status === 'rented' ? (
                    <View style={styles.roomBody}>
                      <Text style={styles.roomDetail}>
                        👤 Đại diện: <Text style={{ fontWeight: '700' }}>{room.tenantName}</Text> ({room.tenantPhone})
                      </Text>
                      <Text style={styles.roomDetail}>
                        👥 {room.occupantsCount}/{room.maxOccupants} người · 🛵 {room.vehiclesCount} xe · Cọc {formatVND(room.deposit)}
                      </Text>
                      <View style={styles.roomFooter}>
                        <Text style={styles.roomDebt}>
                          Nợ hiện tại: {formatVND(room.debt)}
                        </Text>
                        {room.debt > 0 && (
                          <TouchableOpacity
                            style={styles.primarySmallBtn}
                            onPress={() => openFifoModal(room.id)}
                          >
                            <Text style={styles.primarySmallBtnText}>💰 Thu tiền FIFO</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ) : (
                    <View style={styles.roomBody}>
                      <Text style={styles.roomDetail}>{room.note}</Text>
                      {room.status === 'vacant' && (
                        <TouchableOpacity
                          style={[styles.primarySmallBtn, { marginTop: 8, alignSelf: 'flex-start' }]}
                          onPress={() => setContractModalRoom(room)}
                        >
                          <Text style={styles.primarySmallBtnText}>+ Ký hợp đồng mới (Tính Pro-rata)</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>
              ))}
          </View>
        )}

        {tab === 'invoices' && (
          <View>
            <View style={styles.filterRow}>
              {(['2026-11', '2026-10', '2026-09'] as const).map((per) => (
                <TouchableOpacity
                  key={per}
                  style={[styles.filterChip, selectedPeriod === per && styles.filterChipActive]}
                  onPress={() => setSelectedPeriod(per)}
                >
                  <Text style={[styles.filterChipText, selectedPeriod === per && styles.filterChipTextActive]}>
                    Kỳ {per}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {invoices
              .filter((inv) => inv.period === selectedPeriod)
              .map((inv) => (
                <View key={inv.id} style={styles.roomCard}>
                  <View style={styles.roomTop}>
                    <View>
                      <Text style={styles.roomName}>{inv.roomName} · {inv.code}</Text>
                      <Text style={styles.roomPrice}>{inv.tenantName} · {inv.periodLabel}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        inv.status === 'paid' ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEF3C7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          inv.status === 'paid' ? { color: '#15803D' } : { color: '#B45309' },
                        ]}
                      >
                        {inv.status === 'paid' ? 'Đã thu đủ' : 'Chưa thu đủ'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.roomBody}>
                    <Text style={styles.roomDetail}>
                      🏠 Tiền phòng: {formatVND(inv.rentAmount)} · ⚡ Điện ({inv.newElec - inv.oldElec} kWh): {formatVND(inv.elecAmount)}
                    </Text>
                    <Text style={styles.roomDetail}>
                      💧 Nước ({inv.newWater - inv.oldWater} m³): {formatVND(inv.waterAmount)} · 🧹 Dịch vụ: {formatVND(inv.serviceAmount)}
                    </Text>
                    <View style={styles.roomFooter}>
                      <View>
                        <Text style={{ fontSize: 12, color: '#64748B', fontVariant: ['tabular-nums'] }}>
                          Tổng: {formatVND(inv.totalAmount)}
                        </Text>
                        <Text style={styles.roomDebt}>Còn nợ: {formatVND(inv.remainingAmount)}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          style={styles.secondarySmallBtn}
                          onPress={() =>
                            Alert.alert(
                              `📲 Thông báo Zalo & VietQR — ${inv.roomName}`,
                              `Kính gửi ${inv.tenantName} (${inv.roomName}),\nThông báo tiền phòng ${inv.periodLabel}:\n• Tiền phòng: ${formatVND(inv.rentAmount)}\n• Điện: ${formatVND(inv.elecAmount)}\n• Nước: ${formatVND(inv.waterAmount)}\n• Dịch vụ: ${formatVND(inv.serviceAmount)}\n👉 Cần thanh toán: ${formatVND(inv.remainingAmount)}\n🏦 VietQR: Vietcombank - 1029384756`
                            )
                          }
                        >
                          <Text style={styles.secondarySmallBtnText}>Gửi Zalo/QR</Text>
                        </TouchableOpacity>
                        {inv.remainingAmount > 0 && (
                          <TouchableOpacity
                            style={styles.primarySmallBtn}
                            onPress={() => openFifoModal(inv.roomId)}
                          >
                            <Text style={styles.primarySmallBtnText}>Thu tiền</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        )}

        {tab === 'finance' && (
          <View>
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>💰 Công nợ theo phòng — Tự động trừ FIFO</Text>
              <Text style={{ fontSize: 12, color: '#64748B', marginBottom: 10 }}>
                Khi thu tiền, hệ thống tự động trừ vào hóa đơn kỳ cũ nhất trước (Tháng 9 → Tháng 10 → Tháng 11).
              </Text>

              {rooms
                .filter((r) => r.status === 'rented')
                .map((room) => (
                  <View key={room.id} style={styles.todoItem}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.todoTitle}>{room.name} — {room.tenantName}</Text>
                      <Text style={styles.todoSub}>SĐT: {room.tenantPhone} · HĐ: {room.contractCode}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.todoAmount, { color: room.debt > 0 ? '#E11D48' : '#059669' }]}>
                        {room.debt > 0 ? formatVND(room.debt) : 'Hết nợ'}
                      </Text>
                      {room.debt > 0 && (
                        <TouchableOpacity
                          style={[styles.primarySmallBtn, { marginTop: 4 }]}
                          onPress={() => openFifoModal(room.id)}
                        >
                          <Text style={styles.primarySmallBtnText}>Thu FIFO</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))}
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>📒 Sổ thu chi gần đây</Text>
              {transactions.map((tx) => (
                <View key={tx.id} style={styles.todoItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.todoTitle}>{tx.title}</Text>
                    <Text style={styles.todoSub}>{tx.code} · {tx.date} · {tx.method}</Text>
                  </View>
                  <Text
                    style={[
                      styles.todoAmount,
                      { color: tx.type === 'income' ? '#059669' : '#E11D48' },
                    ]}
                  >
                    {tx.type === 'income' ? '+' : '-'}{formatVND(tx.amount)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tab === 'tenants' && (
          <View>
            <View style={styles.filterRow}>
              <TouchableOpacity
                style={[styles.filterChip, tenantSubTab === 'tenants' && styles.filterChipActive]}
                onPress={() => setTenantSubTab('tenants')}
              >
                <Text style={[styles.filterChipText, tenantSubTab === 'tenants' && styles.filterChipTextActive]}>
                  Khách thuê ({tenants.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, tenantSubTab === 'vehicles' && styles.filterChipActive]}
                onPress={() => setTenantSubTab('vehicles')}
              >
                <Text style={[styles.filterChipText, tenantSubTab === 'vehicles' && styles.filterChipTextActive]}>
                  Danh sách xe ({vehicles.length})
                </Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.searchInput}
              placeholder="Tìm tên khách, số điện thoại, phòng, biển số xe..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />

            {tenantSubTab === 'tenants'
              ? tenants
                  .filter(
                    (t) =>
                      !searchQuery ||
                      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.phone.includes(searchQuery) ||
                      (t.roomId || '').toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((t) => (
                    <View key={t.id} style={styles.roomCard}>
                      <View style={styles.roomTop}>
                        <View>
                          <Text style={styles.roomName}>{t.name} ({t.code})</Text>
                          <Text style={styles.roomPrice}>
                            {t.roomName || 'Đã trả phòng'} · CCCD: {t.cccd}
                          </Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            t.status === 'staying'
                              ? { backgroundColor: '#EFF6FF' }
                              : { backgroundColor: '#F1F5F9' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              t.status === 'staying' ? { color: '#1D4ED8' } : { color: '#475569' },
                            ]}
                          >
                            {t.role === 'representative'
                              ? 'Đại diện'
                              : t.role === 'member'
                              ? 'Ở cùng'
                              : 'Đã trả phòng'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.roomFooter}>
                        <Text style={{ fontSize: 12, color: '#475569', fontVariant: ['tabular-nums'] }}>
                          📞 {t.phone}
                        </Text>
                        <TouchableOpacity
                          style={styles.secondarySmallBtn}
                          onPress={() =>
                            Alert.alert(
                              '📄 Tờ khai tạm trú CT01',
                              `Họ tên: ${t.name}\nSố ĐDCN/CCCD: ${t.cccd}\nSĐT: ${t.phone}\nNơi tạm trú: ${t.roomName || 'P202'} - Nhà trọ Bình An, 128 Nguyễn Văn Thương, Bình Thạnh, TP.HCM.`
                            )
                          }
                        >
                          <Text style={styles.secondarySmallBtnText}>Mẫu CT01</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
              : vehicles.map((v) => (
                  <View key={v.id} style={styles.roomCard}>
                    <View style={styles.roomTop}>
                      <View>
                        <Text style={styles.roomName}>🛵 {v.licensePlate}</Text>
                        <Text style={styles.roomPrice}>
                          Phòng {v.roomId} · Chủ xe: {v.tenantName}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: '#EFF6FF' }]}>
                        <Text style={[styles.statusBadgeText, { color: '#1D4ED8' }]}>{v.type}</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>{v.note}</Text>
                  </View>
                ))}
          </View>
        )}
      </ScrollView>

      {/* Modal Thu tiền theo phòng (FIFO) */}
      <Modal visible={Boolean(fifoRoomId)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>💰 Thu tiền theo phòng — {fifoRoomId}</Text>
            <Text style={styles.modalSubtitle}>
              Tổng nợ: {formatVND(fifoTotalRoomDebt)} ({fifoRoomInvoices.length} hóa đơn) · Tự động trừ hóa đơn cũ nhất trước (FIFO)
            </Text>

            <Text style={styles.inputLabel}>Số tiền khách thanh toán (VNĐ)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={fifoInputAmount}
              onChangeText={setFifoInputAmount}
            />

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.secondarySmallBtn, { flex: 1, alignItems: 'center' }]}
                onPress={() => setFifoInputAmount(String(fifoTotalRoomDebt))}
              >
                <Text style={styles.secondarySmallBtnText}>Trả hết ({formatVND(fifoTotalRoomDebt)})</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondarySmallBtn, { flex: 1, alignItems: 'center' }]}
                onPress={() =>
                  setFifoMethod((m) => (m === 'Chuyển khoản' ? 'Tiền mặt' : 'Chuyển khoản'))
                }
              >
                <Text style={styles.secondarySmallBtnText}>PTTT: {fifoMethod}</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Phân bổ tự động (FIFO):</Text>
            {fifoAllocation.map((item) => (
              <View key={item.invoice.id} style={styles.fifoRow}>
                <View>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#0F172A' }}>
                    {item.invoice.period} ({item.invoice.code})
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748B', fontVariant: ['tabular-nums'] }}>
                    Nợ gốc: {formatVND(item.invoice.remainingAmount)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontWeight: '700', fontSize: 13, color: '#2563EB', fontVariant: ['tabular-nums'] }}>
                    Trừ: {formatVND(item.allocated)}
                  </Text>
                  <Text style={{ fontSize: 11, color: item.willBePaid ? '#059669' : '#D97706', fontVariant: ['tabular-nums'] }}>
                    {item.willBePaid ? '✓ Sẽ thu đủ' : `Còn: ${formatVND(item.afterDebt)}`}
                  </Text>
                </View>
              </View>
            ))}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFifoRoomId(null)}>
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmFifoPayment}>
                <Text style={styles.confirmBtnText}>Xác nhận thu FIFO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Tạo hợp đồng mới tính Pro-rata */}
      <Modal visible={Boolean(contractModalRoom)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              📄 Tạo hợp đồng mới — {contractModalRoom?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Giá thuê: {formatVND(contractModalRoom?.price || 2500000)}/tháng · Tự động tính tiền kỳ đầu theo ngày (Pro-rata)
            </Text>

            <Text style={styles.inputLabel}>Họ tên khách đại diện</Text>
            <TextInput
              style={styles.textInput}
              value={newTenantName}
              onChangeText={setNewTenantName}
            />

            <Text style={styles.inputLabel}>Số điện thoại</Text>
            <TextInput
              style={styles.textInput}
              value={newTenantPhone}
              onChangeText={setNewTenantPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Ngày vào ở trong tháng 10/2026 (1 - 31)</Text>
            <TextInput
              style={styles.textInput}
              value={startDateDay}
              onChangeText={setStartDateDay}
              keyboardType="numeric"
            />

            <View style={styles.prorataBox}>
              <Text style={{ fontWeight: '700', color: '#1E40AF', fontSize: 13 }}>
                ⚡ Tính tiền kỳ đầu (Pro-rata): {startDateDay}/10 → 31/10 ({31 - (Number(startDateDay) || 11) + 1}/31 ngày)
              </Text>
              <Text style={{ fontWeight: '800', color: '#2563EB', fontSize: 16, marginTop: 4, fontVariant: ['tabular-nums'] }}>
                {formatVND(
                  Math.round(
                    ((contractModalRoom?.price || 2500000) *
                      Math.max(1, 31 - (Number(startDateDay) || 11) + 1)) /
                      31
                  )
                )}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setContractModalRoom(null)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleCreateContract}>
                <Text style={styles.confirmBtnText}>Ký hợp đồng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Điều chỉnh giá thuê phòng */}
      <Modal visible={Boolean(priceEditRoom)} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>
              🏷️ Điều chỉnh giá thuê — {priceEditRoom?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Giá hiện tại: {formatVND(priceEditRoom?.price || 0)}/tháng · Tự động đồng bộ Hóa đơn chưa thu
            </Text>

            <Text style={styles.inputLabel}>Giá thuê phòng mới (VNĐ/tháng)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={priceEditValue}
              onChangeText={setPriceEditValue}
            />

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {[-100000, -50000, 50000, 100000, 200000].map((delta) => (
                <TouchableOpacity
                  key={delta}
                  style={styles.secondarySmallBtn}
                  onPress={() => {
                    const curr = Number(priceEditValue.replace(/\D/g, '')) || 0;
                    const next = Math.max(0, curr + delta);
                    setPriceEditValue(String(next));
                    setPriceEditDeposit(String(next));
                  }}
                >
                  <Text style={styles.secondarySmallBtnText}>
                    {delta > 0 ? `+${delta / 1000}k` : `${delta / 1000}k`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Tiền đặt cọc chuẩn (VNĐ)</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={priceEditDeposit}
              onChangeText={setPriceEditDeposit}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setPriceEditRoom(null)}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmPriceEdit}>
                <Text style={styles.confirmBtnText}>Lưu giá thuê mới</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Bottom Tab Navigation (5 Tabs) */}
      <View style={styles.bottomNav}>
        {(
          [
            { key: 'overview', icon: '📊', label: 'Tổng quan' },
            { key: 'rooms', icon: '🚪', label: 'Phòng (12)' },
            { key: 'invoices', icon: '🧾', label: 'Hóa đơn' },
            { key: 'finance', icon: '💰', label: 'Thu FIFO' },
            { key: 'tenants', icon: '👥', label: 'Khách & Xe' },
          ] as const
        ).map((item) => {
          const active = tab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => setTab(item.key)}
            >
              <Text style={{ fontSize: 17 }}>{item.icon}</Text>
              <Text style={[styles.navLabel, active && styles.navLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topbar: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  brandSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  syncBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  syncBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 32,
  },
  heroCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  heroLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  heroValue: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  heroPill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  heroPillText: {
    color: '#93C5FD',
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563EB',
  },
  heroFooter: {
    color: '#CBD5E1',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  quickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  quickActionBtn: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickActionIcon: {
    fontSize: 16,
    marginBottom: 3,
  },
  quickActionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F172A',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiCard: {
    width: '48.5%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 13,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  kpiLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  kpiSub: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  linkText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 10,
  },
  todoDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  todoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  todoSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  todoAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
    fontVariant: ['tabular-nums'],
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  roomCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roomTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  roomName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  roomPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roomBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  roomDetail: {
    fontSize: 12,
    color: '#334155',
    marginBottom: 4,
    fontVariant: ['tabular-nums'],
  },
  roomFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  roomDebt: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
    fontVariant: ['tabular-nums'],
  },
  primarySmallBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  primarySmallBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  secondarySmallBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  secondarySmallBtnText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    marginBottom: 12,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 6,
    gap: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: '#EFF6FF',
  },
  navLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#2563EB',
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10,
    fontVariant: ['tabular-nums'],
  },
  fifoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  prorataBox: {
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginVertical: 8,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontWeight: '700',
    color: '#475569',
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  confirmBtnText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
