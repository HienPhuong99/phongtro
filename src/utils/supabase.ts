import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const metaEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://ymdnvpdgdpdjnqnraklg.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || 'sb_publishable_Op0005S2fv5kurR-vNjgbw_3ogV47w6';

export const SUPABASE_PROJECT_REF = 'ymdnvpdgdpdjnqnraklg';
export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
