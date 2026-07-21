import "server-only";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeCode, validatePlayerToken, jsonError } from "@/lib/api/helpers";
import type { HeartbeatBody, HeartbeatResponse } from "@/lib/types";

export async function POST(req: Request) {
  let body: HeartbeatBody;
  try {
    body = (await req.json()) as HeartbeatBody;
  } catch {
    return jsonError("Body non valido.", 400);
  }

  const code = normalizeCode(body?.code);
  if (!code) return jsonError("Codice stanza non valido.", 400);

  const playerToken = validatePlayerToken(body?.player_token);
  if (!playerToken) return jsonError("player_token mancante.", 400);

  const supabaseAdmin = getSupabaseAdmin();

  const { data: room, error: roomError } = await supabaseAdmin
    .from("rooms")
    .select("id")
    .eq("code", code)
    .maybeSingle();

  if (roomError) return jsonError("Errore nel leggere la stanza.", 500);
  if (!room) return jsonError("Stanza inesistente.", 404);

  const { error: updateError } = await supabaseAdmin
    .from("players")
    .update({ last_seen: new Date().toISOString() })
    .eq("room_id", room.id)
    .eq("player_token", playerToken);

  if (updateError) return jsonError("Impossibile aggiornare last_seen.", 500);

  return NextResponse.json<HeartbeatResponse>({ ok: true }, { status: 200 });
}
