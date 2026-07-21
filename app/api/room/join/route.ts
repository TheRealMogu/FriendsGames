import "server-only";

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  normalizeCode,
  validateName,
  validatePlayerToken,
  jsonError,
  MAX_PLAYERS,
} from "@/lib/api/helpers";
import type { JoinRoomBody, JoinRoomResponse, PlayerRow } from "@/lib/types";

const PLAYER_COLS = "id, room_id, name, score, is_host, last_seen, created_at";

export async function POST(req: Request) {
  let body: JoinRoomBody;
  try {
    body = (await req.json()) as JoinRoomBody;
  } catch {
    return jsonError("Body non valido.", 400);
  }

  const code = normalizeCode(body?.code);
  if (!code) return jsonError("Codice stanza non valido.", 400);

  const nameCheck = validateName(body?.name);
  if (!nameCheck.ok) return jsonError(nameCheck.error, 400);

  const playerToken = validatePlayerToken(body?.player_token);
  if (!playerToken) return jsonError("player_token mancante.", 400);

  // La stanza esiste ed e' in lobby?
  const { data: room, error: roomError } = await supabaseAdmin
    .from("rooms")
    .select("id, phase")
    .eq("code", code)
    .maybeSingle();

  if (roomError) return jsonError("Errore nel leggere la stanza.", 500);
  if (!room) return jsonError("Stanza inesistente.", 404);
  if (room.phase !== "lobby") {
    return jsonError("La partita e' gia' iniziata.", 409);
  }

  const roomId = room.id as string;

  // Gestione refresh: se questo token e' gia' in stanza, restituisci il giocatore.
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("players")
    .select(PLAYER_COLS)
    .eq("room_id", roomId)
    .eq("player_token", playerToken)
    .maybeSingle();

  if (existingError) return jsonError("Errore nel leggere i giocatori.", 500);
  if (existing) {
    const response: JoinRoomResponse = {
      code,
      player_token: playerToken,
      player: existing as PlayerRow,
    };
    return NextResponse.json(response, { status: 200 });
  }

  // Serve la lista attuale per controllare capienza e nomi duplicati.
  const { data: players, error: listError } = await supabaseAdmin
    .from("players")
    .select("name")
    .eq("room_id", roomId);

  if (listError) return jsonError("Errore nel leggere i giocatori.", 500);

  if ((players?.length ?? 0) >= MAX_PLAYERS) {
    return jsonError(`La stanza e' piena (max ${MAX_PLAYERS} giocatori).`, 409);
  }

  const duplicate = (players ?? []).some(
    (p) => p.name.toLowerCase() === nameCheck.name.toLowerCase()
  );
  if (duplicate) {
    return jsonError("C'e' gia' qualcuno con questo nome nella stanza.", 409);
  }

  const { data: player, error: insertError } = await supabaseAdmin
    .from("players")
    .insert({
      room_id: roomId,
      name: nameCheck.name,
      player_token: playerToken,
      is_host: false,
    })
    .select(PLAYER_COLS)
    .single();

  if (insertError || !player) {
    return jsonError("Impossibile entrare nella stanza.", 500);
  }

  const response: JoinRoomResponse = {
    code,
    player_token: playerToken,
    player: player as PlayerRow,
  };
  return NextResponse.json(response, { status: 201 });
}
