import React, { useEffect, useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Property, Room } from '../types';
import { buildRoom, suggestNextRoomCode, type NewRoomInput } from '../utils/rooms';

const FIELDS: { key: Exclude<keyof NewRoomInput, 'code'>; label: string }[] = [
  { key: 'floor', label: 'Tầng' },
  { key: 'price', label: 'Giá thuê (đ/tháng)' },
  { key: 'deposit', label: 'Tiền cọc (đ)' },
  { key: 'elecIndex', label: 'Số điện hiện tại (kWh)' },
  { key: 'waterIndex', label: 'Số nước hiện tại (m3)' },
];

/** Thêm phòng cho khu đang chọn; lưu xong giữ hộp thoại mở để nhập tiếp phòng sau. */
export const RoomAddModal: React.FC<{
  isOpen: boolean;
  property: Property;
  rooms: Room[];
  onClose: () => void;
  onAdd: (room: Room) => void;
}> = ({ isOpen, property, rooms, onClose, onAdd }) => {
  const propertyRooms = rooms.filter((r) => r.propertyId === property.id);
  const blank = (): NewRoomInput => {
    const last = propertyRooms[propertyRooms.length - 1];
    return {
      code: suggestNextRoomCode(propertyRooms),
      floor: last?.floor ?? 1,
      price: last?.price ?? 0,
      deposit: last?.deposit ?? 0,
      elecIndex: 0,
      waterIndex: 0,
    };
  };
  const [form, setForm] = useState<NewRoomInput>(blank);
  const [error, setError] = useState('');
  useEffect(() => {
    if (isOpen) {
      setForm(blank());
      setError('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, property.id]);
  if (!isOpen) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = buildRoom(form, property, rooms);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    onAdd(res.room);
    const next = [...propertyRooms, res.room];
    setForm({ ...form, code: suggestNextRoomCode(next), elecIndex: 0, waterIndex: 0 });
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto">
      <form
        role="dialog"
        aria-label="Thêm phòng"
        onSubmit={submit}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-slate-900">Thêm phòng · {property.name}</h3>
          <button type="button" onClick={onClose} aria-label="Đóng" className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-3 text-xs">
          <label className="space-y-1 col-span-2">
            <span className="font-semibold text-slate-600">Mã phòng</span>
            <input
              autoFocus
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </label>
          {FIELDS.map((f) => (
            <label key={f.key} className="space-y-1">
              <span className="font-semibold text-slate-600">{f.label}</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={form[f.key]}
                onChange={(e) => setForm({ ...form, [f.key]: Number(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl border border-slate-200 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>
          ))}
          {error && <p className="col-span-2 text-rose-600 font-semibold">{error}</p>}
          <p className="col-span-2 text-slate-500">
            Đã có {propertyRooms.length} phòng. Lưu xong có thể nhập tiếp phòng sau.
          </p>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
          <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-xs">
            Xong
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Lưu phòng
          </button>
        </div>
      </form>
    </div>
  );
};
