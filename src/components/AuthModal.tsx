import React, { useState } from 'react';
import { ShieldCheck, LogIn, UserPlus, X, Cloud, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../utils/supabase';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (email: string, isNewAccount: boolean) => void;
  onSwitchToDemo: () => void;
  isCurrentlyCloud: boolean;
  currentEmail?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onSwitchToDemo,
  isCurrentlyCloud,
  currentEmail,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMsg('Vui lòng nhập đầy đủ Email và Mật khẩu.');
      return;
    }
    if (password.length < 6) {
      setErrorMsg('Mật khẩu cần tối thiểu 6 ký tự.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'login') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (error) {
          setErrorMsg(
            error.message.includes('Invalid login credentials')
              ? 'Email hoặc mật khẩu không đúng. Nếu chưa có tài khoản, hãy chuyển sang tab "Đăng ký mới".'
              : error.message
          );
          return;
        }
        if (data.user) {
          onAuthSuccess(data.user.email || trimmedEmail, false);
          onClose();
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: {
              full_name: fullName.trim() || trimmedEmail.split('@')[0],
            },
          },
        });
        if (error) {
          setErrorMsg(error.message);
          return;
        }
        if (data.session && data.user) {
          onAuthSuccess(data.user.email || trimmedEmail, true);
          onClose();
        } else {
          setInfoMsg(
            'Đã tạo tài khoản! Nếu hệ thống yêu cầu xác nhận email, vui lòng kiểm tra hộp thư của bạn rồi đăng nhập.'
          );
          setMode('login');
        }
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Lỗi kết nối tới máy chủ Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 ui-enter">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-teal-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Tài khoản Chủ trọ & Đồng bộ Đám mây
              </h3>
              <p className="text-xs text-slate-500">
                Bảo mật dữ liệu riêng biệt theo từng chủ trọ (Supabase RLS)
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Đóng cửa sổ đăng nhập"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chế độ chuyển nhanh sang Bản Demo khi đi gặp khách */}
        <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 flex items-center justify-between gap-3">
          <div className="text-xs text-amber-900">
            <div className="font-bold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Chế độ Bản Demo (Gặp khách hàng)</span>
            </div>
            <p className="text-[11px] text-amber-800 mt-0.5">
              Thao tác thoải mái với 12 phòng mẫu, không ảnh hưởng dữ liệu thật trên đám mây.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onSwitchToDemo();
              onClose();
            }}
            className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0 transition"
          >
            {isCurrentlyCloud ? 'Chuyển sang Demo' : 'Đang ở Demo'}
          </button>
        </div>

        {isCurrentlyCloud && currentEmail && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-xs text-emerald-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Đang đăng nhập: <strong>{currentEmail}</strong>
              </span>
            </div>
          </div>
        )}

        {/* Tabs Đăng nhập / Đăng ký */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              mode === 'login' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Đăng nhập</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg(null);
              setInfoMsg(null);
            }}
            className={`py-2 rounded-xl flex items-center justify-center gap-1.5 transition ${
              mode === 'signup' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Đăng ký Chủ trọ mới</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {mode === 'signup' && (
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Họ tên Chủ trọ / Tên nhà trọ
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="VD: Nguyễn Văn An - Khu trọ Bình An"
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
              />
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Email tài khoản
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="chutro@example.com"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mật khẩu (tối thiểu 6 ký tự)
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-slate-900 focus:border-blue-600 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {infoMsg && (
            <div
              role="status"
              className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold transition flex items-center justify-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {loading
                ? 'Đang xử lý...'
                : mode === 'login'
                  ? 'Đăng nhập vào Sổ Quản lý Đám mây'
                  : 'Tạo tài khoản Chủ trọ mới'}
            </span>
          </button>
        </form>
      </div>
    </div>
  );
};
