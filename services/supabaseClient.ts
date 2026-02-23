import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const normalize = (value: string | undefined) => (value ? value.trim() : undefined);

const isValidUrl = (value: string) => {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
};

const createClientSafely = () => {
  const url = normalize(supabaseUrl);
  const key = normalize(supabaseAnonKey);
  if (!url || !key) return null;
  if (!isValidUrl(url)) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
};

export const supabase = createClientSafely();

export function requireSupabase(): SupabaseClient {
  const url = normalize(supabaseUrl);
  const key = normalize(supabaseAnonKey);
  if (!url) throw new Error('Missing VITE_SUPABASE_URL');
  if (!key) throw new Error('Missing VITE_SUPABASE_ANON_KEY');
  if (!isValidUrl(url)) {
    throw new Error('Invalid VITE_SUPABASE_URL (expected https://xxxx.supabase.co)');
  }
  if (!supabase) throw new Error('Supabase client not initialized');
  return supabase;
}
