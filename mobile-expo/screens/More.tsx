import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Share, Text, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight, ChevronRight, Copy, LayoutGrid, RotateCcw, TrendingUp, UserPlus } from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useStore } from '../lib/store';
import { useOpen } from '../lib/nav';
import { formatVND } from '../lib/shared';
import { C } from '../lib/theme';
import { Badge, Bar, Between, Btn, Card, Field, Kpi, Row, Select, T } from '../lib/ui';
import { CashflowChart } from './Overview';

export function Calendar() {
  const s = useStore();
  const open = useOpen();
  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={T.h1}>Lịch vận hành nhà trọ</Text>
        <Text style={T.sub}>Theo dõi lịch ghi điện nước, hạn thu tiền hóa đơn, chốt kỳ theo ngày vào ở và hợp đồng sắp hết hạn.</Text>
      </View>
      {s.calendarEvents.length === 0 && (
        <Card>
          <Text style={[T.xs, { textAlign: 'center', color: C.slate500 }]}>
            Chưa có việc nào trong tháng này. Lịch tự hiện khi có phòng đang thuê, hóa đơn và hợp đồng.
          </Text>
        </Card>
      )}
      {s.calendarEvents.map((ev) => (
        <Card key={ev.id} onPress={() => open(ev.actionTab)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 14 }}>
          <View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: C.blue50, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: C.blue700 }}>{ev.dayOfMonth}</Text>
            <Text style={{ fontSize: 10, fontWeight: '500', color: C.blue700 }}>{ev.monthYear}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate900 }}>{ev.title}</Text>
            <Text style={[T.xxs, { marginTop: 4 }]}>{ev.subtitle}</Text>
          </View>
          <ChevronRight size={16} color={C.slate400} style={{ marginTop: 4 }} />
        </Card>
      ))}
    </View>
  );
}

export function Reports() {
  const s = useStore();
  const tx = s.transactions;
  const revenue = tx.filter((t) => t.type === 'income' && t.category === 'Thu tiền hóa đơn').reduce((x, t) => x + t.amount, 0);
  const expense = tx.filter((t) => t.type === 'expense').reduce((x, t) => x + t.amount, 0);
  const profit = revenue - expense;
  const invoiced = s.invoices.filter((i) => i.status !== 'draft').reduce((x, i) => x + i.totalAmount, 0);
  const depositIncome = tx.filter((t) => t.type === 'income' && t.category === 'Thu tiền cọc').reduce((x, t) => x + t.amount, 0);
  const incomeTotal = revenue + depositIncome;
  const byCategory = Object.entries(
    tx.filter((t) => t.type === 'expense').reduce<Record<string, number>>((m, t) => {
      m[t.category] = (m[t.category] || 0) + t.amount;
      return m;
    }, {})
  ).sort((a, b) => b[1] - a[1]);
  const roomStats = Object.values(
    s.invoices
      .filter((i) => i.status !== 'draft')
      .reduce<Record<string, { code: string; paid: number; debt: number }>>((m, i) => {
        const r = (m[i.roomCode] ??= { code: i.roomCode, paid: 0, debt: 0 });
        r.paid += i.paidAmount;
        r.debt += Math.max(0, i.totalAmount - i.paidAmount);
        return m;
      }, {})
  );
  const best = roomStats.filter((r) => r.paid > 0).sort((a, b) => b.paid - a.paid).slice(0, 3);
  const watch = roomStats.filter((r) => r.debt > 0).sort((a, b) => b.debt - a.debt).slice(0, 3);
  const pctOf = (v: number, t: number) => (t > 0 ? Math.round((v / t) * 100) : 0);

  const shareReport = () =>
    Share.share({
      message: `BÁO CÁO KINH DOANH - ${s.currentProperty.name}
- Doanh thu thực thu: ${formatVND(revenue)}
- Chi phí: ${formatVND(expense)}
- Lợi nhuận ròng: ${formatVND(profit)}
- Tỷ lệ lấp đầy: ${s.occupancyRate}% (${s.occupiedRooms.length}/${s.propertyRooms.length} phòng)`,
    }).catch(() => {});

  return (
    <View style={{ gap: 20 }}>
      <View style={{ gap: 12 }}>
        <View>
          <Text style={T.h1}>Báo cáo kinh doanh</Text>
          <Text style={T.sub}>Tính trên toàn bộ hóa đơn và sổ thu chi của {s.currentProperty.name}</Text>
        </View>
        <Btn tone="outline" icon={Copy} label="Sao chép / chia sẻ số liệu" style={{ alignSelf: 'flex-start' }} onPress={shareReport} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        {[
          { icon: ArrowUpRight, bg: C.emerald50, fg: C.emerald600, label: 'Doanh thu thực thu', value: formatVND(revenue) },
          { icon: ArrowDownRight, bg: C.amber50, fg: C.amber600, label: 'Chi phí', value: formatVND(expense) },
          { icon: TrendingUp, bg: C.blue50, fg: C.blue600, label: 'Lợi nhuận', value: formatVND(profit) },
          { icon: LayoutGrid, bg: C.slate100, fg: C.slate700, label: `Lấp đầy (${s.occupiedRooms.length}/${s.propertyRooms.length})`, value: `${s.occupancyRate}%` },
        ].map((k) => (
          <Card key={k.label} style={{ width: '47.5%', padding: 16 }}>
            <Row style={{ gap: 8, marginBottom: 6 }}>
              <View style={{ padding: 6, borderRadius: 8, backgroundColor: k.bg }}>
                <k.icon size={16} color={k.fg} />
              </View>
              <Text style={[T.xs, { color: C.slate500, flex: 1 }]} numberOfLines={1}>
                {k.label}
              </Text>
            </Row>
            <Text style={[T.num, { fontSize: 16, fontWeight: '800', color: C.slate900 }]}>{k.value}</Text>
          </Card>
        ))}
      </View>

      <Card style={{ gap: 12 }}>
        <Text style={T.h2}>Doanh thu · Chi phí · Lợi nhuận</Text>
        <Row style={{ gap: 16 }}>
          {[
            ['#0284C7', 'Thu'],
            [C.purple600, 'Chi'],
            [C.emerald500, 'Lợi nhuận'],
          ].map(([c, l]) => (
            <Row key={l} style={{ gap: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: c }} />
              <Text style={T.xs}>{l}</Text>
            </Row>
          ))}
        </Row>
        <CashflowChart data={s.monthlyChart} max={30000000} incomeFill="#0284C7" expenseFill={C.purple600} />
        <Text style={[T.xxs, { color: C.slate400 }]}>Cột và đường dùng chung một thang đo nên so sánh trực tiếp được.</Text>
      </Card>

      <Card style={{ gap: 14 }}>
        <View>
          <Text style={T.h2}>Nguồn thu</Text>
          <Text style={[T.xs, { color: C.slate400 }]}>Tổng {formatVND(incomeTotal)}</Text>
        </View>
        {(
          [
            ['Thu tiền hóa đơn', revenue],
            ['Thu tiền cọc', depositIncome],
          ] as const
        ).map(([label, v]) => (
          <SplitBar key={label} label={label} value={v} pct={pctOf(v, incomeTotal)} color={C.blue600} />
        ))}
      </Card>

      <Card style={{ gap: 14 }}>
        <View>
          <Text style={T.h2}>Khoản chi</Text>
          <Text style={[T.xs, { color: C.slate400 }]}>Tổng {formatVND(expense)}</Text>
        </View>
        {byCategory.length === 0 && <Text style={[T.xs, { color: C.slate400 }]}>Chưa có khoản chi tại cơ sở này.</Text>}
        {byCategory.map(([cat, v]) => (
          <SplitBar key={cat} label={cat} value={v} pct={pctOf(v, expense)} color={C.purple600} />
        ))}
      </Card>

      <Card style={{ gap: 10 }}>
        <Text style={T.h2}>Theo cơ sở</Text>
        <Between>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate900 }}>{s.currentProperty.name}</Text>
          <Badge label={`${s.occupancyRate}%`} bg={C.amber50} fg={C.amber700} />
        </Between>
        <Stat label="Phòng đang thuê" value={`${s.occupiedRooms.length}/${s.propertyRooms.length}`} />
        <Stat label="Đã lập HĐ" value={formatVND(invoiced)} />
        <Stat label="Đã thu" value={formatVND(revenue)} color={C.emerald600} />
        <Stat label="Chi phí" value={formatVND(expense)} />
        <Stat label="Còn nợ" value={formatVND(s.allUnpaidTotalAmount)} color={C.rose600} />
      </Card>

      <Card style={{ gap: 14 }}>
        <View>
          <Text style={T.h2}>Phòng cho thuê tốt nhất</Text>
          <Text style={[T.xs, { color: C.slate400 }]}>Xếp theo tiền đã thu được, không phải tiền đã lập hóa đơn.</Text>
        </View>
        {best.length === 0 && <Text style={[T.xs, { color: C.slate400 }]}>Chưa có dữ liệu thu tiền của cơ sở này.</Text>}
        {best.map((r, i) => (
          <Ranked key={r.code} rank={i + 1} rankColor={C.blue600} code={r.code} note={`· nợ ${formatVND(r.debt)}`} value={formatVND(r.paid)} pct={pctOf(r.paid, best[0].paid)} barColor={C.slate800} />
        ))}
      </Card>

      <Card style={{ gap: 14 }}>
        <View>
          <Text style={T.h2}>Phòng cần để ý</Text>
          <Text style={[T.xs, { color: C.slate400 }]}>Thu được ít nhất trong kỳ, hoặc đang nợ nhiều.</Text>
        </View>
        {watch.length === 0 && <Text style={[T.xs, { color: C.slate400 }]}>Chưa có phòng phát sinh cảnh báo tại cơ sở này.</Text>}
        {watch.map((r, i) => (
          <Ranked
            key={r.code}
            rank={i + 1}
            rankColor={C.rose600}
            code={r.code}
            note={`· đã thu ${formatVND(r.paid)}`}
            value={`nợ ${formatVND(r.debt)}`}
            valueColor={C.rose600}
            pct={pctOf(r.debt, watch[0].debt)}
            barColor={C.rose500}
          />
        ))}
      </Card>
    </View>
  );
}

export function Settings() {
  const s = useStore();
  const p = s.currentProperty;
  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={T.h1}>Cài đặt</Text>
        <Text style={T.sub}>Thông tin cơ sở, giá điện nước và tài khoản nhận tiền.</Text>
      </View>
      <Card style={{ gap: 10 }}>
        <Text style={T.h2}>{p.name}</Text>
        <Text style={T.xxs}>{p.address}</Text>
        <Stat label="Giá điện" value={`${formatVND(p.electricityRate)}/kWh`} />
        <Stat label="Giá nước" value={`${formatVND(p.waterRate)}/m3`} />
        <Stat label="Rác" value={`${formatVND(p.trashFee)}/phòng/tháng`} />
        <Stat label="Internet" value={`${formatVND(p.internetFee)}/phòng/tháng`} />
        <Stat label="Gửi xe" value={`${formatVND(p.vehicleFee)}/xe/tháng`} />
        <Stat label="Tài khoản nhận tiền" value={`${p.bankName} · ${p.bankAccount}`} />
        <Stat label="Chủ tài khoản" value={p.bankOwner} />
      </Card>
      {s.canViewReports && <StaffCard />}
      {s.isDemoMode && (
      <Card style={{ gap: 10 }}>
        <Text style={T.h2}>Dữ liệu trên máy này</Text>
        <Text style={T.xs}>Bản Demo lưu ngay trên điện thoại. Không nhập họ tên, SĐT hay CCCD của khách thuê thật.</Text>
        <Btn
          tone="danger"
          icon={RotateCcw}
          label="Khôi phục dữ liệu mẫu"
          style={{ alignSelf: 'flex-start' }}
          onPress={() =>
            Alert.alert('Khôi phục dữ liệu mẫu?', 'Xoá toàn bộ dữ liệu đang có và nạp lại dữ liệu mẫu? Không hoàn tác được.', [
              { text: 'Huỷ', style: 'cancel' },
              { text: 'Khôi phục', style: 'destructive', onPress: s.resetDemoData },
            ])
          }
        />
      </Card>
      )}
    </View>
  );
}

function Stat({ label, value, color = C.slate900 }: { label: string; value: string; color?: string }) {
  return (
    <Between>
      <Text style={[T.xs, { color: C.slate500 }]}>{label}</Text>
      <Text style={[T.num, { fontSize: 12, fontWeight: '700', color, flexShrink: 1, textAlign: 'right' }]}>{value}</Text>
    </Between>
  );
}

function SplitBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Between>
        <Text style={{ fontSize: 12, color: C.slate700 }}>{label}</Text>
        <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: C.slate900 }]}>
          {formatVND(value)} · <Text style={{ color: C.slate400 }}>{pct}%</Text>
        </Text>
      </Between>
      <Bar pct={pct} color={color} height={8} />
    </View>
  );
}

function Ranked({
  rank,
  rankColor,
  code,
  note,
  value,
  valueColor = C.slate900,
  pct,
  barColor,
}: {
  rank: number;
  rankColor: string;
  code: string;
  note: string;
  value: string;
  valueColor?: string;
  pct: number;
  barColor: string;
}) {
  return (
    <Pressable style={{ gap: 4 }}>
      <Between>
        <Row style={{ gap: 8, flex: 1 }}>
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: rankColor, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: C.white }}>{rank}</Text>
          </View>
          <Text style={{ fontSize: 12, fontWeight: '700', color: C.blue600 }}>{code}</Text>
          <Text style={[T.xs, { color: C.slate400, flex: 1 }]} numberOfLines={1}>
            {note}
          </Text>
        </Row>
        <Text style={[T.num, { fontSize: 12, fontWeight: '700', color: valueColor }]}>{value}</Text>
      </Between>
      <Bar pct={pct} color={barColor} />
    </Pressable>
  );
}

type StaffRow = { id: string; staff_email: string; role: 'staff' | 'viewer' };

/** Cấp quyền tài khoản phụ — dùng chung bảng property_staff với web */
function StaffCard() {
  const s = useStore();
  const ownerId = s.authUser && !s.isDemoMode && s.cloudCtx?.role === 'owner' ? s.authUser.id : null;
  const [list, setList] = useState<StaffRow[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'staff' | 'viewer'>('staff');

  useEffect(() => {
    if (!ownerId) return setList([]);
    supabase
      .from('property_staff')
      .select('id, staff_email, role')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })
      .then(({ data }) => data && setList(data as StaffRow[]));
  }, [ownerId]);

  const add = async () => {
    const clean = email.trim().toLowerCase();
    if (!ownerId) return s.setModal({ kind: 'auth' });
    if (!/^\S+@\S+\.\S+$/.test(clean)) return s.showToast('Nhập email hợp lệ');
    const { data, error } = await supabase
      .from('property_staff')
      .upsert(
        {
          owner_id: ownerId,
          property_id: s.currentProperty.id,
          staff_email: clean,
          role,
          can_record_meters: true,
          can_collect_payments: role === 'staff',
          can_view_reports: false,
        },
        { onConflict: 'owner_id,property_id,staff_email' }
      )
      .select('id, staff_email, role')
      .single();
    if (error) return s.showToast('Không thêm được tài khoản phụ: ' + error.message);
    setList((prev) => [data as StaffRow, ...prev.filter((x) => x.id !== data.id)]);
    setEmail('');
    s.showToast(`Đã phân quyền cho ${clean} vào cơ sở ${s.currentProperty.name}!`);
  };

  const remove = async (st: StaffRow) => {
    const { error } = await supabase.from('property_staff').delete().eq('id', st.id);
    if (error) return s.showToast('Không thu hồi được: ' + error.message);
    setList((prev) => prev.filter((x) => x.id !== st.id));
    s.showToast(`Đã thu hồi quyền của ${st.staff_email}`);
  };

  return (
    <Card style={{ gap: 10 }}>
      <Text style={T.h2}>Tài khoản phụ tại {s.currentProperty.name}</Text>
      <Text style={T.xs}>Cấp quyền cho Quản lý / Người nhà đăng nhập bằng email của họ.</Text>
      {ownerId ? (
        <>
          <Field label="Email" value={email} onChangeText={setEmail} placeholder="Email người quản lý / người nhà..." keyboardType="email-address" autoCapitalize="none" />
          <Select
            hideLabel
            label="Quyền của tài khoản phụ"
            value={role}
            onChange={setRole}
            options={[
              { value: 'staff', label: 'Quản lý (Ghi điện nước & Thu tiền, ẩn Lợi nhuận)' },
              { value: 'viewer', label: 'Chỉ xem sơ đồ phòng & hóa đơn' },
            ]}
          />
          <Btn icon={UserPlus} label="Cấp quyền" style={{ alignSelf: 'flex-start' }} onPress={add} />
          {list.length === 0 ? (
            <Text style={[T.xs, { color: C.slate400 }]}>Chưa có tài khoản phụ nào được cấp quyền.</Text>
          ) : (
            list.map((st) => (
              <Between key={st.id} style={{ padding: 12, borderRadius: 12, backgroundColor: C.slate50, borderWidth: 1, borderColor: C.slate200, gap: 8 }}>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: C.slate900 }} numberOfLines={1}>{st.staff_email}</Text>
                  <Badge label={st.role === 'staff' ? 'Ghi số & Thu tiền (Ẩn lợi nhuận)' : 'Chỉ xem'} bg={C.teal100} fg={C.teal800} style={{ alignSelf: 'flex-start' }} />
                </View>
                <Pressable
                  hitSlop={8}
                  onPress={() =>
                    Alert.alert('Thu hồi quyền?', `Thu hồi quyền của ${st.staff_email}?`, [
                      { text: 'Huỷ', style: 'cancel' },
                      { text: 'Thu hồi', style: 'destructive', onPress: () => remove(st) },
                    ])
                  }
                >
                  <Text style={{ fontSize: 12, fontWeight: '600', color: C.rose600 }}>Thu hồi</Text>
                </Pressable>
              </Between>
            ))
          )}
        </>
      ) : (
        <>
          <Text style={[T.xs, { color: C.slate400 }]}>Đăng nhập tài khoản Chủ trọ để thêm và quản lý danh sách nhân viên/người nhà.</Text>
          {s.isDemoMode && <Btn label="Đăng nhập Đám mây" style={{ alignSelf: 'flex-start' }} onPress={() => s.setModal({ kind: 'auth' })} />}
        </>
      )}
    </Card>
  );
}
