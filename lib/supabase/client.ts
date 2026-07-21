import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client anonimo, per il BROWSER.
// Puo' solo leggere (le RLS lo vincolano) e ricevere gli eventi Realtime.
// Non scrive mai: ogni scrittura passa dalle API Route.
//
// Inizializzazione lazy: si crea alla prima chiamata, non all'import, cosi'
// il build non lo istanzia durante il page data collection.

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Mancano NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
    );
  }

  cached = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
