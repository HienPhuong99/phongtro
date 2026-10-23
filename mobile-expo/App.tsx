import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Animated, BackHandler, Dimensions, Modal, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BarChart3,
  Calendar as CalendarIcon,
  ChevronLeft,
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
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { StoreProvider, useStore } from './lib/store';
import type { NavTab } from './lib/shared';
import { C } from './lib/theme';
import { Select } from './lib/ui';
import { Overview } from './screens/Overview';
import { Rooms } from './screens/Rooms';
import { Invoices } from './screens/Invoices';
import { Finance } from './screens/Finance';
import { Contracts, Tenants } from './screens/People';
import { Calendar, Reports, Settings } from './screens/More';
import { ModalHost } from './screens/Modals';

// Menu "Thêm": đủ 9 mục như menu trái của bản web
const NAV: { id: NavTab; label: string; group: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Tổng quan', group: 'Vận hành', icon: BarChart3 },
  { id: 'calendar', label: 'Lịch', group: 'Vận hành', icon: CalendarIcon },
  { id: 'rooms', label: 'Phòng', group: 'Vận hành', icon: LayoutGrid },
  { id: 'tenants', label: 'Khách thuê', group: 'Vận hành', icon: Users },
  { id: 'contracts', label: 'Hợp đồng', group: 'Giấy tờ & thu tiền', icon: FileText },
  { id: 'invoices', label: 'Hóa đơn', group: 'Giấy tờ & thu tiền', icon: Receipt },
  { id: 'finance-debts', label: 'Tài chính', group: 'Giấy tờ & thu tiền', icon: Wallet },
  { id: 'reports', label: 'Báo cáo', group: 'Khác', icon: TrendingUp },
  { id: 'settings', label: 'Cài đặt', group: 'Khác', icon: SettingsIcon },
];
const ROOT_TABS: NavTab[] = ['overview', 'rooms', 'invoices'];
// Tài khoản phụ (người nhà / quản lý) chỉ ghi số điện nước, lập hóa đơn và thu tiền
const STAFF_TABS: NavTab[] = ['overview', 'calendar', 'rooms', 'tenants', 'invoices', 'finance-cashbook', 'finance-debts'];

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const tab = s.activeTab;
  const isSecondary = !ROOT_TABS.includes(tab) && !tab.startsWith('finance-');
  const cloudOn = !s.isDemoMode && !!s.authUser;
  const allowed = s.canViewReports || STAFF_TABS.includes(tab);

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, [tab]);

  // Nút Back Android: đóng hộp thoại/menu trước, rồi về màn trước, cuối cùng mới thoát app
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (s.modal) {
        s.setModal(null);
        return true;
      }
      if (menuOpen) {
        setMenuOpen(false);
        return true;
      }
      if (tab === 'overview') return false;
      s.goBack();
      return true;
    });
    return () => sub.remove();
  }, [s, menuOpen, tab]);

  const bottomItems: { id: NavTab | 'more'; label: string; icon: LucideIcon; active: boolean }[] = [
    { id: 'overview', label: 'Tổng quan', icon: BarChart3, active: tab === 'overview' },
    { id: 'rooms', label: 'Phòng', icon: LayoutGrid, active: tab === 'rooms' },
    { id: 'invoices', label: 'Hóa đơn', icon: Receipt, active: tab === 'invoices' },
    { id: 'finance-debts', label: 'Tài chính', icon: Wallet, active: tab.startsWith('finance-') },
    { id: 'more', label: 'Thêm', icon: Menu, active: isSecondary },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: C.page }}>
      <StatusBar barStyle="dark-content" />
      <ModeBanner topInset={insets.top} />

      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 110 + insets.bottom }}
        stickyHeaderIndices={[0]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Thanh trên kiểu kính */}
        <View style={styles.topbar}>
          {isSecondary && (
            <Pressable accessibilityLabel="Quay lại" onPress={s.goBack} style={{ flexDirection: 'row', alignItems: 'center', paddingRight: 4 }}>
              <ChevronLeft size={20} color={C.blue600} />
              <Text style={{ fontSize: 14, fontWeight: '600', color: C.blue600 }}>Quay lại</Text>
            </Pressable>
          )}
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
            <Screen tab={tab} />
          )}
        </View>
      </ScrollView>

      {/* Thanh tab nổi */}
      <View style={[styles.tabbar, { bottom: Math.max(16, insets.bottom) }]}>
        {bottomItems.map((it) => (
          <Pressable
            key={it.id}
            accessibilityRole="tab"
            accessibilityLabel={it.label}
            accessibilityState={{ selected: it.active }}
            onPress={() => (it.id === 'more' ? setMenuOpen(true) : s.setActiveTab(it.id))}
            style={[styles.tab, it.active ? styles.tabOn : null]}
          >
            <it.icon size={22} color={it.active ? C.white : '#111114'} />
            {it.active && (
              <Text style={{ color: C.white, fontSize: 13, fontWeight: '600' }} numberOfLines={1}>
                {it.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>

      <NavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <ModalHost />

      {s.toast && (
        <View pointerEvents="none" style={[styles.toast, { bottom: Math.max(16, insets.bottom) + 74 }]}>
          <Text style={{ color: C.white, fontSize: 12, fontWeight: '600' }}>{s.toast}</Text>
        </View>
      )}
    </View>
  );
}

function Screen({ tab }: { tab: NavTab }) {
  if (tab === 'overview') return <Overview />;
  if (tab === 'calendar') return <Calendar />;
  if (tab === 'rooms') return <Rooms />;
  if (tab === 'tenants') return <Tenants />;
  if (tab === 'contracts') return <Contracts />;
  if (tab === 'invoices') return <Invoices />;
  if (tab === 'reports') return <Reports />;
  if (tab === 'settings') return <Settings />;
  return <Finance />;
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
      <View style={{ paddingTop: topInset, backgroundColor: C.amber50, borderBottomWidth: 1, borderBottomColor: C.amber200 }}>
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
    );
  }

  const st = s.cloudStatus;
  const statusColor = st === 'error' || st === 'conflict' ? C.rose700 : st === 'offline' ? C.amber700 : '#134E4A';
  const role = s.cloudCtx && s.cloudCtx.role !== 'owner' ? (s.cloudCtx.role === 'staff' ? ' · Tài khoản phụ (ghi số, thu tiền)' : ' · Chỉ xem') : '';
  return (
    <View style={{ paddingTop: topInset, backgroundColor: '#F0FDFA', borderBottomWidth: 1, borderBottomColor: '#99F6E4' }}>
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
  );
}

function NavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const s = useStore();
  const insets = useSafeAreaInsets();
  const width = Math.min(288, Dimensions.get('window').width * 0.8);
  const x = useRef(new Animated.Value(-width)).current;
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) setMounted(true);
    Animated.timing(x, { toValue: open ? 0 : -width, duration: 200, useNativeDriver: true }).start(() => {
      if (!open) setMounted(false);
    });
  }, [open]);

  const groups = NAV.filter((it) => s.canViewReports || STAFF_TABS.includes(it.id)).reduce<{ name: string; items: typeof NAV }[]>((acc, it) => {
    const last = acc[acc.length - 1];
    if (last && last.name === it.group) last.items.push(it);
    else acc.push({ name: it.group, items: [it] });
    return acc;
  }, []);
  const isActive = (id: NavTab) => (id === 'finance-debts' ? s.activeTab.startsWith('finance-') : s.activeTab === id);

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(15,23,42,0.4)', opacity: x.interpolate({ inputRange: [-width, 0], outputRange: [0, 1] }) }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Đóng menu" />
      </Animated.View>
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width,
          backgroundColor: C.white,
          paddingTop: Math.max(16, insets.top),
          paddingBottom: Math.max(16, insets.bottom),
          transform: [{ translateX: x }],
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.blue600, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18 }}>🏠</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '800', color: C.slate900 }}>Quản lý phòng trọ</Text>
            <Text style={{ fontSize: 11, color: C.slate500 }} numberOfLines={1}>
              {s.currentProperty.name} · {s.propertyRooms.length} phòng
            </Text>
          </View>
          <Pressable accessibilityLabel="Đóng menu" onPress={onClose} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: C.slate100, alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color={C.slate700} />
          </Pressable>
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8 }}>
          {groups.map((g) => (
            <View key={g.name}>
              <Text style={{ paddingHorizontal: 12, paddingTop: 16, paddingBottom: 6, fontSize: 10, fontWeight: '700', letterSpacing: 1, color: C.slate400 }}>
                {g.name.toUpperCase()}
              </Text>
              {g.items.map((it) => {
                const on = isActive(it.id);
                return (
                  <Pressable
                    key={it.id}
                    onPress={() => {
                      s.setActiveTab(it.id);
                      onClose();
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12, backgroundColor: on ? C.blue50 : 'transparent' }}
                  >
                    <it.icon size={18} color={on ? C.blue600 : C.slate500} />
                    <Text style={{ fontSize: 14, fontWeight: on ? '700' : '600', color: on ? C.blue600 : C.slate700 }}>{it.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </ScrollView>
        <Text style={{ paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.slate100, fontSize: 11, color: C.slate400 }}>Chạm nền mờ hoặc bấm Back để đóng</Text>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#141E3C',
    shadowOpacity: 0.15,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  tab: { flex: 1, height: '100%', borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  tabOn: { flex: 1.9, paddingHorizontal: 12, backgroundColor: 'rgba(0,88,190,0.86)' },
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
