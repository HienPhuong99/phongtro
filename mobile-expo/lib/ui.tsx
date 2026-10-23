import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import { Check, ChevronDown, X, type LucideIcon } from 'lucide-react-native';
import { C } from './theme';

export const T = StyleSheet.create({
  h1: { fontSize: 20, fontWeight: '700', color: C.slate900, letterSpacing: -0.3 },
  sub: { fontSize: 12, color: C.slate500, marginTop: 2 },
  h2: { fontSize: 14, fontWeight: '700', color: C.slate900 },
  xs: { fontSize: 12, color: C.slate600 },
  xxs: { fontSize: 11, color: C.slate500 },
  bold: { fontWeight: '700' },
  xbold: { fontWeight: '800' },
  num: { fontVariant: ['tabular-nums'] },
  kpi: { fontSize: 24, fontWeight: '800', color: C.slate900, fontVariant: ['tabular-nums'] },
});

export function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
}) {
  const s = [styles.card, style];
  return onPress ? (
    <Pressable onPress={onPress} style={({ pressed }) => [s, pressed && { opacity: 0.85 }]}>
      {children}
    </Pressable>
  ) : (
    <View style={s}>{children}</View>
  );
}

export function IconBox({ icon: Icon, bg, color, size = 16 }: { icon: LucideIcon; bg: string; color: string; size?: number }) {
  return (
    <View style={{ padding: 6, borderRadius: 10, backgroundColor: bg }}>
      <Icon size={size} color={color} />
    </View>
  );
}

/** Thẻ số liệu: biểu tượng + nhãn + số lớn (KPI của web) */
export function Kpi({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  valueColor = C.slate900,
  note,
  style,
}: {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  valueColor?: string;
  note?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Card style={style}>
      <View style={[styles.row, { gap: 8, marginBottom: 8 }]}>
        <IconBox icon={icon} bg={iconBg} color={iconColor} />
        <Text style={[T.xs, { color: C.slate500, flex: 1 }]}>{label}</Text>
      </View>
      <Text style={[T.kpi, { color: valueColor }]}>{value}</Text>
      {note ? <Text style={[T.xxs, { color: C.slate400, marginTop: 4 }]}>{note}</Text> : null}
    </Card>
  );
}

type BtnTone = 'primary' | 'outline' | 'soft' | 'green' | 'danger' | 'ghost';
const BTN: Record<BtnTone, { bg: string; fg: string; border?: string }> = {
  primary: { bg: C.blue600, fg: C.white },
  outline: { bg: C.white, fg: C.slate700, border: C.slate200 },
  soft: { bg: C.blue50, fg: C.blue700, border: C.blue200 },
  green: { bg: C.emerald50, fg: C.emerald700, border: C.emerald200 },
  danger: { bg: C.white, fg: C.rose600, border: C.rose200 },
  ghost: { bg: C.slate100, fg: C.slate700 },
};

export function Btn({
  label,
  onPress,
  tone = 'primary',
  icon: Icon,
  small,
  disabled,
  style,
  full,
}: {
  label: string;
  onPress?: () => void;
  tone?: BtnTone;
  icon?: LucideIcon;
  small?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  full?: boolean;
}) {
  const t = BTN[tone];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        small && styles.btnSmall,
        { backgroundColor: t.bg, borderColor: t.border ?? t.bg, opacity: disabled ? 0.4 : pressed ? 0.8 : 1 },
        full && { alignSelf: 'stretch' },
        style,
      ]}
    >
      {Icon ? <Icon size={small ? 13 : 15} color={t.fg} /> : null}
      <Text style={{ color: t.fg, fontSize: 12, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

/** Chip lọc dạng viên thuốc (Tất cả 12 · Trống 2 ...) */
export function Chip({
  label,
  count,
  dot,
  active,
  onPress,
  soft,
}: {
  label: string;
  count?: number;
  dot?: string;
  active: boolean;
  onPress: () => void;
  soft?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active
          ? { backgroundColor: C.blue600, borderColor: C.blue600 }
          : soft
            ? { backgroundColor: C.slate100, borderColor: C.slate100 }
            : { backgroundColor: C.white, borderColor: C.slate200 },
      ]}
    >
      {dot ? <View style={[styles.dot6, { backgroundColor: active ? C.white : dot }]} /> : null}
      <Text style={{ fontSize: 12, fontWeight: '500', color: active ? C.white : C.slate700 }}>{label}</Text>
      {count !== undefined ? (
        <Text style={[T.num, { fontSize: 11, color: active ? C.white : C.slate400 }]}>{count}</Text>
      ) : null}
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>{children}</View>;
}

/** Tab con gạch chân (Cơ sở / Tất cả phòng ...) */
export function SubTabs<K extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { id: K; label: string }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ borderBottomWidth: 1, borderBottomColor: C.slate200, flexGrow: 0 }}
      contentContainerStyle={{ gap: 24 }}
    >
      {tabs.map((t) => (
        <Pressable
          key={t.id}
          onPress={() => onChange(t.id)}
          style={{ paddingBottom: 10, borderBottomWidth: 2, borderBottomColor: value === t.id ? C.blue600 : 'transparent' }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: value === t.id ? C.blue600 : C.slate500 }}>
            {t.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

export function Badge({ label, bg, fg, style }: { label: string; bg: string; fg: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: bg, alignSelf: 'flex-start' }, style]}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: fg }}>{label}</Text>
    </View>
  );
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Between({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, { justifyContent: 'space-between', gap: 12 }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: 1, backgroundColor: C.slate100 }} />;
}

export function Bar({ pct, color, height = 6, style }: { pct: number; color: string; height?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[{ height, borderRadius: 999, backgroundColor: C.slate100, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color, borderRadius: 999 }} />
    </View>
  );
}

export function Field({
  label,
  error,
  hint,
  style,
  inputStyle,
  ...props
}: TextInputProps & { label: string; error?: string; hint?: string; inputStyle?: StyleProp<TextStyle> }) {
  return (
    <View style={[{ gap: 6 }, style]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={C.slate400}
        accessibilityLabel={label}
        {...props}
        style={[styles.input, error ? { borderColor: C.rose500, backgroundColor: '#FFF1F266' } : null, inputStyle]}
      />
      {error ? <Text style={{ fontSize: 11, fontWeight: '600', color: C.rose600 }}>{error}</Text> : null}
      {hint ? <Text style={[T.xxs, { color: C.slate400 }]}>{hint}</Text> : null}
    </View>
  );
}

/** Ô tiền: hiện 2.500.000, trả về số */
export function MoneyField({
  label,
  value,
  onChange,
  hint,
  amber,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  hint?: string;
  amber?: boolean;
}) {
  return (
    <Field
      label={label}
      hint={hint}
      keyboardType="number-pad"
      value={Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')}
      onChangeText={(t) => onChange(parseInt(t.replace(/\D/g, ''), 10) || 0)}
      inputStyle={[{ textAlign: 'right', fontWeight: '700' }, amber && { borderColor: C.amber300, backgroundColor: '#FFFBEB55' }]}
    />
  );
}

/** Ô chọn: bấm mở danh sách (thay cho <select> của web) */
export function Select<V extends string>({
  label,
  value,
  options,
  onChange,
  hideLabel,
}: {
  label: string;
  value: V;
  options: { value: V; label: string; disabled?: boolean }[];
  onChange: (v: V) => void;
  hideLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = options.find((o) => o.value === value);
  return (
    <View style={{ gap: 6 }}>
      {hideLabel ? null : <Text style={styles.label}>{label}</Text>}
      <Pressable accessibilityLabel={label} onPress={() => setOpen(true)} style={[styles.input, styles.row, { justifyContent: 'space-between' }]}>
        <Text style={{ fontSize: 14, color: C.slate900, flex: 1 }} numberOfLines={1}>
          {current?.label ?? value}
        </Text>
        <ChevronDown size={16} color={C.slate400} />
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { maxHeight: '70%' }]}>
            <Text style={[T.h2, { padding: 16 }]}>{label}</Text>
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o.value}
                  disabled={o.disabled}
                  onPress={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  style={[styles.row, { paddingHorizontal: 16, paddingVertical: 14, opacity: o.disabled ? 0.4 : 1, justifyContent: 'space-between' }]}
                >
                  <Text style={{ fontSize: 14, color: o.value === value ? C.blue600 : C.slate800, fontWeight: o.value === value ? '700' : '400', flex: 1 }}>
                    {o.label}
                  </Text>
                  {o.value === value ? <Check size={16} color={C.blue600} /> : null}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

/** Hộp thoại trượt từ dưới lên, có tiêu đề + nút đóng */
export function Sheet({
  visible,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  visible: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={[styles.row, { paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: C.slate100, gap: 12 }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: C.slate900 }}>{title}</Text>
              {subtitle ? <Text style={T.sub}>{subtitle}</Text> : null}
            </View>
            <Pressable accessibilityLabel="Đóng cửa sổ" onPress={onClose} hitSlop={10} style={{ padding: 6, borderRadius: 8 }}>
              <X size={20} color={C.slate400} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
            {children}
          </ScrollView>
          {footer ? (
            <View style={[styles.row, { justifyContent: 'flex-end', gap: 10, paddingHorizontal: 20, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.slate100 }]}>
              {footer}
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  card: {
    backgroundColor: C.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.8)',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnSmall: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
  },
  dot6: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: 12, fontWeight: '500', color: C.slate600 },
  input: {
    borderWidth: 1,
    borderColor: C.slate200,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: C.slate900,
    backgroundColor: C.white,
  },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.5)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: C.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '92%',
    overflow: 'hidden',
  },
});
