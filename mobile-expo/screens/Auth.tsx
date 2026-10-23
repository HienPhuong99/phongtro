import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { AlertCircle, CheckCircle2, LogIn, ShieldCheck, Sparkles, UserPlus } from 'lucide-react-native';
import { useStore } from '../lib/store';
import { supabase } from '../lib/supabase';
import { C } from '../lib/theme';
import { Btn, Field, Row, Sheet, T } from '../lib/ui';

/** Tài khoản Chủ trọ & Đồng bộ Đám mây: cùng tài khoản Supabase với bản web */
export function AuthModal({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const isCloud = !s.isDemoMode && !!s.authUser;

  const submit = async () => {
    setError(null);
    setInfo(null);
    const mail = email.trim().toLowerCase();
    if (!mail || !password) return setError('Vui lòng nhập đầy đủ Email và Mật khẩu.');
    if (password.length < 6) return setError('Mật khẩu cần tối thiểu 6 ký tự.');
    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: mail, password });
        if (err) {
          setError(
            err.message.includes('Invalid login credentials')
              ? 'Email hoặc mật khẩu không đúng. Nếu chưa có tài khoản, hãy chuyển sang tab "Đăng ký Chủ trọ mới".'
              : err.message
          );
          return;
        }
        if (data.user) {
          s.enterCloud({ id: data.user.id, email: data.user.email || mail });
          onClose();
        }
      } else {
        const { data, error: err } = await supabase.auth.signUp({
          email: mail,
          password,
          options: { data: { full_name: fullName.trim() || mail.split('@')[0] } },
        });
        if (err) return setError(err.message);
        if (data.session && data.user) {
          s.enterCloud({ id: data.user.id, email: data.user.email || mail });
          onClose();
        } else {
          setInfo('Đã tạo tài khoản! Nếu hệ thống yêu cầu xác nhận email, vui lòng kiểm tra hộp thư của bạn rồi đăng nhập.');
          setMode('login');
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Lỗi kết nối tới máy chủ Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const tab = (m: 'login' | 'signup', label: string, Icon: typeof LogIn) => (
    <Pressable
      onPress={() => {
        setMode(m);
        setError(null);
        setInfo(null);
      }}
      style={{ flex: 1, flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 12, backgroundColor: mode === m ? C.white : 'transparent' }}
    >
      <Icon size={14} color={mode === m ? C.blue600 : C.slate600} />
      <Text style={{ fontSize: 12, fontWeight: '700', color: mode === m ? C.blue600 : C.slate600 }}>{label}</Text>
    </Pressable>
  );

  return (
    <Sheet visible title="Tài khoản Chủ trọ & Đồng bộ Đám mây" subtitle="Bảo mật dữ liệu riêng biệt theo từng chủ trọ (Supabase RLS)" onClose={onClose}>
      <View style={{ padding: 14, borderRadius: 16, backgroundColor: C.amber50, borderWidth: 1, borderColor: C.amber200, gap: 10 }}>
        <View>
          <Row style={{ gap: 6 }}>
            <Sparkles size={14} color={C.amber600} />
            <Text style={{ fontSize: 12, fontWeight: '700', color: C.amber900 }}>Chế độ Bản Demo (Gặp khách hàng)</Text>
          </Row>
          <Text style={{ fontSize: 11, color: C.amber800, marginTop: 2 }}>Thao tác thoải mái với 12 phòng mẫu, không ảnh hưởng dữ liệu thật trên đám mây.</Text>
        </View>
        <Btn
          small
          label={isCloud ? 'Chuyển sang Demo' : 'Đang ở Demo'}
          style={{ alignSelf: 'flex-start', backgroundColor: C.amber600, borderColor: C.amber600 }}
          onPress={() => {
            if (isCloud) s.switchToDemoMode();
            onClose();
          }}
        />
      </View>

      {isCloud && s.authUser ? (
        <Row style={{ gap: 8, padding: 12, borderRadius: 16, backgroundColor: C.emerald50, borderWidth: 1, borderColor: C.emerald200 }}>
          <CheckCircle2 size={16} color={C.emerald600} />
          <Text style={{ fontSize: 12, color: '#064E3B', flex: 1 }}>
            Đang đăng nhập: <Text style={{ fontWeight: '700' }}>{s.authUser.email}</Text>
          </Text>
        </Row>
      ) : null}

      <View style={{ flexDirection: 'row', gap: 6, padding: 4, borderRadius: 16, backgroundColor: C.slate100 }}>
        {tab('login', 'Đăng nhập', LogIn)}
        {tab('signup', 'Đăng ký Chủ trọ mới', UserPlus)}
      </View>

      {mode === 'signup' && (
        <Field label="Họ tên Chủ trọ / Tên nhà trọ" value={fullName} onChangeText={setFullName} placeholder="VD: Nguyễn Văn An - Khu trọ Bình An" />
      )}
      <Field
        label="Email tài khoản"
        value={email}
        onChangeText={setEmail}
        placeholder="chutro@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />
      <Field
        label="Mật khẩu (tối thiểu 6 ký tự)"
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        autoCapitalize="none"
        autoComplete={mode === 'login' ? 'password' : 'new-password'}
        textContentType={mode === 'login' ? 'password' : 'newPassword'}
        onSubmitEditing={submit}
      />
      {error ? (
        <Row style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: C.rose50, borderWidth: 1, borderColor: C.rose200, alignItems: 'flex-start' }}>
          <AlertCircle size={16} color={C.rose700} />
          <Text accessibilityRole="alert" style={{ fontSize: 12, color: C.rose700, flex: 1 }}>
            {error}
          </Text>
        </Row>
      ) : null}
      {info ? (
        <Row style={{ gap: 8, padding: 12, borderRadius: 12, backgroundColor: C.blue50, borderWidth: 1, borderColor: C.blue200, alignItems: 'flex-start' }}>
          <CheckCircle2 size={16} color={C.blue700} />
          <Text style={{ fontSize: 12, color: C.blue700, flex: 1 }}>{info}</Text>
        </Row>
      ) : null}
      <Btn
        full
        icon={ShieldCheck}
        disabled={loading}
        onPress={submit}
        label={loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập vào Sổ Quản lý Đám mây' : 'Tạo tài khoản Chủ trọ mới'}
      />
      <Text style={[T.xxs, { textAlign: 'center' }]}>Dùng cùng tài khoản với bản web: dữ liệu hai bên là một sổ.</Text>
    </Sheet>
  );
}
