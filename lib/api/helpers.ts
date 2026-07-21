import "server-only";

import { NextResponse } from "next/server";
import type { ApiError } from "@/lib/types";

// Alfabeto del codice stanza: maiuscole senza caratteri ambigui.
// Escludi I e O (confondibili con 1 e 0). 0 e 1 non ci sono comunque:
// sono cifre, e il codice e' fatto solo di lettere.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ";
export const CODE_LENGTH = 4;
export const MAX_PLAYERS = 12;
export const NAME_MIN = 1;
export const NAME_MAX = 16;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[idx];
  }
  return code;
}

// Normalizza il codice ricevuto in input: maiuscolo, senza spazi.
export function normalizeCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  if (code.length !== CODE_LENGTH) return null;
  // Deve contenere solo caratteri validi.
  for (const ch of code) {
    if (!CODE_ALPHABET.includes(ch)) return null;
  }
  return code;
}

// Valida e normalizza il nome. Ritorna il nome trimmato o un messaggio d'errore.
export function validateName(
  raw: unknown
): { ok: true; name: string } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return { ok: false, error: "Nome mancante." };
  }
  const name = raw.trim();
  if (name.length < NAME_MIN) {
    return { ok: false, error: "Il nome non puo' essere vuoto." };
  }
  if (name.length > NAME_MAX) {
    return { ok: false, error: `Il nome puo' avere al massimo ${NAME_MAX} caratteri.` };
  }
  return { ok: true, name };
}

// player_token: deve essere una stringa non vuota (lo genera il client).
export function validatePlayerToken(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const token = raw.trim();
  return token.length > 0 ? token : null;
}

export function jsonError(message: string, status: number) {
  return NextResponse.json<ApiError>({ error: message }, { status });
}
