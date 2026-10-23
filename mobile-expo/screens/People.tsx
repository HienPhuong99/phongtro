import React, { useState } from 'react';
import { Alert, Linking, Pressable, Text, TextInput, View } from 'react-native';
import { AlertTriangle, Car, CheckCircle2, Clock, FileText, IdCard, Plus, Trash2, Users, Wallet } from 'lucide-react-native';
import { useStore } from '../lib/store';
import { formatVND, removeAccents } from '../lib/shared';
import { C } from '../lib/theme';
import { Badge, Btn, Card, Chip, ChipRow, Kpi, Row, SubTabs, T, styles } from '../lib/ui';
import { ListRow } from './Finance';

export function Tenants() {
  const s = useStore();
  const [sub, setSub] = useState<'tenants' | 'vehicles'>('tenants');
  const [q, setQ] = useState('');
  const query = removeAccents(q.trim());
  const tenants = s.tenants.filter(
    (t) => !query || removeAccents(t.name).includes(query) || t.phone.includes(query) || t.cccd.includes(query) || removeAccents(t.roomCode).includes(query)
  );
  const plateQ = query.replace(/[\s.-]/g, '');
  const vehicles = s.vehicles.filter(
    (v) => !plateQ || [v.plate, v.ownerName, v.phone, v.roomCode].some((f) => removeAccents(f).replace(/[\s.-]/g, '').includes(plateQ))
  );

  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={T.h1}>Khách thuê</Text>
        <Text style={T.sub}>{sub === 'tenants' ? 'Danh sách khách, dùng khi khai báo tạm trú.' : 'Danh sách xe của khách đang thuê.'}</Text>
        <Btn tone="soft" icon={FileText} label="Khai báo tạm trú (CT01)" style={{ alignSelf: 'flex-start', marginTop: 12 }} onPress={() => s.setModal({ kind: 'tempResidence' })} />
      </View>
      <View style={{ gap: 12 }}>
        <SubTabs
          tabs={[
            { id: 'tenants', label: 'Danh sách khách' },
            { id: 'vehicles', label: 'Danh sách xe' },
          ]}
          value={sub}
          onChange={setSub}
        />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Tìm theo tên, SĐT, CCCD, phòng..."
          placeholderTextColor={C.slate400}
          style={[styles.input, { fontSize: 12, paddingVertical: 8 }]}
        />
      </View>

      {sub === 'tenants' ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            <Kpi style={{ width: '47.5%', padding: 16 }} icon={Users} iconBg={C.blue50} iconColor={C.blue600} label="Tổng khách trong sổ" value={String(s.tenants.length)} />
            <Kpi style={{ width: '47.5%', padding: 16 }} icon={CheckCircle2} iconBg={C.emerald50} iconColor={C.emerald600} label="Đang thuê" value={String(s.tenants.filter((t) => t.status === 'active').length)} />
            <Kpi style={{ width: '47.5%', padding: 16 }} icon={Clock} iconBg={C.purple50} iconColor={C.purple600} label="Đã chuyển đi" value={String(s.tenants.filter((t) => t.status === 'moved_out').length)} />
            <Kpi
              style={{ width: '47.5%', padding: 16 }}
              icon={FileText}
              iconBg={C.amber50}
              iconColor={C.amber600}
              label="Đã có ảnh CCCD"
              value={`${s.tenants.filter((t) => t.hasCccdPhoto).length}/${s.tenants.length}`}
            />
          </View>
          <Card style={{ padding: 0 }}>
            {tenants.map((t, i) => {
              const stats = s.roomFinancialStats[t.roomCode] || { paid: 0, debt: 0 };
              const isRep = t.role === 'representative';
              return (
                <ListRow key={t.id} first={i === 0}>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate900 }} numberOfLines={1}>
                      {t.name}
                    </Text>
                    <Text style={T.xxs}>
                      Phòng {t.roomCode} · {isRep ? 'Đại diện' : 'Ở cùng'} · {t.contractCode}
                    </Text>
                    <Pressable onPress={() => Linking.openURL(`tel:${t.phone}`)}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: C.blue600 }}>{t.phone}</Text>
                    </Pressable>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 6 }}>
                    <Badge
                      label={t.status === 'active' ? 'Đang thuê' : 'Đã chuyển đi'}
                      bg={t.status === 'active' ? C.emerald50 : C.slate100}
                      fg={t.status === 'active' ? C.emerald700 : C.slate600}
                      style={{ borderRadius: 8 }}
                    />
                    {isRep && stats.debt > 0 && <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: C.rose600 }]}>Nợ {formatVND(stats.debt)}</Text>}
                    <Row style={{ gap: 14 }}>
                      <Pressable
                        hitSlop={8}
                        accessibilityLabel={t.hasCccdPhoto ? 'Bỏ đánh dấu đã chụp CCCD' : 'Đánh dấu đã chụp CCCD'}
                        onPress={() => s.toggleCccdPhoto(t.id)}
                      >
                        <IdCard size={16} color={t.hasCccdPhoto ? C.emerald600 : C.slate400} />
                      </Pressable>
                      <Pressable
                        hitSlop={8}
                        accessibilityLabel={`Xóa khách ${t.name}`}
                        onPress={() =>
                          Alert.alert('Xóa khách?', `Xóa khách ${t.name} (phòng ${t.roomCode})?`, [
                            { text: 'Huỷ', style: 'cancel' },
                            { text: 'Xóa', style: 'destructive', onPress: () => s.deleteTenant(t.id) },
                          ])
                        }
                      >
                        <Trash2 size={16} color={C.slate400} />
                      </Pressable>
                    </Row>
                  </View>
                </ListRow>
              );
            })}
          </Card>
        </>
      ) : (
        <>
          <Kpi icon={Car} iconBg={C.blue50} iconColor={C.blue600} label="Xe đang gửi" value={String(s.vehicles.length)} />
          <Card style={{ padding: 0 }}>
            {vehicles.map((v, i) => (
              <ListRow key={v.id} first={i === 0}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate900 }}>{v.plate}</Text>
                  <Text style={{ fontSize: 12, color: C.slate800 }}>{v.ownerName}</Text>
                  <Text style={T.xxs}>
                    {v.phone} · {v.vehicleType}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.blue600 }}>{v.roomCode}</Text>
              </ListRow>
            ))}
          </Card>
        </>
      )}
    </View>
  );
}

export function Contracts() {
  const s = useStore();
  const [filter, setFilter] = useState('active');
  const active = s.contracts.filter((c) => c.status === 'active');
  const ended = s.contracts.filter((c) => c.status === 'ended');
  const terminated = s.contracts.filter((c) => c.status === 'terminated');
  const expiring = active.filter((c) => c.daysRemaining <= 60);
  const debtRooms = new Set(s.allUnpaidInvoices.map((i) => i.roomCode));
  const debt = active.filter((c) => debtRooms.has(c.roomCode));
  const shown = s.contracts.filter((c) => {
    if (filter === 'expiring') return c.status === 'active' && c.daysRemaining <= 60;
    if (filter === 'debt') return debt.includes(c);
    if (filter === 'terminated') return c.status === 'terminated';
    if (filter === 'ended') return c.status === 'ended';
    return c.status === 'active';
  });

  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 12 }}>
        <View>
          <Text style={T.h1}>Hợp đồng</Text>
          <Text style={T.sub}>
            {active.length} / {s.contracts.length} hợp đồng
          </Text>
        </View>
        {s.canViewReports && (
          <Btn icon={Plus} label="Tạo hợp đồng mới" style={{ alignSelf: 'flex-start' }} onPress={() => s.setModal({ kind: 'contract', roomCode: s.vacantRooms[0]?.code })} />
        )}
      </View>
      <ChipRow>
        {[
          { id: 'expiring', label: 'Hết hạn trong 60 ngày', count: expiring.length, dot: C.amber500 },
          { id: 'debt', label: 'Còn nợ', count: debt.length, dot: C.rose500 },
          { id: 'active', label: 'Còn hiệu lực', count: active.length },
          { id: 'ended', label: 'Đã kết thúc', count: ended.length },
          { id: 'terminated', label: 'Đã thanh lý', count: terminated.length },
        ].map((p) => (
          <Chip key={p.id} label={p.label} count={p.count} dot={p.dot} active={filter === p.id} onPress={() => setFilter(p.id)} />
        ))}
      </ChipRow>
      <View style={{ gap: 12 }}>
        <Kpi icon={FileText} iconBg={C.blue50} iconColor={C.blue600} label="Hợp đồng đang hiệu lực" value={String(active.length)} />
        <Kpi icon={Wallet} iconBg={C.emerald50} iconColor={C.emerald600} label="Tổng tiền thuê mỗi tháng" value={formatVND(s.totalMonthlyContractRent)} />
        <Kpi icon={AlertTriangle} iconBg={C.amber50} iconColor={C.amber600} label="Sắp hết hạn / quá hạn" value={String(expiring.length)} />
      </View>
      <Card style={{ padding: 0 }}>
        {shown.map((c, i) => (
          <ListRow key={c.id} first={i === 0}>
            <View style={{ flex: 1, gap: 4 }}>
              <Row style={{ gap: 8, alignItems: 'baseline' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>{c.roomCode}</Text>
                <Text style={{ fontSize: 12, color: C.slate700, flex: 1 }} numberOfLines={1}>
                  {c.tenantName}
                </Text>
              </Row>
              <Text style={T.xxs}>
                {c.code} · {c.startDate} → {c.endDate}
              </Text>
              {c.status === 'terminated' ? (
                <Text style={T.xxs}>Đã thanh lý ({c.moveOutDate})</Text>
              ) : (
                <Text style={{ fontSize: 11, color: c.daysRemaining <= 60 ? C.amber700 : C.slate500, fontWeight: c.daysRemaining <= 60 ? '600' : '400' }}>
                  Còn {c.daysRemaining} ngày
                </Text>
              )}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: C.slate900 }]}>{formatVND(c.rentAmount)}</Text>
              <Text style={[T.xxs, T.num]}>Cọc {formatVND(c.depositAmount)}</Text>
              {c.status === 'active' && s.canViewReports && <Btn small tone="danger" label="Trả phòng" onPress={() => s.setModal({ kind: 'moveOut', contract: c })} />}
            </View>
          </ListRow>
        ))}
      </Card>
    </View>
  );
}
