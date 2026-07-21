import "server-only"; // build error se questo file finisce nel bundle client

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client service_role, SOLO lato server (API Route).
// Ignora le RLS: e' l'unico che puo' scrivere.
//
// Inizializzazione lazy: il client si crea alla prima chiamata (a runtime),
// non all'import. Cosi' `next build` puo' caricare il modulo della route
// senza avere le env, e l'errore su env mancanti scatta solo a runtime.

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY nell'ambiente server"
    );
  }

  cached = createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  return cached;
}
