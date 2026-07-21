// Tipi condivisi tra client e server: righe del DB e payload delle API.

// --- Righe del database (solo colonne che il client puo' leggere) ---

export type RoomPhase = "lobby" | "playing" | "ended";

export interface RoomRow {
  id: string;
  code: string;
  phase: RoomPhase;
  game_id: string | null;
  round_no: number;
  created_at: string;
}

export interface PlayerRow {
  id: string;
  room_id: string;
  name: string;
  score: number;
  is_host: boolean;
  last_seen: string;
  created_at: string;
  // player_token NON e' incluso: e' un segreto, non serve al render della lista.
}

// --- Payload e risposte delle API Route ---

export interface CreateRoomBody {
  name: string;
  player_token: string;
}

export interface CreateRoomResponse {
  code: string;
  player_token: string;
  host_token: string;
  player: PlayerRow;
}

export interface JoinRoomBody {
  code: string;
  name: string;
  player_token: string;
}

export interface JoinRoomResponse {
  code: string;
  player_token: string;
  player: PlayerRow;
}

export interface HeartbeatBody {
  code: string;
  player_token: string;
}

export interface HeartbeatResponse {
  ok: true;
}

// Forma uniforme degli errori restituiti dalle API.
export interface ApiError {
  error: string;
}
