import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function getConfigState() {
  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      isConfigured: false,
      error: 'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.'
    };
  }

  try {
    const parsedUrl = new URL(supabaseUrl);

    if (!parsedUrl.hostname.endsWith('.supabase.co')) {
      return {
        isConfigured: false,
        error: 'VITE_SUPABASE_URL must be your Supabase project URL.'
      };
    }
  } catch {
    return {
      isConfigured: false,
      error: 'VITE_SUPABASE_URL is not a valid URL.'
    };
  }

  return {
    isConfigured: true,
    error: ''
  };
}

export const supabaseConfig = getConfigState();
export const isSupabaseConfigured = supabaseConfig.isConfigured;
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl.trim(), supabaseAnonKey.trim(), {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
