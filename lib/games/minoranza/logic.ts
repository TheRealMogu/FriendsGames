import { pick } from "../shared/rng";
import type { LocalPlayer, ScoreDeltas } from "../types";

// MINORANZA
// Un'affermazione divisiva: d'accordo o contrario, in segreto. Qui vince chi
// sta con il gruppo PIÙ PICCOLO. In caso di pareggio, nessun punto.

export type Side = "a" | "b"; // a = d'accordo, b = contrario

const AFFERMAZIONI: readonly string[] = [
  "L'ananas sulla pizza è buono",
  "I gatti sono meglio dei cani",
  "Il calcio è noioso",
  "La colazione salata batte quella dolce",
  "I film sono meglio dei libri",
  "Andare in palestra la mattina presto è il top",
  "La pasta scotta è un crimine imperdonabile",
  "Il karaoke è divertente",
  "Le vacanze in città battono quelle al mare",
  "Rispondere ai vocali lunghi è una tortura",
  "Il lunedì non è poi così male",
  "I regali di Natale sono sopravvalutati",
];

export interface MinoranzaRound {
  affermazione: string;
}

export function createMinoranzaRound(): MinoranzaRound {
  return { affermazione: pick(AFFERMAZIONI) };
}

export interface MinoranzaResult {
  counts: { a: number; b: number };
  minority: Side | null; // null se pareggio
  scores: ScoreDeltas;
}

export function resolveMinoranza(
  players: LocalPlayer[],
  answers: Record<string, Side>
): MinoranzaResult {
  let a = 0;
  let b = 0;
  for (const v of Object.values(answers)) {
    if (v === "a") a++;
    else b++;
  }
  const minority: Side | null = a === b ? null : a < b ? "a" : "b";

  const scores: ScoreDeltas = {};
  for (const p of players) {
    scores[p.id] = minority && answers[p.id] === minority ? 1 : 0;
  }

  return { counts: { a, b }, minority, scores };
}
