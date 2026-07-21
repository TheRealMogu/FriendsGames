import { pick } from "../shared/rng";
import type { LocalPlayer, ScoreDeltas } from "../types";

// PIÙ PROBABILE
// "Chi è più probabile che...?" Ognuno vota (anche se stesso). Il più votato
// "vince" la nomination; prende un punto chi aveva indovinato il gruppo.

const PROMPTS: readonly string[] = [
  "dimentichi il compleanno di un amico",
  "diventi famoso sui social",
  "parta per un viaggio all'ultimo minuto",
  "finisca a parlare con uno sconosciuto al bar",
  "resti sveglio fino all'alba",
  "perda il telefono durante una serata",
  "diventi milionario per fortuna",
  "litighi per l'ultima fetta di pizza",
  "si commuova guardando una pubblicità",
  "arrivi in ritardo al proprio matrimonio",
  "mandi un messaggio alla persona sbagliata",
  "sappia tutte le parole di una canzone trash",
  "molli tutto per vivere su un'isola",
  "cada dormendo in piedi",
];

export interface PiuProbabileRound {
  prompt: string;
}

export function createPiuProbabileRound(): PiuProbabileRound {
  return { prompt: pick(PROMPTS) };
}

export interface PiuProbabileResult {
  winnerId: string | null;
  tally: Record<string, number>;
  scores: ScoreDeltas;
}

export function resolvePiuProbabile(
  players: LocalPlayer[],
  votes: Record<string, string>
): PiuProbabileResult {
  const tally: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }

  let winnerId: string | null = null;
  let best = -1;
  for (const [id, n] of Object.entries(tally)) {
    if (n > best) {
      best = n;
      winnerId = id;
    }
  }

  const scores: ScoreDeltas = {};
  for (const p of players) scores[p.id] = 0;
  if (winnerId) {
    for (const [voter, target] of Object.entries(votes)) {
      if (target === winnerId) scores[voter] = 1;
    }
  }

  return { winnerId, tally, scores };
}
