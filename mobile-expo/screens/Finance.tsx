import React, { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { AlertTriangle, Clock, Plus, Wallet } from 'lucide-react-native';
import { useStore } from '../lib/store';
import { formatVND, type CashTransaction, type NavTab } from '../lib/shared';
import { C } from '../lib/theme';
import { Badge, Btn, Card, Kpi, Row, SubTabs, T } from '../lib/ui';

const TITLES: Record<string, { title: string; sub: string }> = {
  'finance-cashbook': { title: 'Sổ thu chi', sub: 'Toàn bộ lịch sử thu tiền phòng, tiền cọc và các khoản chi bảo trì, vệ sinh.' },
  'finance-funds': { title: 'Quỹ tiền mặt & Ngân hàng', sub: 'Theo dõi số dư thực tế trong tài khoản Vietcombank và két tiền mặt.' },
  'finance-debts': { title: 'Công nợ', sub: 'Toàn bộ hóa đơn chưa thu đủ, gồm cả các tháng trước.' },
  'finance-deposits': { title: 'Cọc phải trả lại', sub: 'Tiền cọc đang cầm của khách, và những khoản đã tới lúc phải chuyển trả.' },
};

export function Finance({ initial }: { initial: NavTab }) {
  const s = useStore();
  const [tab, setTab] = useState<NavTab>(TITLES[initial] ? initial : 'finance-debts');
  const head = TITLES[tab] || TITLES['finance-debts'];
  const fundBalance = (method: CashTransaction['method']) =>
    s.transactions.filter((t) => t.method === method).reduce((x, t) => x + (t.type === 'income' ? t.amount : -t.amount), 0);
  const activeContracts = s.contracts.filter((c) => c.status === 'active');

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={T.h1}>{head.title}</Text>
        <Text style={T.sub}>{head.sub}</Text>
      </View>
      <SubTabs<NavTab>
        tabs={(
          [
            { id: 'finance-cashbook', label: 'Sổ thu chi' },
            { id: 'finance-funds', label: 'Quỹ' },
            { id: 'finance-debts', label: 'Công nợ' },
            { id: 'finance-deposits', label: 'Cọc phải trả' },
          ] as { id: NavTab; label: string }[]
        ).filter((t) => s.canViewReports || t.id === 'finance-cashbook' || t.id === 'finance-debts')}
        value={tab}
        onChange={setTab}
      />

      {tab === 'finance-debts' && (
        <View style={{ gap: 16 }}>
          <Kpi
            icon={AlertTriangle}
            iconBg={C.amber50}
            iconColor={C.amber600}
            label={`Tổng còn nợ (${s.allUnpaidInvoices.length} hóa đơn)`}
            value={formatVND(s.allUnpaidTotalAmount)}
            style={{ borderWidth: 2, borderColor: C.amber200 }}
          />
          <Kpi icon={Clock} iconBg={C.blue50} iconColor={C.blue600} label={`Trong đó quá hạn (${s.overdueInvoices.length} hóa đơn)`} value={formatVND(s.overdueTotalAmount)} />
          <Card style={{ padding: 0 }}>
            {s.allUnpaidInvoices.map((inv, i) => (
              <ListRow key={inv.id} first={i === 0}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Row style={{ gap: 8, alignItems: 'baseline' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>{inv.roomCode}</Text>
                    <Text style={{ fontSize: 12, color: C.slate700, flex: 1 }} numberOfLines={1}>
                      {inv.tenantName}
                    </Text>
                  </Row>
                  <Pressable onPress={() => Linking.openURL(`tel:${inv.tenantPhone}`)}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: C.blue600 }}>{inv.tenantPhone}</Text>
                  </Pressable>
                  <Row style={{ gap: 6 }}>
                    <Text style={T.xxs}>
                      {inv.code} · hạn {inv.dueDate}
                    </Text>
                    {inv.isOverdue && <Badge label="Quá hạn" bg={C.rose50} fg={C.rose600} style={{ borderRadius: 4 }} />}
                  </Row>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 6 }}>
                  <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: C.rose600 }]}>{formatVND(inv.totalAmount - inv.paidAmount)}</Text>
                  <Btn small label="Thu nợ" onPress={() => s.setModal({ kind: 'collect', invoice: inv })} />
                </View>
              </ListRow>
            ))}
          </Card>
        </View>
      )}

      {tab === 'finance-deposits' && (
        <View style={{ gap: 16 }}>
          <Kpi
            icon={Wallet}
            iconBg={C.blue50}
            iconColor={C.blue600}
            label={`Đang giữ hộ khách (${activeContracts.length} khoản)`}
            value={formatVND(activeContracts.reduce((x, c) => x + c.depositAmount, 0))}
            note="Khách còn thuê — chưa tới lúc trả"
          />
          <Kpi
            icon={AlertTriangle}
            iconBg={C.amber50}
            iconColor={C.amber600}
            label={`Tới hạn trả lại (${s.pendingRefundContracts.length} khoản)`}
            value={formatVND(s.pendingRefundTotal)}
            note="Đã thanh lý, chờ chuyển tiền về cho khách"
            style={{ borderWidth: 2, borderColor: C.amber200 }}
          />
          <Card style={{ gap: 8 }}>
            <Text style={T.h2}>Tới hạn trả lại</Text>
            <Text style={T.sub}>Khách đã dọn đi, tiền cọc còn nằm trong két của bạn.</Text>
            {s.pendingRefundContracts.length === 0 ? (
              <Text style={{ fontSize: 12, fontWeight: '600', color: C.emerald600, paddingVertical: 12 }}>
                ✓ Đã hoàn trả toàn bộ tiền cọc cho các hợp đồng đã thanh lý.
              </Text>
            ) : (
              s.pendingRefundContracts.map((c) => (
                <ListRow key={c.id} flat>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Row style={{ gap: 8, alignItems: 'baseline' }}>
                      <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>{c.roomCode}</Text>
                      <Text style={{ fontSize: 12, color: C.slate700, flex: 1 }} numberOfLines={1}>
                        {c.tenantName}
                      </Text>
                    </Row>
                    <Text style={T.xxs}>
                      Trả phòng {c.moveOutDate} · cọc {formatVND(c.depositAmount)}, trừ {formatVND(c.depositDeducted || 0)}
                    </Text>
                    {c.refundBankAccount ? (
                      <Text style={T.xxs}>
                        {c.refundBankAccount} {c.refundBankName}
                      </Text>
                    ) : null}
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Text style={[T.num, { fontSize: 12, fontWeight: '800', color: C.slate900 }]}>{formatVND(s.getContractRefundAmount(c))}</Text>
                    <Btn small label="Đã chuyển trả" onPress={() => s.markDepositRefunded(c)} />
                  </View>
                </ListRow>
              ))
            )}
          </Card>
          <Card style={{ gap: 8 }}>
            <Text style={T.h2}>Đang giữ hộ khách</Text>
            <Text style={T.sub}>Khách còn thuê. Chưa phải trả, nhưng đây là tiền của họ.</Text>
            {activeContracts.map((c) => (
              <ListRow key={c.id} flat>
                <View style={{ flex: 1, gap: 2 }}>
                  <Row style={{ gap: 8, alignItems: 'baseline' }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>{c.roomCode}</Text>
                    <Text style={{ fontSize: 12, color: C.slate700, flex: 1 }} numberOfLines={1}>
                      {c.tenantName}
                    </Text>
                  </Row>
                  <Text style={T.xxs}>
                    {c.startDate} → {c.endDate}
                  </Text>
                </View>
                <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: C.slate900 }]}>{formatVND(c.depositAmount)}</Text>
              </ListRow>
            ))}
          </Card>
        </View>
      )}

      {tab === 'finance-cashbook' && (
        <Card style={{ gap: 8 }}>
          <Text style={T.h2}>Nhật ký Sổ thu chi ({s.transactions.length} bút toán)</Text>
          <Btn icon={Plus} label="Ghi khoản chi" style={{ alignSelf: 'flex-start' }} onPress={() => s.setModal({ kind: 'expense' })} />
          {s.transactions.map((tx) => (
            <ListRow key={tx.id} flat>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.slate900 }}>{tx.category}</Text>
                <Text style={T.xxs}>
                  {tx.date} · {tx.method}
                  {tx.roomCode ? ` · Phòng ${tx.roomCode}` : ''}
                </Text>
                <Text style={T.xxs} numberOfLines={2}>
                  {tx.description}
                </Text>
              </View>
              <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: tx.type === 'income' ? C.emerald600 : C.rose600 }]}>
                {formatVND(tx.type === 'income' ? tx.amount : -tx.amount, tx.type === 'income')}
              </Text>
            </ListRow>
          ))}
        </Card>
      )}

      {tab === 'finance-funds' && (
        <View style={{ gap: 16 }}>
          <Card style={{ gap: 8 }}>
            <Text style={[T.xs, { color: C.slate500 }]}>
              Quỹ Ngân hàng ({s.currentProperty.bankName} · {s.currentProperty.bankAccount})
            </Text>
            <Text style={[T.kpi, { color: fundBalance('Chuyển khoản') < 0 ? C.rose600 : C.blue600 }]}>{formatVND(fundBalance('Chuyển khoản'))}</Text>
            <Text style={[T.xxs, { color: C.slate400 }]}>Thu trừ chi bằng chuyển khoản trong sổ thu chi (chưa gồm số dư đầu kỳ)</Text>
          </Card>
          <Card style={{ gap: 8 }}>
            <Text style={[T.xs, { color: C.slate500 }]}>Quỹ Tiền mặt tại nhà trọ</Text>
            <Text style={[T.kpi, { color: fundBalance('Tiền mặt') < 0 ? C.rose600 : C.emerald600 }]}>{formatVND(fundBalance('Tiền mặt'))}</Text>
            <Text style={[T.xxs, { color: C.slate400 }]}>Thu trừ chi bằng tiền mặt trong sổ thu chi (chưa gồm số dư đầu kỳ)</Text>
          </Card>
        </View>
      )}
    </View>
  );
}

export function ListRow({ children, first, flat }: { children: React.ReactNode; first?: boolean; flat?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: 12,
        paddingHorizontal: flat ? 0 : 14,
        borderTopWidth: first ? 0 : 1,
        borderTopColor: C.slate100,
      }}
    >
      {children}
    </View>
  );
}
