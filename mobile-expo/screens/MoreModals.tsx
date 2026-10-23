import React, { useState } from 'react';
import { Alert, Share, Text, View } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { useStore } from '../lib/store';
import {
  applyInvoiceEdit,
  buildRoom,
  formatVND,
  nextCode,
  parseDateVN,
  planMoveOut,
  suggestFinalRent,
  suggestNextRoomCode,
  vnToIsoDate,
  type CashTransaction,
  type Contract,
  type Invoice,
  type InvoiceEdit,
  type MoveOutInput,
  type NewRoomInput,
} from '../lib/shared';
import { C } from '../lib/theme';
import { Between, Btn, Field, MoneyField, Row, Select, Sheet, T } from '../lib/ui';

const num = (v: string) => Number(v.replace(/[^\d]/g, '')) || 0;

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  return <Field style={{ flex: 1 }} label={label} keyboardType="number-pad" value={String(value)} onChangeText={(t) => onChange(num(t))} inputStyle={T.num} />;
}

function Summary({ rows }: { rows: [string, string, string?][] }) {
  return (
    <View style={{ padding: 12, borderRadius: 12, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, gap: 4 }}>
      {rows.map(([k, v, color]) => (
        <Between key={k}>
          <Text style={{ fontSize: 12, color: color ?? C.slate700, flex: 1 }}>{k}</Text>
          <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: color ?? C.slate900 }]}>{v}</Text>
        </Between>
      ))}
    </View>
  );
}

// ============================================================================
// THÊM PHÒNG (lưu xong giữ hộp thoại mở để nhập tiếp phòng sau)
// ============================================================================
export function AddRoomModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const property = s.currentProperty;
  const blank = (): NewRoomInput => {
    const last = s.propertyRooms[s.propertyRooms.length - 1];
    return { code: suggestNextRoomCode(s.propertyRooms), floor: last?.floor ?? 1, price: last?.price ?? 0, deposit: last?.deposit ?? 0, elecIndex: 0, waterIndex: 0 };
  };
  const [form, setForm] = useState<NewRoomInput>(blank);
  const [error, setError] = useState('');
  const set = (k: keyof NewRoomInput) => (n: number) => setForm({ ...form, [k]: n });

  const save = () => {
    const res = buildRoom(form, property, s.rooms);
    if ('error' in res) return setError(res.error);
    s.addRoom(res.room);
    setForm({ ...form, code: suggestNextRoomCode([...s.propertyRooms, res.room]), elecIndex: 0, waterIndex: 0 });
    setError('');
  };

  return (
    <Sheet
      visible
      title={`Thêm phòng · ${property.name}`}
      onClose={onClose}
      footer={
        <>
          <Btn tone="ghost" label="Xong" onPress={onClose} />
          <Btn icon={Plus} label="Lưu phòng" onPress={save} />
        </>
      }
    >
      <Field label="Mã phòng" value={form.code} onChangeText={(code) => setForm({ ...form, code })} autoCapitalize="characters" />
      <Row style={{ gap: 12 }}>
        <NumField label="Tầng" value={form.floor} onChange={set('floor')} />
        <View style={{ flex: 1 }} />
      </Row>
      <MoneyField label="Giá thuê (đ/tháng)" value={form.price} onChange={set('price')} />
      <MoneyField label="Tiền cọc (đ)" value={form.deposit} onChange={set('deposit')} />
      <Row style={{ gap: 12 }}>
        <NumField label="Số điện hiện tại (kWh)" value={form.elecIndex} onChange={set('elecIndex')} />
        <NumField label="Số nước hiện tại (m3)" value={form.waterIndex} onChange={set('waterIndex')} />
      </Row>
      {error ? <Text style={{ fontSize: 12, fontWeight: '600', color: C.rose600 }}>{error}</Text> : null}
      <Text style={T.xs}>Đã có {s.propertyRooms.length} phòng. Lưu xong có thể nhập tiếp phòng sau.</Text>
    </Sheet>
  );
}

// ============================================================================
// SỬA / HUỶ HÓA ĐƠN
// ============================================================================
const EDIT_FIELDS: { key: keyof InvoiceEdit; label: string }[] = [
  { key: 'rentAmount', label: 'Tiền phòng (đ)' },
  { key: 'trashAmount', label: 'Phí rác (đ)' },
  { key: 'elecOld', label: 'Điện cũ (kWh)' },
  { key: 'elecNew', label: 'Điện mới (kWh)' },
  { key: 'waterOld', label: 'Nước cũ (m3)' },
  { key: 'waterNew', label: 'Nước mới (m3)' },
  { key: 'internetAmount', label: 'Wifi (đ)' },
  { key: 'vehicleAmount', label: 'Gửi xe (đ)' },
];

export function EditInvoiceModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const s = useStore();
  const [form, setForm] = useState<InvoiceEdit>({
    rentAmount: invoice.rentAmount,
    elecOld: invoice.elecOld,
    elecNew: invoice.elecNew,
    waterOld: invoice.waterOld,
    waterNew: invoice.waterNew,
    trashAmount: invoice.trashAmount,
    internetAmount: invoice.internetAmount,
    vehicleAmount: invoice.vehicleAmount,
  });
  const result = applyInvoiceEdit(invoice, form);
  const error = 'error' in result ? result.error : '';
  const preview = 'invoice' in result ? result.invoice : null;

  return (
    <Sheet
      visible
      title={`Sửa hóa đơn ${invoice.code}`}
      subtitle={`Phòng ${invoice.roomCode}`}
      onClose={onClose}
      footer={
        <>
          <Btn
            tone="danger"
            icon={Trash2}
            label="Huỷ hóa đơn"
            disabled={invoice.paidAmount > 0}
            onPress={() =>
              Alert.alert('Huỷ hóa đơn?', `Huỷ hóa đơn ${invoice.code}? Chỉ số đồng hồ của phòng sẽ quay về số cũ.`, [
                { text: 'Không', style: 'cancel' },
                {
                  text: 'Huỷ hóa đơn',
                  style: 'destructive',
                  onPress: () => {
                    s.cancelInvoice(invoice);
                    onClose();
                  },
                },
              ])
            }
          />
          <Btn
            label="Lưu thay đổi"
            disabled={!preview}
            onPress={() => {
              if (!preview) return;
              s.saveInvoiceEdit(preview);
              onClose();
            }}
          />
        </>
      }
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {EDIT_FIELDS.map((f) => (
          <View key={f.key} style={{ width: '47%' }}>
            <NumField label={f.label} value={form[f.key]} onChange={(n) => setForm({ ...form, [f.key]: n })} />
          </View>
        ))}
      </View>
      <Summary
        rows={[
          ['Tổng cũ', formatVND(invoice.totalAmount)],
          ['Tổng mới', preview ? formatVND(preview.totalAmount) : '—'],
          ['Khách đã trả', formatVND(invoice.paidAmount), C.emerald700],
        ]}
      />
      {error ? <Text style={{ fontSize: 12, fontWeight: '600', color: C.rose600 }}>{error}</Text> : null}
      {preview && preview.totalAmount !== invoice.totalAmount && invoice.sentZalo ? (
        <Text style={{ fontSize: 12, color: C.amber700 }}>Phiếu đã gửi khách sẽ được đánh dấu "chưa gửi" để bạn gửi lại phiếu mới.</Text>
      ) : null}
      {invoice.paidAmount > 0 ? <Text style={T.xxs}>Hóa đơn đã thu tiền nên không huỷ được.</Text> : null}
    </Sheet>
  );
}

// ============================================================================
// GHI KHOẢN CHI
// ============================================================================
const CATEGORIES: CashTransaction['category'][] = ['Bảo trì/Sửa chữa', 'Vệ sinh', 'Chi phí khác'];

export function ExpenseModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [date, setDate] = useState(s.today);
  const [category, setCategory] = useState<CashTransaction['category']>(CATEGORIES[0]);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<CashTransaction['method']>('Tiền mặt');
  const [roomCode, setRoomCode] = useState('');
  const error = !description.trim() ? 'Nhập nội dung khoản chi.' : amount <= 0 ? 'Nhập số tiền lớn hơn 0.' : !parseDateVN(date) ? 'Ngày dạng DD/MM/YYYY' : '';

  return (
    <Sheet
      visible
      title="Ghi khoản chi"
      onClose={onClose}
      footer={
        <>
          <Btn tone="ghost" label="Huỷ" onPress={onClose} />
          <Btn
            label="Ghi khoản chi"
            disabled={!!error}
            onPress={() => {
              s.addExpense({
                id: `tx-manual-${Date.now()}`,
                propertyId: s.currentProperty.id,
                date,
                isoDate: vnToIsoDate(date),
                type: 'expense',
                category,
                roomCode: roomCode || undefined,
                description: description.trim(),
                amount,
                method,
              });
              onClose();
            }}
          />
        </>
      }
    >
      <Field label="Nội dung" value={description} onChangeText={setDescription} placeholder="Thay bóng đèn hành lang" />
      <MoneyField label="Số tiền (đ)" value={amount} onChange={setAmount} />
      <Field label="Ngày chi" value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" />
      <Select label="Hạng mục" value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} />
      <Select
        label="Trả bằng"
        value={method}
        onChange={setMethod}
        options={[
          { value: 'Tiền mặt', label: 'Tiền mặt' },
          { value: 'Chuyển khoản', label: 'Chuyển khoản' },
        ]}
      />
      <Select
        label="Phòng (nếu chi cho 1 phòng)"
        value={roomCode}
        onChange={setRoomCode}
        options={[{ value: '', label: 'Chi chung, không riêng phòng nào' }, ...s.propertyRooms.map((r) => ({ value: r.code, label: r.code }))]}
      />
      {error && description ? <Text style={{ fontSize: 12, fontWeight: '600', color: C.rose600 }}>{error}</Text> : null}
    </Sheet>
  );
}

// ============================================================================
// TRẢ PHÒNG / THANH LÝ HỢP ĐỒNG
// ============================================================================
export function MoveOutModal({ contract, onClose }: { contract: Contract; onClose: () => void }) {
  const s = useStore();
  const property = s.currentProperty;
  const roomInvoices = s.allInvoices.filter((i) => i.propertyId === contract.propertyId && i.roomCode === contract.roomCode);
  // Hợp đồng trỏ tới phòng đã không còn (dữ liệu lỗi cũ): vẫn cho thanh lý
  const room =
    s.rooms.find((r) => r.propertyId === contract.propertyId && r.code === contract.roomCode) ?? {
      id: '',
      propertyId: contract.propertyId,
      code: contract.roomCode,
      floor: 1,
      price: 0,
      deposit: 0,
      status: 'occupied' as const,
      elecIndex: 0,
      waterIndex: 0,
      trashFee: 0,
      internetFee: 0,
      vehicleCount: 0,
    };
  const [form, setForm] = useState<MoveOutInput>(() => {
    const date = s.today;
    const ym = `${date.slice(6)}-${date.slice(3, 5)}`;
    const billed = roomInvoices.filter((i) => i.status !== 'draft' && i.billingMonth <= ym);
    return {
      moveOutDate: date,
      elecNew: Math.max(room.elecIndex, ...billed.map((i) => i.elecNew)),
      waterNew: Math.max(room.waterIndex, ...billed.map((i) => i.waterNew)),
      finalRent: suggestFinalRent({
        rentAmount: contract.rentAmount,
        moveOutDate: date,
        startDate: contract.startDate,
        monthAlreadyBilled: billed.some((i) => i.billingMonth === ym),
      }),
      otherCharges: 0,
      refundBankAccount: contract.refundBankAccount || '',
      refundBankName: contract.refundBankName || '',
    };
  });
  const plan = planMoveOut({
    contract,
    room,
    roomInvoices,
    elecRate: property.electricityRate,
    waterRate: property.waterRate,
    finalInvoiceCode: nextCode('HD-IV-', s.allInvoices.map((i) => i.code), 100),
    input: form,
  });

  return (
    <Sheet
      visible
      title={`Trả phòng ${contract.roomCode}`}
      subtitle={`${contract.tenantName} · ${contract.code}`}
      onClose={onClose}
      footer={
        <>
          <Btn tone="ghost" label="Huỷ" onPress={onClose} />
          <Btn
            label="Xác nhận trả phòng"
            disabled={'error' in plan}
            style={{ backgroundColor: C.rose600, borderColor: C.rose600 }}
            onPress={() => {
              if ('error' in plan) return;
              s.confirmMoveOut(plan);
              onClose();
            }}
          />
        </>
      }
    >
      <Field label="Ngày trả phòng" value={form.moveOutDate} onChangeText={(moveOutDate) => setForm({ ...form, moveOutDate })} placeholder="DD/MM/YYYY" />
      <MoneyField label="Tiền phòng những ngày cuối (đ)" value={form.finalRent} onChange={(finalRent) => setForm({ ...form, finalRent })} />
      <Row style={{ gap: 12 }}>
        <NumField label="Số điện chốt (kWh)" value={form.elecNew} onChange={(elecNew) => setForm({ ...form, elecNew })} />
        <NumField label="Số nước chốt (m3)" value={form.waterNew} onChange={(waterNew) => setForm({ ...form, waterNew })} />
      </Row>
      <MoneyField label="Trừ thêm: hư hỏng, dọn dẹp (đ)" value={form.otherCharges} onChange={(otherCharges) => setForm({ ...form, otherCharges })} />
      <Field label="Số tài khoản nhận lại cọc" value={form.refundBankAccount} keyboardType="number-pad" onChangeText={(refundBankAccount) => setForm({ ...form, refundBankAccount })} />
      <Field label="Ngân hàng" value={form.refundBankName} onChangeText={(refundBankName) => setForm({ ...form, refundBankName })} />
      {'error' in plan ? (
        <Text style={{ fontSize: 12, fontWeight: '600', color: C.rose600 }}>{plan.error}</Text>
      ) : (
        <Summary
          rows={[
            ['Tiền cọc', formatVND(contract.depositMode === 'pending' ? 0 : contract.depositAmount)],
            ...(plan.finalInvoice ? [[`Hóa đơn quyết toán ${plan.finalInvoice.code}`, formatVND(plan.finalInvoice.totalAmount)] as [string, string]] : []),
            ['Trừ vào cọc (nợ cũ + quyết toán + khoản khác)', `– ${formatVND(plan.deducted)}`, C.rose600],
            ['Hoàn lại cho khách', formatVND(plan.refund)],
            ...(plan.extraDue > 0 ? [['Khách còn phải trả thêm', formatVND(plan.extraDue), C.rose600] as [string, string, string]] : []),
          ]}
        />
      )}
      <Text style={T.xs}>
        Phòng chuyển về Trống, khách chuyển sang Đã dọn đi. Tiền hoàn hiện ở Tài chính → Cọc phải trả, bấm "Đã chuyển trả" khi chuyển xong.
      </Text>
    </Sheet>
  );
}

// ============================================================================
// KHAI BÁO TẠM TRÚ (CT01)
// ============================================================================
export function TempResidenceModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const p = s.currentProperty;
  const list = s.tenants
    .map((t, i) => `${i + 1}. ${t.name} | Phòng ${t.roomCode} | CCCD: ${t.cccd} | SĐT: ${t.phone} | HĐ: ${t.contractCode} (đến ${t.contractEndDate})`)
    .join('\n');
  return (
    <Sheet
      visible
      title="Danh sách khai báo tạm trú (Mẫu CT01)"
      subtitle={`${p.name}${p.address ? ` · ${p.address}` : ''} · Đã gom sẵn ${s.tenants.length} nhân khẩu`}
      onClose={onClose}
      footer={<Btn label="Chia sẻ / sao chép danh sách" onPress={() => Share.share({ message: list }).catch(() => {})} />}
    >
      <Text style={T.xs}>Dữ liệu CCCD, SĐT, Phòng và Thời hạn hợp đồng đã gom sẵn để nộp trực tuyến hoặc in cho Công an Phường.</Text>
      <View style={{ borderWidth: 1, borderColor: C.slate200, borderRadius: 12 }}>
        {s.tenants.map((t, i) => (
          <View key={t.id} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderTopColor: C.slate100, gap: 2 }}>
            <Between>
              <Text style={{ fontSize: 12, fontWeight: '600', color: C.slate900, flex: 1 }}>
                {i + 1}. {t.name}
              </Text>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.blue600 }}>{t.roomCode}</Text>
            </Between>
            <Text style={T.xxs}>
              CCCD {t.cccd || '—'} · {t.phone} · {t.hometown || 'TP.HCM'} · hạn {t.contractEndDate}
            </Text>
          </View>
        ))}
      </View>
    </Sheet>
  );
}
