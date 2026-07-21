import { pick, randomInt } from "../shared/rng";
import type { LocalPlayer, ScoreDeltas } from "../types";

// FREQUENZA
// C'e' una scala fra due poli e un valore-obiettivo segreto, noto solo a chi
// da' l'indizio. Chi da' l'indizio dice UNA parola/frase a voce; gli altri
// piazzano il cursore dove pensano sia l'obiettivo. Piu' ti avvicini, piu'
// punti. Chi ha dato l'indizio guadagna in base a quanto bene ha fatto
// avvicinare il gruppo.

interface Scala {
  min: string;
  max: string;
}

const SCALE: readonly Scala[] = [
  { min: "Freddo", max: "Caldo" },
  { min: "Inutile", max: "Indispensabile" },
  { min: "Sopravvalutato", max: "Sottovalutato" },
  { min: "Brutto", max: "Bello" },
  { min: "Economico", max: "Costoso" },
  { min: "Noioso", max: "Emozionante" },
  { min: "Sano", max: "Dannoso" },
  { min: "Comune", max: "Raro" },
  { min: "Facile", max: "Difficile" },
  { min: "Silenzioso", max: "Rumoroso" },
  { min: "Antico", max: "Moderno" },
  { min: "Debole", max: "Potente" },
];

export interface FrequenzaRound {
  clueGiverId: string;
  poloMin: string;
  poloMax: string;
  target: number; // 0..100, segreto
}

export function createFrequenzaRound(players: LocalPlayer[]): FrequenzaRound {
  const s = pick(SCALE);
  const clueGiver = pick(players);
  return {
    clueGiverId: clueGiver.id,
    poloMin: s.min,
    poloMax: s.max,
    target: randomInt(5, 95),
  };
}

// Punti in base alla distanza dall'obiettivo (0 = centro pieno).
export function pointsForDistance(distance: number): number {
  if (distance <= 5) return 4;
  if (distance <= 12) return 3;
  if (distance <= 22) return 2;
  if (distance <= 35) return 1;
  return 0;
}

export interface FrequenzaResult {
  target: number;
  guesses: Record<string, number>;
  scores: ScoreDeltas;
}

export function resolveFrequenza(
  players: LocalPlayer[],
  clueGiverId: string,
  target: number,
  guesses: Record<string, number>
): FrequenzaResult {
  const scores: ScoreDeltas = {};
  for (const p of players) scores[p.id] = 0;

  let sum = 0;
  let n = 0;
  for (const [id, g] of Object.entries(guesses)) {
    const pts = pointsForDistance(Math.abs(g - target));
    scores[id] = pts;
    sum += pts;
    n += 1;
  }
  // Chi ha dato l'indizio: premiato per la media degli altri.
  scores[clueGiverId] = n > 0 ? Math.round(sum / n) : 0;

  return { target, guesses, scores };
}
