import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Validate if real Supabase credentials have been configured
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-supabase-url') &&
  !supabaseUrl.includes('your-project-id') &&
  supabaseAnonKey.length > 20 &&
  !/(your-anon-key|your_supabase_anon_key|\*{3,})/i.test(supabaseAnonKey)
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  url: string;
  hasAnonKey: boolean;
  message: string;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  if (isSupabaseConfigured) {
    return {
      isConfigured: true,
      url: supabaseUrl,
      hasAnonKey: true,
      message: 'Supabase PostgreSQL & Auth connected.'
    };
  }

  return {
    isConfigured: false,
    url: supabaseUrl || '',
    hasAnonKey: Boolean(supabaseAnonKey),
    message: 'Supabase is not configured. Owner-only features are disabled.'
  };
}
