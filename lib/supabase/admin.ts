import "server-only"; // build error se questo file finisce nel bundle client

import { createClient } from "@supabase/supabase-js";

// Client service_role, SOLO lato server (API Route).
// Ignora le RLS: e' l'unico che puo' scrivere.

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceRoleKey) {
  throw new Error(
    "Mancano NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY nell'ambiente server"
  );
}

export const supabaseAdmin = createClient(url, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
