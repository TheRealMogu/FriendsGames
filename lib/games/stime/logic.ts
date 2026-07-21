import { pick } from "../shared/rng";
import type { LocalPlayer, ScoreDeltas } from "../types";

// STIME
// Una domanda con risposta numerica. Ognuno scrive la sua stima in segreto.
// Il più vicino prende 2 punti, il secondo più vicino 1 (pari merito inclusi).

interface Domanda {
  q: string;
  answer: number;
  unit?: string;
}

const DOMANDE: readonly Domanda[] = [
  { q: "Quante ossa ha il corpo umano adulto?", answer: 206 },
  { q: "Quanti anni è durata la Guerra dei cent'anni?", answer: 116 },
  { q: "Quanti denti ha un adulto (giudizio inclusi)?", answer: 32 },
  { q: "Quanti Paesi ci sono in Africa?", answer: 54 },
  { q: "A quanti km/h corre un ghepardo al massimo?", answer: 110, unit: "km/h" },
  { q: "Quanti tasti ha un pianoforte classico?", answer: 88 },
  { q: "Quanti cuori ha un polpo?", answer: 3 },
  { q: "In che anno è caduto il Muro di Berlino?", answer: 1989 },
  { q: "Quanti muscoli servono per sorridere (circa)?", answer: 12 },
  { q: "Quante stringhe ('battute') ha al massimo un tweet oggi?", answer: 280 },
  { q: "Quanti giorni dura la gestazione di un elefante?", answer: 640 },
  { q: "A quanti gradi bolle l'acqua sull'Everest (circa)?", answer: 70, unit: "°C" },
];

export interface StimeRound {
  domanda: string;
  answer: number;
  unit?: string;
}

export function createStimeRound(): StimeRound {
  const d = pick(DOMANDE);
  return { domanda: d.q, answer: d.answer, unit: d.unit };
}

export interface StimeResult {
  answer: number;
  guesses: Record<string, number>;
  scores: ScoreDeltas;
}

export function resolveStime(
  players: LocalPlayer[],
  guesses: Record<string, number>,
  answer: number
): StimeResult {
  const scores: ScoreDeltas = {};
  for (const p of players) scores[p.id] = 0;

  const ranked = Object.entries(guesses)
    .map(([id, g]) => ({ id, d: Math.abs(g - answer) }))
    .sort((a, b) => a.d - b.d);

  if (ranked.length > 0) {
    const bestD = ranked[0]!.d;
    for (const e of ranked) if (e.d === bestD) scores[e.id] = 2;

    const rest = ranked.filter((e) => e.d > bestD);
    if (rest.length > 0) {
      const secondD = rest[0]!.d;
      for (const e of rest) if (e.d === secondD) scores[e.id] = 1;
    }
  }

  return { answer, guesses, scores };
}
