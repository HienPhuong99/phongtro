import React, { useEffect, useMemo, useState } from 'react';
import { Image, Linking, Pressable, Share, Switch, Text, TextInput, View } from 'react-native';
import { ArrowLeft, ArrowRight, CheckCircle2, Droplets, MessageCircle, Share2, Zap } from 'lucide-react-native';
import { PUBLIC_WEB_URL, useStore } from '../lib/store';
import { AuthModal } from './Auth';
import { AddRoomModal, EditInvoiceModal, ExpenseModal, MoveOutModal, TempResidenceModal } from './MoreModals';
import {
  calculateFirstPeriodProRata,
  calculateInvoicePayable,
  formatNumberInput,
  formatVND,
  getVietQrUrl,
  parseDateVN,
  readMoneyWordsVN,
  type FifoAllocatedItem,
  type Invoice,
  type Room,
} from '../lib/shared';
import { C } from '../lib/theme';
import { Between, Btn, Field, MoneyField, Row, Select, Sheet, SubTabs, T, styles } from '../lib/ui';

/** Gắn tất cả hộp thoại theo s.modal */
export function ModalHost() {
  const s = useStore();
  const m = s.modal;
  const close = () => s.setModal(null);
  // Giống web: tài khoản phụ không mở được hợp đồng, giá phòng, thêm phòng, trả phòng
  const owner = s.canViewReports;
  return (
    <>
      {m?.kind === 'contract' && owner && <ContractModal key={`c-${m.roomCode}`} initialRoomCode={m.roomCode} onClose={close} />}
      {m?.kind === 'meter' && <MeterModal key={`m-${m.roomCode}`} initialRoomCode={m.roomCode} onClose={close} />}
      {m?.kind === 'collect' && <CollectModal key={`p-${m.invoice.id}`} invoice={m.invoice} report={m.report} onClose={close} />}
      {m?.kind === 'invoice' && <InvoiceModal key={`i-${m.invoice.id}`} invoice={m.invoice} onClose={close} />}
      {m?.kind === 'editInvoice' && <EditInvoiceModal key={`e-${m.invoice.id}`} invoice={m.invoice} onClose={close} />}
      {m?.kind === 'pricing' && owner && <PricingModal key={`r-${m.roomCode}`} roomCode={m.roomCode} onClose={close} />}
      {m?.kind === 'addRoom' && owner && <AddRoomModal onClose={close} />}
      {m?.kind === 'expense' && <ExpenseModal onClose={close} />}
      {m?.kind === 'moveOut' && owner && <MoveOutModal key={`o-${m.contract.id}`} contract={m.contract} onClose={close} />}
      {m?.kind === 'tempResidence' && <TempResidenceModal onClose={close} />}
      {m?.kind === 'auth' && <AuthModal onClose={close} />}
    </>
  );
}

function Box({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'amber' }) {
  return (
    <View
      style={{
        borderRadius: 12,
        borderWidth: 1,
        padding: 16,
        gap: 8,
        borderColor: tone === 'amber' ? C.amber200 : C.slate200,
        backgroundColor: tone === 'amber' ? '#FFFBEB66' : '#F8FAFCB3',
      }}
    >
      {children}
    </View>
  );
}

function KV({ k, v, vColor = C.slate900, strong }: { k: string; v: string; vColor?: string; strong?: boolean }) {
  return (
    <Between>
      <Text style={{ fontSize: 12, color: strong ? C.slate800 : C.slate600, fontWeight: strong ? '700' : '400' }}>{k}</Text>
      <Text style={[T.num, { fontSize: strong ? 14 : 12, fontWeight: strong ? '800' : '600', color: vColor }]}>{v}</Text>
    </Between>
  );
}

function Radio({ on, title, desc, onPress }: { on: boolean; title: string; desc: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      style={{
        flexDirection: 'row',
        gap: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: on ? C.blue600 : C.slate200,
        backgroundColor: on ? '#EFF6FF66' : C.white,
      }}
    >
      <View style={{ width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: on ? C.blue600 : C.slate300, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        {on && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.blue600 }} />}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate900 }}>{title}</Text>
        <Text style={T.xxs}>{desc}</Text>
      </View>
    </Pressable>
  );
}

// ============================================================================
// 1. TẠO HỢP ĐỒNG MỚI (kỳ đầu chia theo số ngày ở thật)
// ============================================================================
function ContractModal({ initialRoomCode, onClose }: { initialRoomCode?: string; onClose: () => void }) {
  const s = useStore();
  const rooms = s.propertyRooms;
  const property = s.currentProperty;
  const vacant = rooms.filter((r) => r.status === 'vacant');
  const defaultRoom = rooms.find((r) => r.code === initialRoomCode) || vacant[0] || rooms[0];

  const [roomCode, setRoomCode] = useState(defaultRoom?.code || '');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [cccd, setCccd] = useState('');
  const [startDate, setStartDate] = useState(s.today);
  const [endDate, setEndDate] = useState(s.today.replace(/\d{4}$/, (y) => String(Number(y) + 1)));
  const [signDate, setSignDate] = useState(s.today);
  const [paymentCycle, setPaymentCycle] = useState('Hàng tháng');
  const [billingCycle, setBillingCycle] = useState<'calendar_month' | 'move_in_date'>('calendar_month');
  const [rent, setRent] = useState(defaultRoom?.price || 2500000);
  const [deposit, setDeposit] = useState(defaultRoom?.deposit || 2500000);
  const [depositMode, setDepositMode] = useState<'received_today' | 'received_before' | 'pending'>('received_today');
  const [submitted, setSubmitted] = useState(false);

  const room = rooms.find((r) => r.code === roomCode) || defaultRoom;
  const start = parseDateVN(startDate);
  const end = parseDateVN(endDate);
  const dateOrderBad = !!start && !!end && end.getTime() <= start.getTime();
  const proRata = useMemo(() => calculateFirstPeriodProRata({ startDate, rentAmount: rent, billingCycle }), [startDate, rent, billingCycle]);
  const fixed = (room?.trashFee ?? property.trashFee) + (room?.internetFee ?? property.internetFee);

  const errors = {
    name: !name.trim() ? 'Nhập tên khách thuê đại diện' : '',
    phone: !/^0\d{9}$/.test(phone.trim()) ? 'Số điện thoại 10 số, bắt đầu bằng 0' : '',
    cccd: cccd.trim() && !/^\d{12}$/.test(cccd.trim()) ? 'CCCD gồm 12 số' : '',
    start: !start ? 'Ngày dạng DD/MM/YYYY' : '',
    end: !end ? 'Ngày dạng DD/MM/YYYY' : dateOrderBad ? 'Ngày kết thúc phải sau ngày bắt đầu' : '',
    sign: !parseDateVN(signDate) ? 'Ngày dạng DD/MM/YYYY' : '',
    room: room?.status === 'occupied' ? 'Phòng đang có người thuê' : '',
  };
  const invalid = Object.values(errors).some(Boolean);
  const show = (k: keyof typeof errors) => (submitted ? errors[k] || undefined : undefined);

  const onNameChange = (v: string) => {
    setName(v);
    const t = s.tenants.find((x) => x.name.trim().toLowerCase() === v.trim().toLowerCase());
    if (t) {
      setPhone(t.phone);
      setCccd(t.cccd);
    }
  };

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    s.createContract({
      roomCode,
      tenantName: name.trim(),
      tenantPhone: phone.trim(),
      tenantCccd: cccd.trim(),
      startDate,
      endDate,
      signDate,
      paymentCycle,
      billingCycle,
      rentAmount: rent,
      depositAmount: deposit,
      depositMode,
      coTenantNames: [],
      firstPeriodRent: proRata.firstAmount,
      firstPeriodLabel: proRata.periodText,
    });
    onClose();
  };

  return (
    <Sheet
      visible
      title="Tạo hợp đồng mới"
      onClose={onClose}
      footer={
        <>
          <Btn tone="outline" label="Huỷ" onPress={onClose} />
          <Btn label="Tạo hợp đồng" onPress={submit} />
        </>
      }
    >
      <Select
        label="Phòng *"
        value={roomCode}
        onChange={(code) => {
          setRoomCode(code);
          const r = rooms.find((x) => x.code === code);
          if (r) {
            setRent(r.price);
            setDeposit(r.deposit);
          }
        }}
        options={rooms.map((r) => ({
          value: r.code,
          label: `${r.code} · ${formatVND(r.price)} ${r.status === 'vacant' ? '(Trống)' : `(${r.tenantName || 'Đang thuê'})`}`,
          disabled: r.status === 'occupied',
        }))}
      />
      {show('room') ? <Text style={{ fontSize: 11, fontWeight: '600', color: C.rose600 }}>{errors.room}</Text> : null}
      <Field label="Khách thuê đại diện *" value={name} onChangeText={onNameChange} placeholder="Chọn hoặc gõ tên khách..." error={show('name')} />
      <Field label="Số điện thoại *" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="0912345678" error={show('phone')} />
      <Field label="Số CCCD/CMND" value={cccd} onChangeText={setCccd} keyboardType="number-pad" placeholder="079201008899 (12 số)" error={show('cccd')} />
      <Row style={{ gap: 12 }}>
        <Field style={{ flex: 1 }} label="Ngày bắt đầu *" value={startDate} onChangeText={setStartDate} placeholder="DD/MM/YYYY" error={show('start')} />
        <Field style={{ flex: 1 }} label="Ngày kết thúc *" value={endDate} onChangeText={setEndDate} placeholder="DD/MM/YYYY" error={dateOrderBad ? errors.end : show('end')} />
      </Row>
      <Row style={{ gap: 12 }}>
        <Field style={{ flex: 1 }} label="Ngày ký" value={signDate} onChangeText={setSignDate} placeholder="DD/MM/YYYY" error={show('sign')} />
        <View style={{ flex: 1 }}>
          <Select
            label="Chu kỳ thanh toán"
            value={paymentCycle}
            onChange={setPaymentCycle}
            options={['Hàng tháng', '3 tháng/lần', '6 tháng/lần'].map((v) => ({ value: v, label: v }))}
          />
        </View>
      </Row>
      <MoneyField label="Giá thuê (đ)" value={rent} onChange={setRent} />
      <MoneyField label="Tiền cọc (đ)" value={deposit} onChange={setDeposit} amber />
      <View style={{ gap: 4 }}>
        <Select
          label="Chu kỳ tính tiền"
          value={billingCycle}
          onChange={setBillingCycle}
          options={[
            { value: 'calendar_month', label: 'Theo tháng dương lịch — kỳ từ mùng 1 tới cuối tháng' },
            { value: 'move_in_date', label: 'Theo ngày vào ở — tròn tháng kể từ ngày nhận phòng' },
          ]}
        />
        <Text style={T.xxs}>Đi đọc đồng hồ một lượt cho cả dãy như bình thường.</Text>
      </View>

      <Box tone="amber">
        <KV k="Kỳ đầu tiên" v={proRata.periodText} />
        <KV k="Số ngày ở" v={proRata.daysText} />
        <KV k="Tiền phòng kỳ đầu" v={formatVND(proRata.firstAmount)} vColor={C.emerald600} strong />
        <Text style={[T.xxs, { paddingTop: 6, borderTopWidth: 1, borderTopColor: '#FDE68A99' }]}>
          Kỳ đầu ngắn hơn một kỳ đầy đủ nên tiền phòng chia theo số ngày ở thật. Từ kỳ sau tính đủ {formatVND(rent)}.
        </Text>
      </Box>

      <Box>
        <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate800 }}>Giá áp dụng cho phòng {roomCode}</Text>
        <KV k="Tiền điện" v={`${formatNumberInput(property.electricityRate)} đ/kWh`} />
        <KV k="Tiền nước" v={`${formatNumberInput(property.waterRate)} đ/m3`} />
        <Text style={[T.xxs, { fontWeight: '500' }]}>Dịch vụ hàng tháng</Text>
        <KV k="Rác" v={`${formatNumberInput(room?.trashFee ?? property.trashFee)} đ/phòng/tháng`} />
        <KV k="Internet" v={`${formatNumberInput(room?.internetFee ?? property.internetFee)} đ/phòng/tháng`} />
        <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: C.slate200 }}>
          <KV k="Cố định mỗi tháng (chưa gồm điện nước)" v={formatVND(fixed)} strong />
        </View>
      </Box>

      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 12, fontWeight: '500', color: C.slate700 }}>Tiền cọc</Text>
        <Radio on={depositMode === 'received_today'} onPress={() => setDepositMode('received_today')} title="Vừa nhận hôm nay" desc="Ghi một khoản Thu tiền cọc vào sổ quỹ" />
        <Radio
          on={depositMode === 'received_before'}
          onPress={() => setDepositMode('received_before')}
          title="Đã nhận từ trước khi dùng phần mềm"
          desc="Không ghi sổ quỹ — tiền vào két từ trước, ghi lại là sai doanh thu tháng này"
        />
        <Radio on={depositMode === 'pending'} onPress={() => setDepositMode('pending')} title="Chưa nhận" desc='Hợp đồng sẽ hiện cảnh báo "chưa thu cọc" cho tới khi bấm Đã nhận cọc' />
      </View>
      {submitted && invalid ? <Text style={{ fontSize: 12, fontWeight: '600', color: C.rose600 }}>Kiểm tra lại các ô báo đỏ.</Text> : null}
    </Sheet>
  );
}

// ============================================================================
// 2. GHI CHỈ SỐ ĐIỆN NƯỚC (đi từng phòng)
// ============================================================================
function MeterModal({ initialRoomCode, onClose }: { initialRoomCode?: string; onClose: () => void }) {
  const s = useStore();
  const active = s.propertyRooms.filter((r) => r.status === 'occupied' || r.code === initialRoomCode);
  const monthInv = s.invoices.filter((i) => i.billingMonth === s.invoiceMonth);
  const [idx, setIdx] = useState(() => Math.max(0, active.findIndex((r) => r.code === initialRoomCode)));
  const [readings, setReadings] = useState(() => {
    const map: Record<string, { elecOld: number; elecNew: number; waterOld: number; waterNew: number }> = {};
    active.forEach((r: Room) => {
      const inv = monthInv.find((i) => i.roomCode === r.code);
      map[r.code] = inv
        ? { elecOld: inv.elecOld, elecNew: inv.elecNew, waterOld: inv.waterOld, waterNew: inv.waterNew }
        : { elecOld: r.elecIndex, elecNew: r.elecIndex + 68, waterOld: r.waterIndex, waterNew: r.waterIndex + 6 };
    });
    return map;
  });
  const [entered, setEntered] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  if (active.length === 0) {
    return (
      <Sheet visible title="Ghi chỉ số điện nước" onClose={onClose}>
        <Text style={T.xs}>Chưa có phòng đang thuê để ghi chỉ số.</Text>
      </Sheet>
    );
  }
  const room = active[idx] || active[0];
  const rd = readings[room.code];
  const elecBad = rd.elecNew < rd.elecOld;
  const waterBad = rd.waterNew < rd.waterOld;

  const update = (field: 'elecNew' | 'waterNew', v: string) => {
    setReadings((p) => ({ ...p, [room.code]: { ...rd, [field]: parseInt(v.replace(/\D/g, ''), 10) || 0 } }));
    setEntered((p) => ({ ...p, [room.code]: true }));
    setError(null);
  };
  const save = () => {
    const bad = active.find((r) => readings[r.code].elecNew < readings[r.code].elecOld || readings[r.code].waterNew < readings[r.code].waterOld);
    if (bad) {
      setIdx(active.findIndex((r) => r.code === bad.code));
      setError(`Phòng ${bad.code}: Chỉ số mới nhỏ hơn chỉ số cũ. Vui lòng kiểm tra lại.`);
      return;
    }
    s.saveReadings(readings);
    onClose();
  };
  const next = () => {
    setEntered((p) => ({ ...p, [room.code]: true }));
    if (idx < active.length - 1) setIdx(idx + 1);
    else save();
  };

  const meterInput = (label: string, icon: React.ReactNode, old: number, value: number, bad: boolean, unit: string, field: 'elecNew' | 'waterNew') => (
    <View style={{ gap: 8 }}>
      <Between>
        <Row style={{ gap: 6 }}>
          {icon}
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.slate800 }}>{label}</Text>
        </Row>
        <Row style={{ gap: 6 }}>
          <Text style={T.xs}>Chỉ số cũ:</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate800, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: C.slate200, backgroundColor: C.slate50 }}>
            {old}
          </Text>
        </Row>
      </Between>
      <TextInput
        accessibilityLabel={`Chỉ số ${label.toLowerCase()} mới (${unit})`}
        keyboardType="number-pad"
        value={String(value)}
        onChangeText={(v) => update(field, v)}
        style={[styles.input, { textAlign: 'center', fontSize: 24, fontWeight: '800', paddingVertical: 12 }, bad && { borderWidth: 2, borderColor: C.rose500, backgroundColor: '#FFF1F266' }]}
      />
      {bad ? (
        <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: '600', color: C.rose600 }}>Chỉ số mới nhỏ hơn chỉ số cũ ({old})</Text>
      ) : (
        <Text style={[T.xs, { textAlign: 'center', color: C.slate500 }]}>
          Tiêu thụ: <Text style={{ fontWeight: '700', color: C.slate700 }}>{Math.max(0, value - old)} {unit}</Text>
        </Text>
      )}
    </View>
  );

  return (
    <Sheet visible title="Ghi chỉ số điện nước" subtitle="Đi từng phòng cho dễ bấm · Tự tính tiêu thụ và lập hóa đơn" onClose={onClose}>
      <View style={{ alignItems: 'center' }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: C.slate900 }}>{room.code}</Text>
        <Text style={T.xs}>
          Phòng {idx + 1} / {active.length}
          {room.tenantName ? ` · ${room.tenantName}` : ''}
        </Text>
      </View>
      {error ? (
        <Text style={{ textAlign: 'center', fontSize: 12, fontWeight: '600', color: C.rose700, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: C.rose200, backgroundColor: C.rose50 }}>
          {error}
        </Text>
      ) : null}
      {meterInput('Điện', <Zap size={16} color={C.amber500} />, rd.elecOld, rd.elecNew, elecBad, 'kWh', 'elecNew')}
      {meterInput('Nước', <Droplets size={16} color={C.blue500} />, rd.waterOld, rd.waterNew, waterBad, 'm³', 'waterNew')}
      <Row style={{ gap: 12 }}>
        <Btn style={{ flex: 1 }} tone="outline" icon={ArrowLeft} label="Trước" disabled={idx === 0} onPress={() => setIdx(Math.max(0, idx - 1))} />
        <Btn style={{ flex: 1 }} label={idx < active.length - 1 ? 'Phòng sau' : 'Lập hóa đơn cả dãy'} icon={ArrowRight} onPress={next} />
      </Row>
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Text style={T.xxs}>
          Đã nhập {Object.keys(entered).length}/{active.length} phòng
        </Text>
        <Row style={{ gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          {active.map((r, i) => (
            <Pressable key={r.id} onPress={() => setIdx(i)} hitSlop={6}>
              <View style={{ width: i === idx ? 10 : 8, height: i === idx ? 10 : 8, borderRadius: 5, backgroundColor: i === idx ? C.blue600 : entered[r.code] ? C.emerald500 : C.slate200 }} />
            </Pressable>
          ))}
        </Row>
        <Pressable onPress={save}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: C.blue600, textDecorationLine: 'underline' }}>Lưu & Lập hóa đơn tất cả phòng ngay</Text>
        </Pressable>
      </View>
    </Sheet>
  );
}

// ============================================================================
// 3. THU TIỀN - TỰ TRỪ NỢ CŨ NHẤT TRƯỚC (FIFO)
// ============================================================================
function CollectModal({ invoice, report, onClose }: { invoice: Invoice; report?: { id: string; amount: number }; onClose: () => void }) {
  const s = useStore();
  // Lấy bản mới nhất của hóa đơn (sau khi thu, danh sách đổi)
  const target = s.invoices.find((i) => i.id === invoice.id) || invoice;
  const unpaid = s.invoices
    .filter((i) => i.roomCode === target.roomCode && i.status !== 'draft' && i.totalAmount - i.paidAmount > 0)
    .sort((a, b) => a.billingMonth.localeCompare(b.billingMonth));
  const totalDebt = unpaid.reduce((x, i) => x + Math.max(0, i.totalAmount - i.paidAmount), 0);
  // Khách báo đã chuyển: điền sẵn số khách báo; mặc định toàn bộ nợ của phòng
  const [amount, setAmount] = useState(Math.min(report?.amount ?? totalDebt, totalDebt));
  const [date, setDate] = useState(s.today);
  const [method, setMethod] = useState<'Chuyển khoản' | 'Tiền mặt'>('Chuyển khoản');
  const [note, setNote] = useState('');
  const [result, setResult] = useState<{ items: FifoAllocatedItem[]; amount: number } | null>(null);
  const curRemain = Math.max(0, target.totalAmount - target.paidAmount);

  if (result) {
    return (
      <Sheet visible title={`Đã thu ${formatVND(result.amount)}`} onClose={onClose} footer={<Btn label="Xong" onPress={onClose} />}>
        <Text style={T.xs}>Tiền đã được trừ vào các hóa đơn sau, cũ nhất trước:</Text>
        {result.items.map((it) => (
          <Between key={it.invoiceId} style={{ padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.slate100, backgroundColor: '#F8FAFCB3' }}>
            <Row style={{ gap: 12 }}>
              <CheckCircle2 size={20} color={C.emerald600} />
              <View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate900 }}>Tháng {it.monthLabel}</Text>
                <Text style={T.xxs}>{it.invoiceCode}</Text>
              </View>
            </Row>
            <Text style={[T.num, { fontSize: 14, fontWeight: '700', color: C.emerald600 }]}>{formatVND(it.amountAllocated)}</Text>
          </Between>
        ))}
      </Sheet>
    );
  }

  const confirm = () => {
    if (amount <= 0 || !parseDateVN(date)) return;
    const items = s.collectFIFO({ roomCode: target.roomCode, amount, paymentDate: date, method, note }, report);
    setResult({ items, amount });
  };

  return (
    <Sheet
      visible
      title={`Thu tiền hóa đơn ${target.code}`}
      onClose={onClose}
      footer={
        <>
          <Btn tone="outline" label="Huỷ" onPress={onClose} />
          <Btn label="Xác nhận thu" disabled={amount <= 0} onPress={confirm} />
        </>
      }
    >
      <Text style={T.xs}>
        Phòng <Text style={{ fontWeight: '700', color: C.slate900 }}>{target.roomCode}</Text> · Kỳ này còn nợ{' '}
        <Text style={{ fontWeight: '700', color: C.slate900 }}>{formatVND(curRemain)}</Text>
      </Text>
      <Box>
        <KV k="Hóa đơn kỳ này" v={formatVND(curRemain)} />
        {unpaid
          .filter((i) => i.id !== target.id)
          .map((i) => (
            <KV key={i.id} k={`Nợ tháng ${i.billingMonth.replace('-', '/')}`} v={formatVND(i.totalAmount - i.paidAmount)} vColor={C.rose600} />
          ))}
        <View style={{ paddingTop: 8, borderTopWidth: 1, borderTopColor: C.slate200 }}>
          <KV k="Tổng phải trả" v={formatVND(totalDebt)} strong />
        </View>
        <Text style={T.xxs}>
          Thu bao nhiêu cũng được. Tiền sẽ trừ vào <Text style={{ fontWeight: '700', color: C.slate700 }}>hóa đơn cũ nhất trước</Text>, rồi mới tới kỳ này. Không thu quá tổng nợ.
        </Text>
      </Box>
      <MoneyField
        label="Số tiền (đ)"
        value={amount}
        onChange={(v) => setAmount(Math.min(v, totalDebt))}
        hint="Đang điền sẵn tổng phải trả gồm cả nợ kỳ trước. Sửa lại nếu khách trả ít hơn."
      />
      <Field label="Ngày thanh toán *" value={date} onChangeText={setDate} placeholder="DD/MM/YYYY" error={parseDateVN(date) ? undefined : 'Ngày dạng DD/MM/YYYY'} />
      <Select
        label="Hình thức"
        value={method}
        onChange={setMethod}
        options={[
          { value: 'Chuyển khoản', label: 'Chuyển khoản' },
          { value: 'Tiền mặt', label: 'Tiền mặt' },
        ]}
      />
      <Field label="Ghi chú" value={note} onChangeText={setNote} placeholder="VD: Khách CK Vietcombank..." />
    </Sheet>
  );
}

// ============================================================================
// 4. PHIẾU BÁO & GỬI ZALO KÈM VIETQR
// ============================================================================
function InvoiceModal({ invoice, onClose }: { invoice: Invoice; onClose: () => void }) {
  const s = useStore();
  const p = s.currentProperty;
  // Tài khoản Cloud: gắn mã ngẫu nhiên cho link trang hóa đơn người thuê (một lần cho mỗi hóa đơn)
  useEffect(() => {
    s.ensurePublicToken(invoice);
  }, []);
  const inv = s.invoices.find((i) => i.id === invoice.id) || invoice;
  const publicUrl = !s.isDemoMode && inv.publicToken ? `${PUBLIC_WEB_URL}?hd=${inv.publicToken}` : undefined;
  const [tab, setTab] = useState<'image' | 'message'>('image');
  const prevDebt = s.invoices
    .filter((i) => i.roomCode === inv.roomCode && i.billingMonth < inv.billingMonth && i.status !== 'draft')
    .reduce((x, i) => x + Math.max(0, i.totalAmount - i.paidAmount), 0);
  const depositHeld = s.propertyRooms.find((r) => r.code === inv.roomCode)?.deposit || 0;
  const { grandTotal } = calculateInvoicePayable(inv, prevDebt);
  const qrUrl = getVietQrUrl({
    bankBin: p.bankBin,
    bankAccount: p.bankAccount,
    bankOwner: p.bankOwner,
    amount: grandTotal,
    addInfo: `Thanh toan ${inv.roomCode} ${inv.code}`,
  });
  const period = inv.billingMonth.split('-').reverse().join('/');
  const message = `🏠 THÔNG BÁO TIỀN PHÒNG ${inv.roomCode} (${p.name})
Kỳ hóa đơn: ${period} (${inv.periodLabel})
Khách thuê: ${inv.tenantName}
--------------------------------
1. Tiền phòng: ${formatVND(inv.rentAmount)}
2. Tiền điện (${inv.elecUsage} kWh: ${inv.elecOld} → ${inv.elecNew}): ${formatVND(inv.elecAmount)}
3. Tiền nước (${inv.waterUsage} m3: ${inv.waterOld} → ${inv.waterNew}): ${formatVND(inv.waterAmount)}
4. Rác: ${formatVND(inv.trashAmount)}
5. Internet: ${formatVND(inv.internetAmount)}
6. Gửi xe máy (${inv.vehicleCount} xe): ${formatVND(inv.vehicleAmount)}
--------------------------------
• Tổng tiền hóa đơn kỳ này: ${formatVND(inv.totalAmount)}${inv.paidAmount > 0 ? `\n• Đã trả kỳ này: -${formatVND(inv.paidAmount)}` : ''}
• Nợ kỳ trước: ${formatVND(prevDebt)}
👉 TỔNG PHẢI TRẢ: ${formatVND(grandTotal)}
--------------------------------
🏦 Chuyển khoản: ${p.bankName} - ${p.bankAccount} (${p.bankOwner})
Nội dung CK: Thanh toan ${inv.roomCode} ${inv.code}
📷 Mã QR chuyển khoản (đã điền sẵn số tiền): ${qrUrl}${publicUrl ? `\n🔗 Xem hóa đơn & bấm "Tôi đã chuyển": ${publicUrl}` : ''}
Hạn thanh toán: ${inv.dueDate}`;

  // Chỉ đánh dấu "đã gửi" khi người dùng thật sự chia sẻ
  const share = async () => {
    try {
      const r = await Share.share({ message });
      if (r.action === Share.sharedAction) s.markSentZalo(inv.id);
    } catch {
      // đóng bảng chia sẻ: không đánh dấu
    }
  };

  const rows: [string, string, string, string, string?][] = [
    ['Tiền phòng', '1', `${formatNumberInput(inv.rentAmount)}/kỳ`, formatVND(inv.rentAmount)],
    [`Tiền điện (${inv.elecUsage} kWh)`, String(inv.elecUsage), `${formatNumberInput(inv.elecRate)}/kWh`, formatVND(inv.elecAmount), `${formatNumberInput(inv.elecOld)} → ${formatNumberInput(inv.elecNew)}`],
    [`Tiền nước (${inv.waterUsage} m3)`, String(inv.waterUsage), `${formatNumberInput(inv.waterRate)}/m3`, formatVND(inv.waterAmount), `${inv.waterOld} → ${inv.waterNew}`],
    ['Rác', '1', formatNumberInput(inv.trashAmount), formatVND(inv.trashAmount)],
    ['Internet', '1', formatNumberInput(inv.internetAmount), formatVND(inv.internetAmount)],
    ...(inv.vehicleAmount > 0
      ? ([['Gửi xe máy', String(inv.vehicleCount), formatNumberInput(inv.vehicleAmount / Math.max(1, inv.vehicleCount)), formatVND(inv.vehicleAmount)]] as [string, string, string, string][])
      : []),
  ];

  return (
    <Sheet visible title={`Phòng ${inv.roomCode} · ${inv.tenantName}`} onClose={onClose}>
      <Row style={{ gap: 8, flexWrap: 'wrap' }}>
        <Btn tone="soft" small icon={MessageCircle} label={`Mở Zalo ${inv.tenantPhone}`} onPress={() => Linking.openURL(`https://zalo.me/${inv.tenantPhone}`)} />
        <Btn small icon={Share2} label="Chia sẻ" onPress={share} />
      </Row>
      <SubTabs
        tabs={[
          { id: 'image', label: 'Ảnh hóa đơn' },
          { id: 'message', label: 'Tin nhắn Zalo' },
        ]}
        value={tab}
        onChange={setTab}
      />
      {tab === 'image' ? (
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: C.slate200, padding: 16, gap: 14, backgroundColor: C.white }}>
          <View style={{ borderBottomWidth: 1, borderBottomColor: C.slate200, paddingBottom: 12, gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: C.slate900 }}>THÔNG BÁO THANH TOÁN</Text>
            <Text style={T.xs}>Kỳ hóa đơn: {period}</Text>
            <Text style={[T.xs, { fontWeight: '600', color: C.slate700, marginTop: 6 }]}>{p.name}</Text>
            <Text style={T.xxs}>{p.address}</Text>
          </View>
          <View style={{ gap: 6 }}>
            <KV k="Phòng:" v={`${inv.roomCode} (Tầng ${inv.floor})`} />
            <KV k="Khách thuê:" v={inv.tenantName} />
            <KV k="Số điện thoại:" v={inv.tenantPhone} />
            <KV k="Cọc đang giữ:" v={formatVND(depositHeld)} />
            <KV k="Mã hóa đơn:" v={inv.code} />
            <KV k="Ngày phát hành:" v={inv.issueDate} />
            <KV k="Hạn thanh toán:" v={inv.dueDate} />
            <KV k="Kỳ sử dụng:" v={inv.periodLabel} />
          </View>
          <View style={{ borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.slate200, paddingVertical: 4 }}>
            {rows.map(([label, qty, unit, amount, sub], i) => (
              <View key={label} style={{ flexDirection: 'row', paddingVertical: 8, borderTopWidth: i ? 1 : 0, borderTopColor: C.slate100, gap: 8 }}>
                <Text style={[T.xxs, { width: 16 }]}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '500', color: C.slate800 }}>{label}</Text>
                  <Text style={{ fontSize: 10, color: C.slate400 }}>
                    {sub ? `${sub} · ` : ''}SL {qty} × {unit}
                  </Text>
                </View>
                <Text style={[T.num, { fontSize: 12, fontWeight: '600', color: C.slate800 }]}>{amount}</Text>
              </View>
            ))}
          </View>
          <View style={{ gap: 6 }}>
            <KV k="[1] Tổng tiền hóa đơn" v={formatVND(inv.totalAmount)} />
            {inv.paidAmount > 0 && <KV k="Đã trả kỳ này" v={`-${formatVND(inv.paidAmount)}`} vColor={C.emerald600} />}
            {prevDebt > 0 && <KV k="[2] Nợ kỳ trước" v={formatVND(prevDebt)} vColor={C.rose600} />}
            <View style={{ paddingTop: 6, borderTopWidth: 1, borderTopColor: C.slate200 }}>
              <KV k="TỔNG PHẢI TRẢ" v={formatVND(grandTotal)} vColor={C.rose600} strong />
            </View>
            <Text style={{ fontSize: 11, fontStyle: 'italic', color: C.slate400, textAlign: 'right' }}>{readMoneyWordsVN(grandTotal)}</Text>
          </View>
          <View style={{ alignItems: 'center', gap: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.slate100 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: C.slate500 }}>QUÉT MÃ ĐỂ CHUYỂN KHOẢN</Text>
            <View style={{ padding: 12, borderRadius: 12, borderWidth: 1, borderColor: C.slate200 }}>
              <Image source={{ uri: qrUrl }} style={{ width: 160, height: 160 }} resizeMode="contain" accessibilityLabel="VietQR" />
            </View>
            <Text style={T.xxs}>Mã QR đã điền sẵn số tiền và nội dung chuyển khoản</Text>
          </View>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate700 }}>Nội dung tin nhắn gửi Zalo cho khách</Text>
          <Text selectable style={{ fontSize: 12, lineHeight: 19, color: C.slate800, backgroundColor: C.slate50, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: C.slate200 }}>
            {message}
          </Text>
        </View>
      )}
    </Sheet>
  );
}

// ============================================================================
// 5. ĐIỀU CHỈNH GIÁ THUÊ TỪNG PHÒNG
// ============================================================================
function PricingModal({ roomCode, onClose }: { roomCode: string; onClose: () => void }) {
  const s = useStore();
  const rooms = s.propertyRooms;
  const [code, setCode] = useState(roomCode || rooms[0]?.code);
  const room = rooms.find((r) => r.code === code) || rooms[0];
  const [price, setPrice] = useState(room.price);
  const [deposit, setDeposit] = useState(room.deposit);
  const [trash, setTrash] = useState(room.trashFee);
  const [internet, setInternet] = useState(room.internetFee);
  const [vehicles, setVehicles] = useState(room.vehicleCount);
  const [status, setStatus] = useState<Room['status']>(room.status);
  const [syncContracts, setSyncContracts] = useState(true);
  const [syncInvoices, setSyncInvoices] = useState(true);

  useEffect(() => {
    setPrice(room.price);
    setDeposit(room.deposit);
    setTrash(room.trashFee);
    setInternet(room.internetFee);
    setVehicles(room.vehicleCount);
    setStatus(room.status);
  }, [code]);

  const diff = price - room.price;
  const diffPct = room.price > 0 ? ((diff / room.price) * 100).toFixed(1) : '0.0';
  const contract = s.contracts.find((c) => c.roomCode === code && c.status === 'active');

  const save = () => {
    s.saveRoomPricing({
      updates: [{ roomCode: code, price, deposit, trashFee: trash, internetFee: internet, vehicleCount: vehicles, status, notes: room.notes }],
      syncActiveContracts: syncContracts,
      syncUnpaidInvoices: syncInvoices,
    });
    onClose();
  };

  return (
    <Sheet
      visible
      title="Điều chỉnh giá thuê phòng"
      subtitle="Đổi giá, cọc, dịch vụ và đồng bộ hợp đồng + hóa đơn chưa thu"
      onClose={onClose}
      footer={
        <>
          <Btn tone="outline" label="Huỷ" onPress={onClose} />
          <Btn label="Lưu giá thuê mới" onPress={save} />
        </>
      }
    >
      <Select label="Phòng" value={code} onChange={setCode} options={rooms.map((r) => ({ value: r.code, label: `${r.code} · ${r.tenantName || (r.status === 'vacant' ? 'Trống' : 'Đang sửa')}` }))} />
      <MoneyField
        label="Giá thuê / tháng (đ)"
        value={price}
        onChange={setPrice}
        hint={diff !== 0 ? `${diff > 0 ? 'Tăng' : 'Giảm'} ${formatVND(Math.abs(diff))} (${diff > 0 ? '+' : ''}${diffPct}%) so với ${formatVND(room.price)}` : `Giá hiện tại ${formatVND(room.price)}`}
      />
      <Row style={{ gap: 8, flexWrap: 'wrap' }}>
        {[-100000, -50000, 50000, 100000, 200000].map((d) => (
          <Btn key={d} small tone="outline" label={`${d > 0 ? '+' : '-'}${Math.abs(d) / 1000}k`} onPress={() => setPrice((p) => Math.max(0, p + d))} />
        ))}
      </Row>
      <MoneyField label="Tiền cọc chuẩn (đ)" value={deposit} onChange={setDeposit} amber />
      <Row style={{ gap: 12 }}>
        <View style={{ flex: 1 }}>
          <MoneyField label="Rác (đ/tháng)" value={trash} onChange={setTrash} />
        </View>
        <View style={{ flex: 1 }}>
          <MoneyField label="Internet (đ/tháng)" value={internet} onChange={setInternet} />
        </View>
      </Row>
      <MoneyField label="Số xe gửi" value={vehicles} onChange={setVehicles} />
      <Select
        label="Trạng thái phòng"
        value={status}
        onChange={setStatus}
        options={[
          { value: 'occupied', label: 'Đã thuê' },
          { value: 'vacant', label: 'Trống' },
          { value: 'maintenance', label: 'Đang sửa chữa' },
        ]}
      />
      <Box>
        <Between>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate800 }}>Đồng bộ hợp đồng đang hiệu lực</Text>
            <Text style={T.xxs}>{contract ? `${contract.code} · ${contract.tenantName}` : 'Phòng chưa có hợp đồng hiệu lực'}</Text>
          </View>
          <Switch value={syncContracts} onValueChange={setSyncContracts} trackColor={{ true: C.blue600 }} />
        </Between>
        <Between>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate800 }}>Đồng bộ hóa đơn chưa thu</Text>
            <Text style={T.xxs}>Từ kỳ hiện tại trở đi, hóa đơn đã thu đủ giữ nguyên</Text>
          </View>
          <Switch value={syncInvoices} onValueChange={setSyncInvoices} trackColor={{ true: C.blue600 }} />
        </Between>
      </Box>
    </Sheet>
  );
}
