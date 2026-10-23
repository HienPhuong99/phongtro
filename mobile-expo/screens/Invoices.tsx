import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight, Droplets, Send } from 'lucide-react-native';
import { useStore } from '../lib/store';
import { formatVND, shiftMonth, type Invoice } from '../lib/shared';
import { C } from '../lib/theme';
import { Between, Btn, Card, Chip, ChipRow, Row, SubTabs, T } from '../lib/ui';

const monthLabel = (ym: string) => {
  const [y, m] = ym.split('-');
  return y && m ? `tháng ${m} ${y}` : ym;
};

export function Invoices() {
  const s = useStore();
  const { invoices, invoiceMonth, setInvoiceMonth, curMonth, nextMonth } = s;
  const [subTab, setSubTab] = useState<'by_room' | 'all'>('by_room');
  const [filter, setFilter] = useState('all');

  const monthInvoices = invoices.filter((i) => i.billingMonth === invoiceMonth);
  const active = monthInvoices.filter((i) => i.status !== 'draft');
  const total = active.reduce((x, i) => x + i.totalAmount, 0);
  const paid = active.reduce((x, i) => x + i.paidAmount, 0);
  const remainingTotal = Math.max(0, total - paid);

  const filtered = monthInvoices.filter((inv) => {
    if (filter === 'draft') return inv.status === 'draft';
    if (filter === 'unsent') return inv.status !== 'draft' && !inv.sentZalo;
    if (filter === 'unpaid') return inv.status !== 'draft' && inv.totalAmount - inv.paidAmount > 0;
    return true;
  });

  const months = Array.from(
    new Set([shiftMonth(curMonth, -1), curMonth, nextMonth, ...invoices.map((i) => i.billingMonth), invoiceMonth])
  ).sort();
  const idx = months.indexOf(invoiceMonth);

  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 12 }}>
        <View>
          <Text style={T.h1}>Hóa đơn</Text>
          <Text style={T.sub}>
            Phải thu <Text style={{ fontWeight: '700', color: C.slate800 }}>{formatVND(total)}</Text> · đã thu{' '}
            <Text style={{ fontWeight: '700', color: C.emerald600 }}>{formatVND(paid)}</Text> · còn lại{' '}
            <Text style={{ fontWeight: '700', color: C.rose600 }}>{formatVND(remainingTotal)}</Text> · {s.occupiedRooms.length} phòng đang thuê
          </Text>
        </View>
        <Row style={{ gap: 8 }}>
          <MonthBtn icon="prev" disabled={idx <= 0} onPress={() => setInvoiceMonth(months[idx - 1])} />
          <View style={{ flex: 1, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.slate200, backgroundColor: C.white, alignItems: 'center' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate900 }}>{monthLabel(invoiceMonth)}</Text>
          </View>
          <MonthBtn icon="next" disabled={idx >= months.length - 1} onPress={() => setInvoiceMonth(months[idx + 1])} />
        </Row>
      </View>

      <SubTabs
        tabs={[
          { id: 'by_room', label: 'Theo phòng' },
          { id: 'all', label: 'Tất cả hóa đơn' },
        ]}
        value={subTab}
        onChange={setSubTab}
      />

      <Card style={{ gap: 16 }}>
        <View>
          <Text style={T.h2}>Từng phòng đang ở đâu ({monthLabel(invoiceMonth)})</Text>
          <Text style={[T.sub, { marginTop: 2 }]}>Bấm thẳng vào ô cần làm. Mỗi phòng theo chu kỳ tính tiền của hợp đồng phòng đó.</Text>
        </View>
        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
          <Btn tone="ghost" icon={Droplets} label="Ghi chỉ số hàng loạt" onPress={() => s.setModal({ kind: 'meter', roomCode: s.occupiedRooms[0]?.code })} />
          <Btn icon={Send} label={`Gửi ${active.length} hóa đơn`} onPress={() => active[0] && s.setModal({ kind: 'invoice', invoice: active[0] })} />
        </Row>
        <ChipRow>
          {[
            { id: 'all', label: 'Tất cả', count: monthInvoices.length },
            { id: 'draft', label: 'Nháp chờ chỉ số', count: monthInvoices.filter((i) => i.status === 'draft').length },
            { id: 'unsent', label: 'Chưa gửi', count: monthInvoices.filter((i) => i.status !== 'draft' && !i.sentZalo).length },
            { id: 'unpaid', label: 'Còn nợ', count: monthInvoices.filter((i) => i.status !== 'draft' && i.totalAmount - i.paidAmount > 0).length },
          ].map((p) => (
            <Chip key={p.id} soft label={p.label} count={p.count} active={filter === p.id} onPress={() => setFilter(p.id)} />
          ))}
        </ChipRow>

        <View>
          {filtered.map((inv) => (
            <InvoiceRow key={inv.id} inv={inv} />
          ))}
          <Between style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.slate100 }}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: C.slate900 }}>Tổng {active.length} hóa đơn</Text>
            <Text style={[T.num, { fontSize: 12, fontWeight: '800', color: C.rose600 }]}>Còn {formatVND(remainingTotal)}</Text>
          </Between>
        </View>
      </Card>
    </View>
  );
}

function MonthBtn({ icon, disabled, onPress }: { icon: 'prev' | 'next'; disabled: boolean; onPress: () => void }) {
  const Icon = icon === 'prev' ? ChevronLeft : ChevronRight;
  return (
    <Pressable
      accessibilityLabel={icon === 'prev' ? 'Tháng trước' : 'Tháng sau'}
      disabled={disabled}
      onPress={onPress}
      style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: C.slate200, backgroundColor: C.white, opacity: disabled ? 0.4 : 1 }}
    >
      <Icon size={16} color={C.slate700} />
    </Pressable>
  );
}

function InvoiceRow({ inv }: { inv: Invoice }) {
  const s = useStore();
  const rem = Math.max(0, inv.totalAmount - inv.paidAmount);
  return (
    <View style={{ paddingVertical: 12, borderTopWidth: 1, borderTopColor: C.slate100, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ flex: 1, gap: 6 }}>
        <Row style={{ gap: 8, alignItems: 'baseline' }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>{inv.roomCode}</Text>
          <Text style={[T.xxs, { flex: 1 }]} numberOfLines={1}>
            {inv.tenantName}
          </Text>
        </Row>
        <Text style={T.xxs}>{inv.periodLabel}</Text>
        <Row style={{ gap: 6, flexWrap: 'wrap' }}>
          <Pressable onPress={() => s.setModal({ kind: 'meter', roomCode: inv.roomCode })} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: C.emerald50 }}>
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.emerald700 }}>
              {inv.elecUsage} kWh · {inv.waterUsage} m3
            </Text>
          </Pressable>
          {inv.status === 'draft' ? (
            <Pressable onPress={() => s.markDraftReady(inv.id)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, backgroundColor: C.blue50 }}>
              <Text style={{ fontSize: 11, fontWeight: '600', color: C.blue700 }}>Nháp — điền chỉ số</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => s.setModal({ kind: 'invoice', invoice: inv })} hitSlop={6}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: C.blue600 }}>{inv.code}</Text>
            </Pressable>
          )}
        </Row>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 6 }}>
        <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: rem > 0 ? C.rose600 : inv.status === 'draft' ? C.slate400 : C.emerald600 }]}>
          {inv.status === 'draft' ? 'Chưa lập' : rem > 0 ? formatVND(rem) : 'Đã thu đủ'}
        </Text>
        {inv.paidAmount > 0 && <Text style={[T.xxs, T.num]}>Tổng {formatVND(inv.totalAmount)}</Text>}
        <Row style={{ gap: 6 }}>
          <Pressable
            onPress={() => s.setModal({ kind: 'invoice', invoice: inv })}
            style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: inv.sentZalo ? C.emerald50 : C.slate100 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: inv.sentZalo ? C.emerald700 : C.slate700 }}>{inv.sentZalo ? 'Đã gửi' : 'Gửi'}</Text>
          </Pressable>
          {rem > 0 ? (
            <Pressable onPress={() => s.setModal({ kind: 'collect', invoice: inv })} style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, backgroundColor: C.slate100 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: C.slate800 }}>Thu</Text>
            </Pressable>
          ) : (
            <Text style={{ fontSize: 11, fontWeight: '600', color: C.emerald600, paddingVertical: 5 }}>✓ Xong</Text>
          )}
        </Row>
      </View>
    </View>
  );
}
