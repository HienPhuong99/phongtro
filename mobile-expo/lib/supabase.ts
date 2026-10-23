import 'react-native-url-polyfill/auto';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Cùng dự án Supabase với bản web (src/utils/supabase.ts): đăng nhập 1 tài khoản, dùng chung 1 sổ.
// Khoá publishable được phép nằm trong app; quyền đọc/ghi do RLS của Supabase chặn theo tài khoản.
const SUPABASE_URL = 'https://ymdnvpdgdpdjnqnraklg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_Op0005S2fv5kurR-vNjgbw_3ogV47w6';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

// Chỉ làm mới phiên đăng nhập khi app đang mở trên màn hình
AppState.addEventListener('change', (state) => {
  if (state === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
