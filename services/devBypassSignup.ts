export async function devBypassSignup(email: string, password: string): Promise<void> {
  const supabaseUrl =
    (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim() ??
    'https://hlfkcmgumiwmemcnnukl.supabase.co';
  const supabaseAnonKey =
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim() ??
    'sb_publishable_xXGe5a0lz7nyJRw0KV9QxQ_qtWSh8Cu';

  const url = `${supabaseUrl}/functions/v1/dev-signup`;
  const devKey = (import.meta.env.VITE_DEV_BYPASS_KEY as string | undefined)?.trim();
  if (!devKey) {
    throw new Error('Missing VITE_DEV_BYPASS_KEY');
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: supabaseAnonKey,
    Authorization: `Bearer ${supabaseAnonKey}`,
    'x-dev-bypass-key': devKey
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `dev-signup failed (${res.status})`);
  }
}
