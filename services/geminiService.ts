
import { requireSupabase } from './supabaseClient';

export const parseNaturalLanguageEvent = async (input: string) => {
  try {
    const supabase = requireSupabase();
    const { data, error } = await supabase.functions.invoke('gemini-parse', { body: { input } });
    if (error) {
      console.error(error);
      return null;
    }
    return data ?? null;
  } catch (e) {
    console.error(e);
    return null;
  }
};
