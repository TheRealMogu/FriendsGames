import { createClient } from "@supabase/supabase-js";

// Client anonimo, per il BROWSER.
// Puo' solo leggere (le RLS lo vincolano) e ricevere gli eventi Realtime.
// Non scrive mai: ogni scrittura passa dalle API Route.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Mancano NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local"
  );
}

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
