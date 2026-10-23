import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertTriangle, LayoutGrid, Pencil, Plus, Wallet } from 'lucide-react-native';
import { useStore } from '../lib/store';
import { useOpen } from '../lib/nav';
import { formatVND } from '../lib/shared';
import { C } from '../lib/theme';
import { Badge, Between, Btn, Card, Chip, ChipRow, Kpi, Row, SubTabs, T } from '../lib/ui';

export function Rooms() {
  const s = useStore();
  const open = useOpen();
  const { propertyRooms, occupiedRooms, vacantRooms, maintenanceRooms } = s;
  const [view, setView] = useState<'floor' | 'list'>('floor');
  const [filter, setFilter] = useState('all');

  const filtered = propertyRooms.filter((r) => filter === 'all' || r.status === filter);
  const floors = [...new Set(propertyRooms.map((r) => r.floor))].sort((a, b) => a - b);
  const pills = [
    { id: 'all', label: 'Tất cả', count: propertyRooms.length, dot: '' },
    { id: 'vacant', label: 'Trống', count: vacantRooms.length, dot: C.emerald500 },
    { id: 'occupied', label: 'Đã thuê', count: occupiedRooms.length, dot: C.slate600 },
    { id: 'moving_in', label: 'Sắp vào ở', count: 0, dot: C.blue500 },
    { id: 'deposited', label: 'Đặt cọc', count: 0, dot: C.amber600 },
    { id: 'maintenance', label: 'Đang sửa', count: maintenanceRooms.length, dot: C.rose500 },
  ];

  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 12 }}>
        <View>
          <Text style={T.h1}>Phòng</Text>
          <Text style={T.sub}>
            {s.currentProperty.name} · {propertyRooms.length} phòng, {occupiedRooms.length} đang thuê, {vacantRooms.length} trống
          </Text>
        </View>
        {s.canViewReports && (
        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
          <Btn tone="green" icon={Plus} label="Thêm phòng" onPress={() => s.setModal({ kind: 'addRoom' })} />
          <Btn
            tone="soft"
            icon={Pencil}
            label="Điều chỉnh giá thuê phòng"
            disabled={propertyRooms.length === 0}
            onPress={() => s.setModal({ kind: 'pricing', roomCode: propertyRooms[0]?.code || 'P101', bulk: true })}
          />
          <Btn
            icon={Plus}
            label="Tạo hợp đồng cho phòng trống"
            disabled={vacantRooms.length === 0}
            onPress={() => s.setModal({ kind: 'contract', roomCode: vacantRooms[0]?.code })}
          />
        </Row>
        )}
      </View>

      <View style={{ gap: 12 }}>
        <SubTabs
          tabs={[
            { id: 'floor', label: 'Cơ sở' },
            { id: 'list', label: 'Tất cả phòng' },
          ]}
          value={view}
          onChange={setView}
        />
        <ChipRow>
          {pills.map((p) => (
            <Chip key={p.id} label={p.label} count={p.count} dot={p.dot || undefined} active={filter === p.id} onPress={() => setFilter(p.id)} />
          ))}
        </ChipRow>
      </View>

      <View style={{ gap: 12 }}>
        <Kpi icon={LayoutGrid} iconBg={C.blue50} iconColor={C.blue600} label={`Lấp đầy (${occupiedRooms.length}/${propertyRooms.length} phòng)`} value={`${s.occupancyRate}%`} />
        <Kpi icon={Wallet} iconBg={C.emerald50} iconColor={C.emerald600} label="Tiền thuê/tháng theo hợp đồng" value={formatVND(s.totalMonthlyContractRent)} />
        <Kpi
          icon={AlertTriangle}
          iconBg={C.amber50}
          iconColor={C.amber600}
          label={`${vacantRooms.length} phòng trống - hụt mỗi tháng`}
          value={formatVND(s.monthlyVacancyLoss)}
          style={{ borderColor: C.amber200 }}
        />
      </View>

      {propertyRooms.length === 0 ? (
        <Card style={{ gap: 12, alignItems: 'center', borderStyle: 'dashed', borderColor: C.slate300 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: C.slate900 }}>{s.currentProperty.name} chưa có phòng nào</Text>
          <Text style={[T.xs, { color: C.slate500, textAlign: 'center' }]}>Thêm phòng trước, sau đó lập hợp đồng và ghi điện nước.</Text>
          {s.canViewReports && <Btn icon={Plus} label="Thêm phòng đầu tiên" onPress={() => s.setModal({ kind: 'addRoom' })} />}
        </Card>
      ) : view === 'floor' ? (
        <Card style={{ gap: 20 }}>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
            {[
              [C.emerald500, 'Trống'],
              [C.slate500, 'Đã thuê'],
              [C.blue600, 'Sắp vào ở'],
              [C.amber600, 'Đặt cọc'],
              [C.rose600, 'Đang sửa chữa'],
            ].map(([c, l]) => (
              <Row key={l} style={{ gap: 6 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c }} />
                <Text style={T.xs}>{l}</Text>
              </Row>
            ))}
          </View>
          <Text style={[T.xxs, { color: C.slate400 }]}>💡 Bấm Sửa giá trên từng phòng để điều chỉnh mức giá thuê riêng</Text>

          {floors.map((floor) => {
            const floorRooms = filtered.filter((r) => r.floor === floor);
            if (floorRooms.length === 0) return null;
            return (
              <View key={floor} style={{ gap: 10 }}>
                <Between>
                  <Text style={{ fontSize: 11, fontWeight: '700', letterSpacing: 1, color: C.slate400 }}>TẦNG {floor}</Text>
                  <Text style={[T.xxs, T.num, { color: C.slate400 }]}>
                    {floorRooms.filter((r) => r.status === 'occupied').length}/{floorRooms.length} phòng đang thuê
                  </Text>
                </Between>
                {floorRooms.map((room) => {
                  const isVacant = room.status === 'vacant';
                  const isMaint = room.status === 'maintenance';
                  return (
                    <Pressable
                      key={room.id}
                      onPress={() => {
                        if (isVacant) s.setModal({ kind: 'contract', roomCode: room.code });
                        else if (isMaint) s.setModal({ kind: 'meter', roomCode: room.code });
                        else {
                          s.setInvoiceMonth(s.nextMonth);
                          open('invoices');
                        }
                      }}
                      style={({ pressed }) => [
                        {
                          borderRadius: 16,
                          padding: 16,
                          borderWidth: 1,
                          opacity: pressed ? 0.85 : 1,
                        },
                        isVacant
                          ? { backgroundColor: '#ECFDF580', borderColor: C.emerald300 }
                          : {
                              backgroundColor: C.white,
                              borderColor: C.slate200,
                              borderLeftWidth: 4,
                              borderLeftColor: isMaint ? C.rose500 : C.blue600,
                            },
                      ]}
                    >
                      <Between>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>{room.code}</Text>
                        {isVacant ? (
                          <Badge label="Còn trống" bg={C.emerald600} fg={C.white} />
                        ) : isMaint ? (
                          <Badge label="Đang sửa" bg={C.rose50} fg={C.rose700} />
                        ) : (
                          <Badge label="Đã thuê" bg={C.blue50} fg={C.blue700} />
                        )}
                      </Between>
                      <Between style={{ marginTop: 8 }}>
                        <Text style={[T.num, { fontSize: 12, fontWeight: '800', color: C.slate900 }]}>
                          {formatVND(room.price)}
                          <Text style={{ fontSize: 10, fontWeight: '400', color: C.slate400 }}>/th</Text>
                        </Text>
                        <Pressable
                          accessibilityLabel={`Điều chỉnh giá thuê phòng ${room.code}`}
                          onPress={() => s.setModal({ kind: 'pricing', roomCode: room.code })}
                          hitSlop={6}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200 }}
                        >
                          <Pencil size={10} color={C.blue600} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: C.blue600 }}>Sửa giá</Text>
                        </Pressable>
                      </Between>
                      <Text style={{ fontSize: 12, fontWeight: '500', color: C.slate700, marginTop: 6 }} numberOfLines={1}>
                        {isVacant ? 'Bấm để lập hợp đồng' : isMaint ? 'Đang bảo trì thiết bị' : room.tenantName}
                      </Text>
                      <Between style={{ marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: C.slate100 }}>
                        <Row style={{ gap: 6 }}>
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: isVacant ? C.emerald500 : isMaint ? C.rose500 : C.blue600 }} />
                          <Text style={[T.xxs, T.num]}>
                            {isVacant ? 'Trống' : isMaint ? 'Đang sửa chữa' : `${room.vehicleCount} xe · Cọc ${Math.round(room.deposit / 1000)}k`}
                          </Text>
                        </Row>
                        <Text style={{ fontSize: 10, color: C.slate400 }}>
                          ⚡{room.elecIndex} · 💧{room.waterIndex}
                        </Text>
                      </Between>
                    </Pressable>
                  );
                })}
              </View>
            );
          })}
        </Card>
      ) : (
        <Card style={{ padding: 0 }}>
          {filtered.map((r, i) => (
            <View key={r.id} style={{ padding: 14, borderTopWidth: i ? 1 : 0, borderTopColor: C.slate100, flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 4 }}>
                <Row style={{ gap: 8 }}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>{r.code}</Text>
                  <Text style={T.xxs}>Tầng {r.floor}</Text>
                  {r.status === 'occupied' ? (
                    <Badge label="Đã thuê" bg={C.blue50} fg={C.blue700} />
                  ) : r.status === 'vacant' ? (
                    <Badge label="Còn trống" bg={C.emerald50} fg={C.emerald700} />
                  ) : (
                    <Badge label="Đang sửa" bg={C.rose50} fg={C.rose700} />
                  )}
                </Row>
                <Text style={{ fontSize: 12, fontWeight: '500', color: C.slate800 }}>{r.tenantName || '—'}</Text>
                <Text style={T.xxs}>
                  Cọc {formatVND(r.deposit)} · Rác + Internet {formatVND(r.trashFee + r.internetFee)}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <Text style={[T.num, { fontSize: 12, fontWeight: '800', color: C.blue700 }]}>{formatVND(r.price)}</Text>
                <Btn small tone="soft" icon={Pencil} label="Sửa giá" onPress={() => s.setModal({ kind: 'pricing', roomCode: r.code })} />
              </View>
            </View>
          ))}
        </Card>
      )}
    </View>
  );
}
