import React from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Polygon, Polyline, Rect, Stop, Text as SvgText } from 'react-native-svg';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  ChevronRight,
  Clock,
  Droplets,
  LayoutGrid,
  Pencil,
  Plus,
  Receipt,
  Send,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useStore } from '../lib/store';
import { formatVND, parseDateVN, summarizeProperties } from '../lib/shared';
import { C } from '../lib/theme';
import { Badge, Bar, Between, Btn, Card, Divider, IconBox, Row, T } from '../lib/ui';

export function Overview() {
  const s = useStore();
  const {
    invoices,
    curMonth,
    nextMonth,
    periodLabel,
    today,
    propertyRooms,
    occupiedRooms,
    vacantRooms,
    maintenanceRooms,
    monthlyChart,
  } = s;

  const monthInv = invoices.filter((i) => i.billingMonth === curMonth && i.status !== 'draft');
  const receivable = monthInv.reduce((x, i) => x + i.totalAmount, 0);
  const paid = monthInv.reduce((x, i) => x + i.paidAmount, 0);
  const collectionPct = receivable > 0 ? Math.min(100, Math.round((paid / receivable) * 100)) : 0;

  const weekday = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][
    (parseDateVN(today) ?? new Date()).getDay()
  ];
  const hour = new Date().getHours();
  const greeting = hour < 11 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';

  const rent = monthInv.reduce((x, i) => x + i.rentAmount, 0);
  const elec = monthInv.reduce((x, i) => x + i.elecAmount, 0);
  const water = monthInv.reduce((x, i) => x + i.waterAmount, 0);
  const service = monthInv.reduce((x, i) => x + i.trashAmount + i.internetAmount + i.vehicleAmount, 0);
  const total = Math.max(1, rent + elec + water + service);
  const pct = (n: number) => Math.round((n / total) * 100);
  const segments = [
    { label: 'Tiền thuê phòng', amount: rent, pct: pct(rent), color: C.blue600 },
    { label: 'Tiền điện', amount: elec, pct: pct(elec), color: C.amber500 },
    { label: 'Tiền nước', amount: water, pct: pct(water), color: C.cyan500 },
    {
      label: 'Rác · Wifi · Gửi xe',
      amount: service,
      pct: service === 0 ? 0 : Math.max(0, 100 - pct(rent) - pct(elec) - pct(water)),
      color: C.emerald500,
    },
  ];

  const maxChart = Math.max(1, ...monthlyChart.map((d) => Math.max(d.income, d.expense, d.profit)));

  const todos: { id: string; border: string; icon: LucideIcon; iconColor: string; iconBg: string; title: string; subtitle: string; action: string; onPress: () => void }[] = [
    {
      id: '1',
      border: C.amber400,
      icon: Droplets,
      iconColor: C.amber500,
      iconBg: C.amber50,
      title: `${maintenanceRooms.length} phòng chưa ghi chỉ số tháng này`,
      subtitle: maintenanceRooms.length > 0 ? maintenanceRooms.map((r) => r.code).join(', ') : 'Đã ghi đủ chỉ số các phòng',
      action: 'Ghi chỉ số',
      onPress: () => s.setModal({ kind: 'meter', roomCode: maintenanceRooms[0]?.code || propertyRooms[0]?.code }),
    },
    {
      id: '2',
      border: C.blue500,
      icon: Receipt,
      iconColor: C.blue600,
      iconBg: C.blue50,
      title: `${s.draftInvoices.length} phòng chưa lập hóa đơn tháng này`,
      subtitle: 'Phòng đã ghi chỉ số sẽ tính ra tiền ngay.',
      action: 'Lập hóa đơn',
      onPress: () => {
        s.setInvoiceMonth(curMonth);
        s.setActiveTab('invoices');
      },
    },
    {
      id: '3',
      border: C.blue500,
      icon: Send,
      iconColor: C.blue600,
      iconBg: C.blue50,
      title: `${s.unsentInvoices.length} hóa đơn chưa gửi cho khách`,
      subtitle: 'Sao chép tin nhắn kèm mã QR rồi gửi qua Zalo.',
      action: 'Gửi',
      onPress: () => {
        s.setInvoiceMonth(nextMonth);
        s.setActiveTab('invoices');
      },
    },
    {
      id: '4',
      border: C.rose500,
      icon: AlertTriangle,
      iconColor: C.rose500,
      iconBg: C.rose50,
      title: `${s.overdueInvoices.length} hóa đơn quá hạn - ${formatVND(s.overdueTotalAmount)}`,
      subtitle: 'Đã qua hạn thanh toán mà chưa thu đủ.',
      action: 'Xem công nợ',
      onPress: () => s.setActiveTab('finance-debts'),
    },
    {
      id: '5',
      border: C.amber400,
      icon: Clock,
      iconColor: C.amber600,
      iconBg: C.amber50,
      title: `${s.dueSoonInvoices.length} hóa đơn tới hạn trong 5 ngày - ${formatVND(s.dueSoonTotalAmount)}`,
      subtitle: 'Nhắc trước để khách kịp chuẩn bị, đỡ phải đòi khi đã quá hạn.',
      action: 'Thu nợ',
      onPress: () => {
        s.setInvoiceMonth(curMonth);
        s.setActiveTab('invoices');
      },
    },
    {
      id: '6',
      border: C.amber400,
      icon: Wallet,
      iconColor: C.amber600,
      iconBg: C.amber50,
      title: `${s.pendingRefundContracts.length} khoản cọc chờ trả lại khách - ${formatVND(s.pendingRefundTotal)}`,
      subtitle: s.pendingRefundContracts[0]
        ? `${s.pendingRefundContracts[0].roomCode} (${s.pendingRefundContracts[0].tenantName})`
        : 'Đã hoàn trả toàn bộ cọc',
      action: 'Xem',
      onPress: () => s.setActiveTab('finance-deposits'),
    },
    {
      id: '7',
      border: C.blue500,
      icon: LayoutGrid,
      iconColor: C.blue600,
      iconBg: C.blue50,
      title: `${vacantRooms.length} phòng đang trống`,
      subtitle: vacantRooms.map((r) => r.code).join(', ') || 'Không có phòng trống',
      action: 'Xem sơ đồ',
      onPress: () => s.setActiveTab('rooms'),
    },
  ];

  const quickCollect = [...s.allUnpaidInvoices].sort((a, b) => a.billingMonth.localeCompare(b.billingMonth))[0];
  const summary = summarizeProperties({
    properties: s.properties,
    rooms: s.rooms,
    invoices: s.allInvoices,
    transactions: s.allTransactions,
    curMonth,
  });

  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 12 }}>
        <View>
          <Row style={{ gap: 8, flexWrap: 'wrap' }}>
            <Text style={T.h1}>Tổng quan vận hành</Text>
            <Badge label={s.currentProperty.name} bg={C.blue50} fg={C.blue700} />
          </Row>
          <Text style={T.sub}>
            {greeting} · {weekday}, ngày {today}
          </Text>
        </View>
        <Row style={{ gap: 8, flexWrap: 'wrap' }}>
          <Btn tone="outline" small icon={Droplets} label="Ghi điện nước" onPress={() => s.setModal({ kind: 'meter', roomCode: occupiedRooms[0]?.code })} />
          {s.canViewReports && propertyRooms.length > 0 && (
            <Btn tone="outline" small icon={Pencil} label="Bảng giá phòng" onPress={() => s.setModal({ kind: 'pricing', roomCode: propertyRooms[0].code, bulk: true })} />
          )}
          {s.canViewReports && (
            <Btn small icon={Plus} label="Lập hợp đồng" onPress={() => s.setModal({ kind: 'contract', roomCode: vacantRooms[0]?.code })} />
          )}
        </Row>
      </View>

      {/* Phòng vừa báo "Tôi đã chuyển" (trang hóa đơn người thuê) */}
      {s.paymentReports.length > 0 && (
        <View style={{ backgroundColor: C.amber50, borderWidth: 1, borderColor: C.amber200, borderRadius: 16, padding: 16, gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.amber900 }}>
            Phòng vừa báo đã chuyển tiền — đối chiếu biến động số dư của bạn rồi bấm Xác nhận
          </Text>
          {s.paymentReports.map((r) => {
            const inv = invoices.find((i) => i.code === r.invoice_code);
            return (
              <View key={r.id} style={{ backgroundColor: C.white, borderRadius: 12, borderWidth: 1, borderColor: C.amber100, padding: 10, gap: 8 }}>
                <Text style={{ fontSize: 12, color: C.slate700 }}>
                  <Text style={{ fontWeight: '700' }}>{r.room_code}</Text> · {r.invoice_code} · <Text style={[T.num, { fontWeight: '700' }]}>{formatVND(r.amount)}</Text>
                  {r.payer_note ? <Text style={{ color: C.slate500 }}> · {r.payer_note}</Text> : null}
                  <Text style={{ color: C.slate400 }}> · {new Date(r.created_at).toLocaleString('vi-VN')}</Text>
                </Text>
                <Row style={{ gap: 6 }}>
                  <Btn
                    small
                    label="Xác nhận"
                    disabled={!inv}
                    style={{ backgroundColor: C.emerald600, borderColor: C.emerald600 }}
                    onPress={() => inv && s.setModal({ kind: 'collect', invoice: inv, report: { id: r.id, amount: r.amount } })}
                  />
                  <Btn small tone="outline" label="Bỏ qua" onPress={() => s.setReportStatus(r.id, 'dismissed')} />
                </Row>
              </View>
            );
          })}
        </View>
      )}

      {s.properties.length > 1 && (
        <Card style={{ padding: 16 }}>
          <Text style={[T.xs, T.bold, { color: C.slate800, marginBottom: 8 }]}>Tất cả khu · kỳ {periodLabel}</Text>
          <Between style={{ paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
            <Text style={[T.xs, { color: C.slate400, flex: 1 }]}>Khu</Text>
            <Text style={[T.xs, { color: C.slate400, width: 70, textAlign: 'right' }]}>Đang thuê</Text>
            <Text style={[T.xs, { color: C.slate400, width: 110, textAlign: 'right' }]}>Còn nợ</Text>
          </Between>
          {summary.map((row) => {
            const cur = row.id === s.currentProperty.id;
            return (
              <Pressable key={row.id} onPress={() => s.setSelectedPropertyId(row.id)}>
                <Between style={{ paddingVertical: 7 }}>
                  <Text style={[T.xs, { flex: 1, color: cur ? C.blue700 : C.slate700, fontWeight: cur ? '700' : '400' }]}>{row.name}</Text>
                  <Text style={[T.xs, T.num, { width: 70, textAlign: 'right', color: cur ? C.blue700 : C.slate700, fontWeight: cur ? '700' : '400' }]}>
                    {row.occupied}/{row.rooms}
                  </Text>
                  <Text style={[T.xs, T.num, { width: 110, textAlign: 'right', color: row.debt > 0 ? C.rose600 : C.emerald600, fontWeight: cur ? '700' : '400' }]}>
                    {formatVND(row.debt)}
                  </Text>
                </Between>
              </Pressable>
            );
          })}
        </Card>
      )}

      {/* 4 thẻ KPI */}
      <View style={{ gap: 12 }}>
        <Card onPress={() => s.setActiveTab('rooms')} style={{ gap: 12 }}>
          <Between>
            <Row style={{ gap: 8, flex: 1 }}>
              <IconBox icon={LayoutGrid} bg={C.blue50} color={C.blue600} />
              <Text style={[T.xs, { fontWeight: '600', color: C.slate700 }]}>
                Tỷ lệ lấp đầy ({occupiedRooms.length}/{propertyRooms.length} phòng)
              </Text>
            </Row>
            <Badge label={`${vacantRooms.length} trống`} bg={C.blue50} fg={C.blue700} />
          </Between>
          <Between style={{ alignItems: 'flex-end' }}>
            <View>
              <Text style={T.kpi}>{s.occupancyRate}%</Text>
              <Text style={[T.xxs, { color: C.slate400 }]}>Giá trị HĐ: {formatVND(s.totalMonthlyContractRent)}/tháng</Text>
            </View>
            <Row style={{ gap: 2 }}>
              {propertyRooms.slice(0, 12).map((r) => (
                <View
                  key={r.id}
                  style={{
                    width: 6,
                    height: 24,
                    borderRadius: 3,
                    backgroundColor: r.status === 'occupied' ? C.blue600 : r.status === 'vacant' ? C.emerald400 : C.rose400,
                  }}
                />
              ))}
            </Row>
          </Between>
          <Bar pct={s.occupancyRate} color={C.blue600} />
        </Card>

        <Card onPress={() => s.setActiveTab('finance-cashbook')} style={{ gap: 12 }}>
          <Between>
            <Row style={{ gap: 8 }}>
              <IconBox icon={ArrowUpRight} bg={C.emerald50} color={C.emerald600} />
              <Text style={[T.xs, { fontWeight: '600', color: C.slate700 }]}>Thu hôm nay</Text>
            </Row>
            <Badge label="Khớp VietQR" bg={C.emerald50} fg={C.emerald700} />
          </Between>
          <Between style={{ alignItems: 'flex-end' }}>
            <View>
              <Text style={[T.kpi, { color: C.emerald600 }]}>{formatVND(s.collectedToday)}</Text>
              <Text style={[T.xxs, { color: C.slate400 }]}>
                Đã thu kỳ 10: {formatVND(paid)} ({collectionPct}%)
              </Text>
            </View>
            <Svg width={64} height={28} viewBox="0 0 64 28">
              <Polyline fill="none" stroke={C.emerald500} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" points="2,22 16,18 30,20 44,10 62,4" />
            </Svg>
          </Between>
          <Bar pct={collectionPct} color={C.emerald500} />
        </Card>

        {s.canViewReports && (
        <Card onPress={() => s.setActiveTab('reports')} style={{ gap: 12 }}>
          <Between>
            <Row style={{ gap: 8 }}>
              <IconBox icon={TrendingUp} bg={C.indigo50} color={C.indigo600} />
              <Text style={[T.xs, { fontWeight: '600', color: C.slate700 }]}>Lợi nhuận tháng này</Text>
            </Row>
            <Badge label={`Kỳ ${periodLabel}`} bg={C.indigo50} fg={C.indigo700} />
          </Between>
          <Between style={{ alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Text style={[T.kpi, { color: s.currentMonthProfit < 0 ? C.rose600 : C.slate900 }]}>{formatVND(s.currentMonthProfit)}</Text>
              <Text style={[T.xxs, { color: C.slate400 }]}>Thực thu trừ chi phí vận hành & hoàn cọc</Text>
            </View>
            <Row style={{ gap: 4, height: 28, alignItems: 'flex-end' }}>
              {monthlyChart.map((m, i) => (
                <View
                  key={m.month}
                  style={{
                    width: 8,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                    height: `${Math.max(25, Math.round((m.profit / maxChart) * 100))}%`,
                    backgroundColor: i === monthlyChart.length - 1 ? C.indigo600 : C.indigo200,
                  }}
                />
              ))}
            </Row>
          </Between>
          <Bar pct={80} color={C.indigo600} />
        </Card>
        )}

        <Card onPress={() => s.setActiveTab('finance-debts')} style={{ gap: 12 }}>
          <Between>
            <Row style={{ gap: 8 }}>
              <IconBox icon={AlertTriangle} bg={C.rose50} color={C.rose600} />
              <Text style={[T.xs, { fontWeight: '600', color: C.slate700 }]}>Công nợ cần thu</Text>
            </Row>
            <Badge label={`${s.overdueInvoices.length} quá hạn`} bg={C.rose50} fg={C.rose700} />
          </Between>
          <View>
            <Text style={[T.kpi, { color: C.rose600 }]}>{formatVND(s.overdueTotalAmount + s.dueSoonTotalAmount)}</Text>
            <Text style={[T.xxs, T.num, { color: C.slate400 }]}>
              Quá hạn: {formatVND(s.overdueTotalAmount)} · Tới hạn: {formatVND(s.dueSoonTotalAmount)}
            </Text>
          </View>
          <View style={{ height: 6, borderRadius: 3, overflow: 'hidden', flexDirection: 'row', backgroundColor: C.amber400 }}>
            <View
              style={{
                backgroundColor: C.rose500,
                width: `${
                  s.overdueTotalAmount + s.dueSoonTotalAmount > 0
                    ? Math.round((s.overdueTotalAmount / (s.overdueTotalAmount + s.dueSoonTotalAmount)) * 100)
                    : 0
                }%`,
              }}
            />
          </View>
        </Card>
      </View>

      {/* Biểu đồ dòng tiền & lợi nhuận */}
      <Card style={{ gap: 12 }}>
        <View>
          <Row style={{ gap: 8 }}>
            <BarChart3 size={16} color={C.blue600} />
            <Text style={[T.h2, { flex: 1 }]}>Biểu đồ Dòng tiền & Lợi nhuận qua các kỳ</Text>
          </Row>
          <Text style={[T.xxs, { marginTop: 2 }]}>Thu · Chi · Lợi nhuận ròng 5 kỳ gần nhất</Text>
        </View>
        <Row style={{ gap: 12 }}>
          <Legend color={C.blue600} label="Doanh thu" />
          <Legend color={C.amber500} label="Chi phí" />
          <Legend color={C.emerald500} label="Lợi nhuận" round />
        </Row>
        <CashflowChart data={monthlyChart} max={maxChart} />

        <View style={{ paddingTop: 16, borderTopWidth: 1, borderTopColor: C.slate100, gap: 10 }}>
          <Between>
            <Text style={[T.xs, T.bold, { color: C.slate800, flex: 1 }]}>Cơ cấu khoản thu hóa đơn kỳ {periodLabel}</Text>
            <Text style={[T.xs, T.num, { fontWeight: '600', color: C.slate500 }]}>{formatVND(receivable)}</Text>
          </Between>
          <View style={{ height: 10, borderRadius: 5, overflow: 'hidden', flexDirection: 'row', gap: 2, backgroundColor: C.slate100 }}>
            {segments.map((seg) => (
              <View key={seg.label} style={{ width: `${Math.max(4, seg.pct)}%`, backgroundColor: seg.color }} />
            ))}
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {segments.map((seg) => (
              <View key={seg.label} style={{ width: '48.5%', padding: 8, borderRadius: 12, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate100 }}>
                <Between style={{ gap: 4 }}>
                  <Row style={{ gap: 6, flex: 1 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: seg.color }} />
                    <Text style={[T.xxs, { color: C.slate600, fontWeight: '500', flex: 1 }]} numberOfLines={1}>
                      {seg.label}
                    </Text>
                  </Row>
                  <Text style={[T.xxs, T.bold]}>{seg.pct}%</Text>
                </Between>
                <Text style={[T.num, { fontSize: 11, fontWeight: '800', color: C.slate900, marginTop: 2 }]}>{formatVND(seg.amount)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Card>

      {/* Biểu đồ tròn trạng thái phòng + bản đồ nhanh */}
      <Card style={{ gap: 16 }}>
        <View>
          <Between>
            <Text style={T.h2}>Biểu đồ Trạng thái phòng</Text>
            <Pressable onPress={() => s.setActiveTab('rooms')}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: C.blue600 }}>Mở sơ đồ phòng →</Text>
            </Pressable>
          </Between>
          <Text style={[T.xxs, { marginTop: 2 }]}>
            Phân bổ {propertyRooms.length} phòng tại {s.currentProperty.name}
          </Text>
        </View>
        <Row style={{ gap: 16 }}>
          <Donut occ={occupiedRooms.length} vac={vacantRooms.length} maint={maintenanceRooms.length} total={propertyRooms.length} rate={s.occupancyRate} />
          <View style={{ flex: 1, gap: 8 }}>
            <LegendRow color={C.blue600} bg="#EFF6FF99" border={C.blue100} label="Đã thuê" value={`${occupiedRooms.length} phòng`} fg={C.blue700} />
            <LegendRow color={C.emerald500} bg="#ECFDF599" border={C.emerald100} label="Trống" value={`${vacantRooms.length} phòng`} fg={C.emerald700} />
            <LegendRow color={C.rose500} bg="#FFF1F299" border={C.rose100} label="Đang sửa chữa" value={`${maintenanceRooms.length} phòng`} fg={C.rose700} />
          </View>
        </Row>
        <View style={{ paddingTop: 12, borderTopWidth: 1, borderTopColor: C.slate100, gap: 8 }}>
          <Text style={[T.xxs, { fontWeight: '600', color: C.slate700 }]}>Bản đồ nhanh {propertyRooms.length} phòng (Bấm để xem)</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {propertyRooms.map((r) => {
              const hasDebt = invoices.some((inv) => inv.roomCode === r.code && inv.status !== 'draft' && inv.totalAmount - inv.paidAmount > 0);
              const tone =
                r.status === 'occupied'
                  ? { bg: '#EFF6FF80', border: C.blue200 }
                  : r.status === 'vacant'
                    ? { bg: '#ECFDF5B3', border: C.emerald200 }
                    : { bg: '#FFF1F2B3', border: C.rose200 };
              return (
                <Pressable
                  key={r.id}
                  onPress={() => s.setActiveTab('rooms')}
                  style={{ width: '23.3%', padding: 8, borderRadius: 12, borderWidth: 1, backgroundColor: tone.bg, borderColor: tone.border }}
                >
                  <Between style={{ gap: 2 }}>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: C.slate900 }}>{r.code}</Text>
                    {hasDebt && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.rose500 }} />}
                  </Between>
                  <Text style={{ fontSize: 10, color: C.slate500, marginTop: 2 }} numberOfLines={1}>
                    {r.tenantName ? r.tenantName.split(' ').slice(-2).join(' ') : r.status === 'maintenance' ? 'Đang sửa' : 'Phòng trống'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Card>

      {/* Việc cần làm hôm nay */}
      <Card>
        <Between style={{ marginBottom: 16 }}>
          <Text style={T.h2}>Việc cần làm hôm nay</Text>
          <Badge label="7 việc" bg={C.slate100} fg={C.slate600} />
        </Between>
        <View style={{ gap: 10 }}>
          {todos.map((t) => (
            <Pressable
              key={t.id}
              onPress={t.onPress}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                padding: 14,
                borderRadius: 12,
                backgroundColor: pressed ? C.slate100 : '#F8FAFCB3',
                borderWidth: 1,
                borderColor: C.slate100,
                borderLeftWidth: 4,
                borderLeftColor: t.border,
              })}
            >
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: t.iconBg, alignItems: 'center', justifyContent: 'center' }}>
                <t.icon size={16} color={t.iconColor} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: C.slate900 }]} numberOfLines={1}>
                  {t.title}
                </Text>
                <Text style={[T.xxs, { marginTop: 2 }]} numberOfLines={1}>
                  {t.subtitle}
                </Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: C.white, borderWidth: 1, borderColor: C.slate200 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: C.slate700 }}>{t.action}</Text>
                <ChevronRight size={14} color={C.slate400} />
              </View>
            </Pressable>
          ))}
        </View>
      </Card>

      {/* Tiến độ thu tháng này */}
      <Card style={{ gap: 16 }}>
        <Between>
          <Text style={T.h2}>Tiến độ thu tháng này</Text>
          <Badge label={`Đạt ${collectionPct}%`} bg={C.emerald50} fg={C.emerald700} />
        </Between>
        <View style={{ gap: 10 }}>
          <Line2 label={`Phải thu kỳ ${periodLabel}`} value={formatVND(receivable)} color={C.slate900} />
          <Line2 label="Đã thu trong kỳ" value={formatVND(paid)} color={C.emerald600} />
          <Line2 label="Đã thu hôm nay" value={formatVND(s.collectedToday)} color={C.teal600} />
          <Divider />
          <Line2 label="Còn phải thu" value={formatVND(s.dueSoonTotalAmount)} color={C.rose600} strong />
        </View>
        <Bar pct={collectionPct} color={C.emerald500} height={10} />
        <Btn
          full
          disabled={!quickCollect}
          onPress={() => quickCollect && s.setModal({ kind: 'collect', invoice: quickCollect })}
          label={quickCollect ? `Thu tiền nhanh (${quickCollect.roomCode} · ${quickCollect.code})` : 'Không còn hóa đơn nào cần thu'}
        />
      </Card>

      {/* Hoạt động gần đây */}
      <Card>
        <Between style={{ marginBottom: 8 }}>
          <Text style={T.h2}>Hoạt động gần đây</Text>
          <Pressable onPress={() => s.setActiveTab('finance-cashbook')} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 12, fontWeight: '500', color: C.slate500 }}>Xem sổ thu chi</Text>
            <ChevronRight size={14} color={C.slate500} />
          </Pressable>
        </Between>
        {s.transactions.slice(0, 5).map((tx, i) => (
          <View key={tx.id} style={{ paddingVertical: 10, borderTopWidth: i ? 1 : 0, borderTopColor: C.slate100, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: tx.type === 'income' ? C.emerald50 : tx.category === 'Vệ sinh' ? C.slate100 : C.amber50,
              }}
            >
              {tx.type === 'income' ? <ArrowUpRight size={14} color={C.emerald600} /> : <ArrowDownRight size={14} color={tx.category === 'Vệ sinh' ? C.slate700 : C.amber600} />}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Row style={{ gap: 6 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate900 }} numberOfLines={1}>
                  {tx.category}
                </Text>
                {tx.roomCode ? <Badge label={tx.roomCode} bg={C.slate100} fg={C.slate600} style={{ borderRadius: 4 }} /> : null}
              </Row>
              <Text style={[T.xxs, { marginTop: 2 }]} numberOfLines={1}>
                {tx.date} · {tx.description}
              </Text>
            </View>
            <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: tx.type === 'income' ? C.emerald600 : C.slate900 }]}>
              {formatVND(tx.type === 'income' ? tx.amount : -tx.amount, tx.type === 'income')}
            </Text>
          </View>
        ))}
      </Card>
    </View>
  );
}

function Legend({ color, label, round }: { color: string; label: string; round?: boolean }) {
  return (
    <Row style={{ gap: 6 }}>
      <View style={{ width: 10, height: 10, borderRadius: round ? 5 : 2, backgroundColor: color }} />
      <Text style={{ fontSize: 12, fontWeight: '500', color: C.slate600 }}>{label}</Text>
    </Row>
  );
}

function LegendRow({ color, bg, border, label, value, fg }: { color: string; bg: string; border: string; label: string; value: string; fg: string }) {
  return (
    <Between style={{ padding: 8, borderRadius: 12, backgroundColor: bg, borderWidth: 1, borderColor: border }}>
      <Row style={{ gap: 6 }}>
        <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color }} />
        <Text style={{ fontSize: 12, fontWeight: '600', color: C.slate700 }}>{label}</Text>
      </Row>
      <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: fg }]}>{value}</Text>
    </Between>
  );
}

function Line2({ label, value, color, strong }: { label: string; value: string; color: string; strong?: boolean }) {
  return (
    <Between>
      <Text style={{ fontSize: 12, color: strong ? C.slate600 : C.slate500, fontWeight: strong ? '500' : '400' }}>{label}</Text>
      <Text style={[T.num, { fontSize: 12, fontWeight: strong ? '800' : '700', color }]}>{value}</Text>
    </Between>
  );
}

function Donut({ occ, vac, maint, total, rate }: { occ: number; vac: number; maint: number; total: number; rate: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  const d = Math.max(1, total);
  const occD = (occ / d) * c;
  const vacD = (vac / d) * c;
  const mD = (maint / d) * c;
  return (
    <View style={{ width: 112, height: 112 }}>
      <Svg width={112} height={112} viewBox="0 0 110 110" style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={55} cy={55} r={r} fill="none" stroke={C.slate100} strokeWidth={12} />
        <Circle cx={55} cy={55} r={r} fill="none" stroke={C.blue600} strokeWidth={12} strokeDasharray={`${occD} ${c}`} />
        <Circle cx={55} cy={55} r={r} fill="none" stroke={C.emerald500} strokeWidth={12} strokeDasharray={`${vacD} ${c}`} strokeDashoffset={-occD} />
        <Circle cx={55} cy={55} r={r} fill="none" stroke={C.rose500} strokeWidth={12} strokeDasharray={`${mD} ${c}`} strokeDashoffset={-(occD + vacD)} />
      </Svg>
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[T.num, { fontSize: 18, fontWeight: '800', color: C.slate900 }]}>{rate}%</Text>
        <Text style={{ fontSize: 10, fontWeight: '600', color: C.slate400 }}>Lấp đầy</Text>
      </View>
    </View>
  );
}

// Biểu đồ cột thu/chi + đường lợi nhuận, khung toạ độ thu hẹp cho màn điện thoại
export function CashflowChart({
  data,
  max,
  incomeFill = 'url(#inc)',
  expenseFill = C.amber500,
}: {
  data: { month: string; income: number; expense: number; profit: number }[];
  max: number;
  incomeFill?: string;
  expenseFill?: string;
}) {
  const W = 360;
  const base = 170;
  const h = 140;
  const x0 = 64;
  const step = (W - x0 - 20) / Math.max(1, data.length - 1);
  const xs = data.map((_, i) => x0 + i * step);
  const y = (v: number) => base - (v / max) * h;
  return (
    <Svg width="100%" height={210} viewBox={`0 0 ${W} 205`}>
      <Defs>
        <LinearGradient id="inc" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#2563EB" />
          <Stop offset="100%" stopColor="#3B82F6" stopOpacity={0.85} />
        </LinearGradient>
        <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor="#10B981" stopOpacity={0.22} />
          <Stop offset="100%" stopColor="#10B981" stopOpacity={0.01} />
        </LinearGradient>
      </Defs>
      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
        const yy = base - ratio * h;
        const v = Math.round((max * ratio) / 1000000);
        return (
          <G key={ratio}>
            <Line x1={32} y1={yy} x2={W - 4} y2={yy} stroke={C.slate100} strokeWidth={1} />
            <SvgText x={26} y={yy + 4} textAnchor="end" fontSize={10} fill={C.slate400}>
              {v === 0 ? '0' : `${v}tr`}
            </SvgText>
          </G>
        );
      })}
      <Polygon points={[`${xs[0]},${base}`, ...data.map((p, i) => `${xs[i]},${y(p.profit)}`), `${xs[xs.length - 1]},${base}`].join(' ')} fill="url(#area)" />
      {data.map((p, i) => {
        const incH = (p.income / max) * h;
        const expH = Math.max(4, (p.expense / max) * h);
        return (
          <G key={p.month}>
            <Rect x={xs[i] - 17} y={base - incH} width={15} height={incH} rx={3} fill={incomeFill} />
            <Rect x={xs[i] + 1} y={base - expH} width={13} height={expH} rx={3} fill={expenseFill} />
            <SvgText x={xs[i] - 9} y={base - incH - 5} textAnchor="middle" fontSize={9} fontWeight="700" fill={C.blue700}>
              {(p.income / 1000000).toFixed(1)}tr
            </SvgText>
            <SvgText x={xs[i]} y={190} textAnchor="middle" fontSize={10} fontWeight="600" fill={C.slate600}>
              {p.month}
            </SvgText>
          </G>
        );
      })}
      <Polyline fill="none" stroke={C.emerald500} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" points={data.map((p, i) => `${xs[i]},${y(p.profit)}`).join(' ')} />
      {data.map((p, i) => (
        <Circle key={p.month} cx={xs[i]} cy={y(p.profit)} r={4} fill={C.emerald500} stroke={C.white} strokeWidth={2} />
      ))}
    </Svg>
  );
}
