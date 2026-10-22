import type { Property, Room } from '../types';

export interface NewRoomInput {
  code: string;
  floor: number;
  price: number;
  deposit: number;
  elecIndex: number;
  waterIndex: number;
}

/** Tạo phòng mới cho một khu; trả lỗi nếu mã trống, trùng trong khu, hoặc số âm. */
export function buildRoom(
  input: NewRoomInput,
  property: Property,
  existing: Room[]
): { room: Room } | { error: string } {
  const code = input.code.trim().toUpperCase();
  if (!code) return { error: 'Nhập mã phòng, ví dụ P101.' };
  if (existing.some((r) => r.propertyId === property.id && r.code.toUpperCase() === code)) {
    return { error: `Phòng ${code} đã có trong ${property.name}.` };
  }
  const nums = [input.floor, input.price, input.deposit, input.elecIndex, input.waterIndex];
  if (nums.some((n) => !Number.isFinite(n) || n < 0)) return { error: 'Các số không được âm.' };
  return {
    room: {
      id: `room-${property.id}-${code}-${Date.now().toString(36)}`,
      propertyId: property.id,
      code,
      floor: Math.round(input.floor),
      price: input.price,
      deposit: input.deposit,
      status: 'vacant',
      elecIndex: input.elecIndex,
      waterIndex: input.waterIndex,
      trashFee: property.trashFee,
      internetFee: property.internetFee,
      vehicleCount: 0,
    },
  };
}

/** Gợi ý mã phòng tiếp theo: P101 -> P102, rỗng -> P101. */
export function suggestNextRoomCode(rooms: Room[]): string {
  const nums = rooms.map((r) => /^P(\d+)$/i.exec(r.code)).filter(Boolean).map((m) => Number(m![1]));
  return nums.length ? `P${Math.max(...nums) + 1}` : 'P101';
}

/** Mã BIN VietQR của các ngân hàng phổ biến (mã QR cần BIN, không phải tên). */
export const VIETQR_BANKS: { bin: string; name: string }[] = [
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970448', name: 'OCB' },
  { bin: '970426', name: 'MSB' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970449', name: 'LPBank' },
];
