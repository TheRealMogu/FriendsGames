import "server-only";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  generateRoomCode,
  validateName,
  validatePlayerToken,
  jsonError,
} from "@/lib/api/helpers";
import { rateLimit, clientIp } from "@/lib/api/rateLimit";
import type { CreateRoomBody, CreateRoomResponse, PlayerRow } from "@/lib/types";

// Postgres: violazione di unique constraint.
const UNIQUE_VIOLATION = "23505";
const MAX_CODE_ATTEMPTS = 5;

// Max 5 stanze al minuto per IP: frena chi crea stanze in loop.
const CREATE_MAX = 5;
const CREATE_WINDOW_MS = 60_000;

export async function POST(req: Request) {
  const limit = rateLimit(`create:${clientIp(req)}`, CREATE_MAX, CREATE_WINDOW_MS);
  if (!limit.ok) {
    const seconds = Math.ceil(limit.retryAfterMs / 1000);
    return jsonError(
      `Troppe stanze create. Riprova tra ${seconds} secondi.`,
      429
    );
  }

  let body: CreateRoomBody;
  try {
    body = (await req.json()) as CreateRoomBody;
  } catch {
    return jsonError("Body non valido.", 400);
  }

  const nameCheck = validateName(body?.name);
  if (!nameCheck.ok) return jsonError(nameCheck.error, 400);

  const playerToken = validatePlayerToken(body?.player_token);
  if (!playerToken) return jsonError("player_token mancante.", 400);

  const supabaseAdmin = getSupabaseAdmin();
  const hostToken = crypto.randomUUID();

  // Il codice ha una unique constraint: se collide, rigenera e riprova.
  let roomId: string | null = null;
  let code = "";
  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    code = generateRoomCode();
    const { data, error } = await supabaseAdmin
      .from("rooms")
      .insert({ code, phase: "lobby" })
      .select("id")
      .single();

    if (!error && data) {
      roomId = data.id as string;
      break;
    }
    if (error && error.code !== UNIQUE_VIOLATION) {
      return jsonError("Impossibile creare la stanza.", 500);
    }
    // altrimenti: collisione sul code, ritenta con un nuovo codice
  }

  if (!roomId) {
    return jsonError("Impossibile generare un codice stanza. Riprova.", 503);
  }

  // Il segreto della stanza in tabella separata (invisibile al client).
  const { error: secretError } = await supabaseAdmin
    .from("room_secrets")
    .insert({ room_id: roomId, host_token: hostToken });

  if (secretError) {
    // Rollback best-effort: senza segreto la stanza e' inutilizzabile.
    await supabaseAdmin.from("rooms").delete().eq("id", roomId);
    return jsonError("Impossibile creare la stanza.", 500);
  }

  // Primo giocatore = host.
  const { data: player, error: playerError } = await supabaseAdmin
    .from("players")
    .insert({
      room_id: roomId,
      name: nameCheck.name,
      player_token: playerToken,
      is_host: true,
    })
    .select("id, room_id, name, score, is_host, last_seen, created_at")
    .single();

  if (playerError || !player) {
    await supabaseAdmin.from("rooms").delete().eq("id", roomId);
    return jsonError("Impossibile creare il giocatore host.", 500);
  }

  const response: CreateRoomResponse = {
    code,
    player_token: playerToken,
    host_token: hostToken,
    player: player as PlayerRow,
  };
  return NextResponse.json(response, { status: 201 });
}
