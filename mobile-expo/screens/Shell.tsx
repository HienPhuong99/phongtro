import React from 'react';
import { ActivityIndicator, Alert, Animated, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Stack, useLocalSearchParams } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChevronRight,
  Cloud,
  FileText,
  LayoutGrid,
  LogIn,
  LogOut,
  Menu,
  ShieldCheck,
  Receipt,
  Settings as SettingsIcon,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react-native';
import { useOpen } from '../lib/nav';
import { useStore } from '../lib/store';
import type { NavTab } from '../lib/shared';
import { C } from '../lib/theme';
import { Card, Select, SpringUp, T } from '../lib/ui';
import { Overview } from './Overview';
import { Rooms } from './Rooms';
import { Invoices } from './Invoices';
import { Finance } from './Finance';
import { Contracts, Tenants } from './People';
import { Calendar, Reports, Settings } from './More';

type ScreenId = NavTab | 'more';

const LABEL: Record<ScreenId, string> = {
  overview: 'Tổng quan',
  calendar: 'Lịch',
  rooms: 'Phòng',
  tenants: 'Khách thuê',
  contracts: 'Hợp đồng',
  invoices: 'Hóa đơn',
  'finance-cashbook': 'Sổ thu chi',
  'finance-funds': 'Quỹ',
  'finance-debts': 'Công nợ',
  'finance-deposits': 'Cọc phải trả',
  reports: 'Báo cáo',
  settings: 'Cài đặt',
  more: 'Thêm',
};

// Tab đáy: tên thư mục route -> màn gốc
const TABS: { name: string; label: string; icon: LucideIcon }[] = [
  { name: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { name: 'rooms', label: 'Phòng', icon: LayoutGrid },
  { name: 'invoices', label: 'Hóa đơn', icon: Receipt },
  { name: 'finance', label: 'Tài chính', icon: Wallet },
  { name: 'more', label: 'Thêm', icon: Menu },
];

// Các mục trong tab "Thêm" (những mục không có trên thanh tab đáy)
const MORE_ITEMS: { id: NavTab; icon: LucideIcon; note: string }[] = [
  { id: 'calendar', icon: CalendarIcon, note: 'Ghi điện nước, hạn thu tiền, hợp đồng sắp hết hạn' },
  { id: 'tenants', icon: Users, note: 'Danh sách khách, xe, khai báo tạm trú' },
  { id: 'contracts', icon: FileText, note: 'Hợp đồng đang hiệu lực, trả phòng' },
  { id: 'reports', icon: TrendingUp, note: 'Doanh thu, chi phí, lợi nhuận' },
  { id: 'settings', icon: SettingsIcon, note: 'Thông tin cơ sở, tài khoản phụ' },
];

// Tài khoản phụ (người nhà / quản lý) chỉ ghi số điện nước, lập hóa đơn và thu tiền
const STAFF_TABS: ScreenId[] = ['overview', 'calendar', 'rooms', 'tenants', 'invoices', 'finance-cashbook', 'finance-debts', 'more'];

/** Chồng màn của một tab */
export function TabStack() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: C.page },
        headerShadowVisible: false,
        headerTintColor: C.blue600,
        headerTitleStyle: { color: C.slate900, fontWeight: '700' },
        contentStyle: { backgroundColor: C.page },
        fullScreenGestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
    </Stack>
  );
}

/** Màn được đẩy vào chồng: /<tab>/<màn> */
export function DetailRoute() {
  const { screen } = useLocalSearchParams<{ screen: NavTab }>();
  return <Page screen={screen in LABEL ? screen : 'overview'} />;
}

export function Page({ screen, root }: { screen: ScreenId; root?: boolean }) {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const allowed = s.canViewReports || STAFF_TABS.includes(screen);
  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <Stack.Screen options={{ title: LABEL[screen] }} />
      {root && <ModeBanner topInset={insets.top} />}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        stickyHeaderIndices={root ? [0] : undefined}
        keyboardShouldPersistTaps="handled"
      >
        {root && <TopBar />}
        <View style={{ paddingHorizontal: 16, paddingTop: 20 }}>
          {!s.ready ? (
            <ActivityIndicator color={C.blue600} style={{ marginTop: 40 }} />
          ) : !allowed ? (
            <View style={{ backgroundColor: C.white, borderRadius: 16, borderWidth: 1, borderColor: C.slate200, padding: 32 }}>
              <Text style={{ fontSize: 14, color: C.slate600, textAlign: 'center' }}>
                Tài khoản phụ chỉ ghi số điện nước, lập hóa đơn và thu tiền. Mục này do chủ trọ quản lý.
              </Text>
            </View>
          ) : (
            <Screen id={screen} />
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function Screen({ id }: { id: ScreenId }) {
  if (id === 'overview') return <Overview />;
  if (id === 'calendar') return <Calendar />;
  if (id === 'rooms') return <Rooms />;
  if (id === 'tenants') return <Tenants />;
  if (id === 'contracts') return <Contracts />;
  if (id === 'invoices') return <Invoices />;
  if (id === 'reports') return <Reports />;
  if (id === 'settings') return <Settings />;
  if (id === 'more') return <MoreMenu />;
  return <Finance initial={id} />;
}

function MoreMenu() {
  const s = useStore();
  const open = useOpen();
  return (
    <View style={{ gap: 20 }}>
      <View>
        <Text style={T.h1}>Thêm</Text>
        <Text style={T.sub}>
          {s.currentProperty.name} · {s.propertyRooms.length} phòng
        </Text>
      </View>
      <Card style={{ padding: 0 }}>
        {MORE_ITEMS.filter((it) => s.canViewReports || STAFF_TABS.includes(it.id)).map((it, i) => (
          <Pressable
            key={it.id}
            onPress={() => open(it.id)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              padding: 16,
              borderTopWidth: i ? 1 : 0,
              borderTopColor: C.slate100,
              backgroundColor: pressed ? C.slate50 : 'transparent',
            })}
          >
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.blue50, alignItems: 'center', justifyContent: 'center' }}>
              <it.icon size={18} color={C.blue600} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: C.slate900 }}>{LABEL[it.id]}</Text>
              <Text style={T.xxs}>{it.note}</Text>
            </View>
            <ChevronRight size={18} color={C.slate400} />
          </Pressable>
        ))}
      </Card>
    </View>
  );
}

/** Thanh trên kiểu kính: chọn cơ sở + nút Đám mây */
function TopBar() {
  const s = useStore();
  const cloudOn = !s.isDemoMode && !!s.authUser;
  return (
    <View style={styles.topbar}>
      <View style={{ flex: 1 }}>
        <Select
          hideLabel
          label="Chọn cơ sở nhà trọ"
          value={s.currentProperty.id}
          onChange={s.setSelectedPropertyId}
          options={s.properties.map((p) => ({ value: p.id, label: p.name }))}
        />
      </View>
      <Pressable
        accessibilityLabel="Đăng nhập / Demo"
        onPress={() => s.setModal({ kind: 'auth' })}
        style={{
          width: 44,
          height: 42,
          borderRadius: 12,
          borderWidth: 1,
          alignItems: 'center',
          justifyContent: 'center',
          ...(cloudOn ? { borderColor: '#99F6E4', backgroundColor: '#F0FDFA' } : { borderColor: C.blue200, backgroundColor: C.blue50 }),
        }}
      >
        <Cloud size={18} color={cloudOn ? '#115E59' : C.blue700} />
      </Pressable>
    </View>
  );
}

/** Thanh tab nổi dạng viên thuốc: nền kính mờ, khối chọn trượt theo lò xo */
const PAD = 5;
const GAP = 4;
const GROW = 0.9; // tab đang chọn rộng hơn tab thường 90%
const SPRING = { damping: 16, stiffness: 180, mass: 0.9, useNativeDriver: false };

export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const routes = state.routes.filter((r) => TABS.some((t) => t.name === r.name));
  const activeKey = state.routes[state.index]?.key;
  const active = Math.max(0, routes.findIndex((r) => r.key === activeKey));
  const [barW, setBarW] = React.useState(0);
  const unit = Math.max(0, (barW - PAD * 2 - GAP * (routes.length - 1)) / (routes.length + GROW));

  // ponytail: width/left chạy trên luồng JS (native driver không hỗ trợ), đủ mượt cho 5 tab; giật thì chuyển Reanimated
  const grow = React.useRef(routes.map((_, i) => new Animated.Value(i === active ? 1 : 0))).current;
  const pillX = React.useRef(new Animated.Value(0)).current;
  const first = React.useRef(true);

  React.useEffect(() => {
    if (!unit) return;
    const x = PAD + active * (unit + GAP);
    if (first.current) {
      first.current = false;
      pillX.setValue(x);
      return;
    }
    Animated.parallel([
      Animated.spring(pillX, { toValue: x, ...SPRING }),
      ...grow.map((g, i) => Animated.spring(g, { toValue: i === active ? 1 : 0, ...SPRING })),
    ]).start();
  }, [active, unit]);

  return (
    <View onLayout={(e) => setBarW(e.nativeEvent.layout.width)} style={[styles.tabbar, { bottom: Math.max(16, insets.bottom) }]}>
      <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
      {unit > 0 && <Animated.View pointerEvents="none" style={[styles.pill, { left: pillX, width: unit * (1 + GROW) }]} />}
      {routes.map((route, i) => {
        const it = TABS.find((t) => t.name === route.name)!;
        const on = i === active;
        const g = grow[i];
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={it.label}
            accessibilityState={{ selected: on }}
            onPress={() => {
              // Bấm lại tab đang mở: chồng màn tự lùi về màn gốc
              const ev = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!on && !ev.defaultPrevented) navigateToTab(route.key);
            }}
          >
            <Animated.View style={[styles.tab, { width: g.interpolate({ inputRange: [0, 1], outputRange: [unit, unit * (1 + GROW)] }) }]}>
              <Animated.View style={{ transform: [{ scale: g.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) }] }}>
                <it.icon size={22} color={on ? C.white : '#111114'} />
              </Animated.View>
              <Animated.Text
                numberOfLines={1}
                style={{ color: C.white, fontSize: 13, fontWeight: '600', opacity: g, maxWidth: g.interpolate({ inputRange: [0, 1], outputRange: [0, 90] }) }}
              >
                {it.label}
              </Animated.Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Toast() {
  const s = useStore();
  const insets = useSafeAreaInsets();
  if (!s.toast) return null;
  return (
    <SpringUp key={s.toast} style={[styles.toast, { bottom: Math.max(16, insets.bottom) + 74, pointerEvents: 'none' }]}>
      <Text style={{ color: C.white, fontSize: 12, fontWeight: '600' }}>{s.toast}</Text>
    </SpringUp>
  );
}

const STATUS_TEXT: Record<string, string> = {
  idle: '',
  loading: 'Đang tải sổ...',
  saving: 'Đang lưu...',
  offline: 'Mất mạng: thay đổi đang giữ trên máy, sẽ tự đồng bộ',
  error: 'Lưu lên mây lỗi, đang thử lại (dữ liệu vẫn giữ trên máy)',
  conflict: 'Sổ vừa được sửa ở thiết bị khác',
};

/** Dải thông báo đầu màn: Bản Demo (vàng) hoặc Sổ Đám mây (xanh ngọc) kèm trạng thái lưu */
function ModeBanner({ topInset }: { topInset: number }) {
  const s = useStore();
  const pill = (label: string, onPress: () => void, style: object, color: string, Icon?: LucideIcon) => (
    <Pressable onPress={onPress} style={[{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }, style]}>
      {Icon ? <Icon size={12} color={color} /> : null}
      <Text style={{ fontSize: 11, fontWeight: '700', color }}>{label}</Text>
    </Pressable>
  );

  if (s.isDemoMode) {
    return (
      <View style={{ paddingTop: topInset }}><View style={[styles.banner, { backgroundColor: C.amber50, borderColor: C.amber200 }]}>
        <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}>
          <Text style={{ fontSize: 12, color: C.amber900 }}>
            <Text style={{ fontWeight: '700' }}>Bản demo.</Text> Dữ liệu chỉ lưu trên điện thoại này. Không nhập họ tên, SĐT hay CCCD của khách thuê thật.
          </Text>
          <View style={{ flexDirection: 'row' }}>
            {s.authUser
              ? pill(`Quay lại Sổ Đám mây (${s.authUser.email})`, () => s.enterCloud(s.authUser!), { backgroundColor: '#0F766E' }, C.white, Cloud)
              : pill('Đăng nhập Chủ trọ (Lưu Đám mây)', () => s.setModal({ kind: 'auth' }), { backgroundColor: C.amber900 }, C.white, LogIn)}
          </View>
        </View>
      </View>
      </View>
    );
  }

  const st = s.cloudStatus;
  const statusColor = st === 'error' || st === 'conflict' ? C.rose700 : st === 'offline' ? C.amber700 : '#134E4A';
  const role = s.cloudCtx && s.cloudCtx.role !== 'owner' ? (s.cloudCtx.role === 'staff' ? ' · Tài khoản phụ (ghi số, thu tiền)' : ' · Chỉ xem') : '';
  return (
    <View style={{ paddingTop: topInset }}><View style={[styles.banner, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}>
      <View style={{ paddingHorizontal: 16, paddingVertical: 8, gap: 6 }}>
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-start' }}>
          <ShieldCheck size={16} color="#0F766E" />
          <Text style={{ fontSize: 12, color: '#134E4A', flex: 1 }}>
            <Text style={{ fontWeight: '700' }}>Sổ Đám mây:</Text> {s.authUser?.email}
            {role} ·{' '}
            <Text style={{ color: statusColor, fontWeight: st === 'error' || st === 'conflict' || st === 'offline' ? '700' : '400' }}>
              {st === 'saved' ? `Đã lưu lên mây lúc ${s.cloudLastSavedAt ?? ''}` : STATUS_TEXT[st]}
            </Text>
          </Text>
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {st === 'conflict' && pill('Tải bản mới nhất', s.reloadCloud, { backgroundColor: C.rose600 }, C.white)}
          {pill('🎭 Bật Chế độ Demo', () => s.switchToDemoMode(), { backgroundColor: C.amber100, borderWidth: 1, borderColor: C.amber300 }, C.amber900)}
          {pill(
            'Đăng xuất',
            () =>
              Alert.alert('Đăng xuất?', 'Dữ liệu đã lưu trên mây vẫn còn, đăng nhập lại là thấy.', [
                { text: 'Huỷ', style: 'cancel' },
                { text: 'Đăng xuất', style: 'destructive', onPress: s.signOutCloud },
              ]),
            { backgroundColor: C.white, borderWidth: 1, borderColor: C.rose200 },
            C.rose600,
            LogOut
          )}
        </View>
      </View>
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: { marginHorizontal: 12, marginTop: 8, borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  topbar: {
    marginHorizontal: 12,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#141E3C',
    shadowOpacity: 0.12,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  tabbar: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 62,
    padding: 5,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
    // Android chưa có BlurTargetView nên không mờ: nền trắng trong thay thế
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: '#141E3C',
    shadowOpacity: 0.15,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  tab: { height: 52, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, overflow: 'hidden' },
  pill: { position: 'absolute', top: PAD, bottom: PAD, borderRadius: 999, backgroundColor: 'rgba(0,88,190,0.88)' },
  toast: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: C.slate900,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.slate700,
  },
});
