import { pick } from "../shared/rng";
import type { LocalPlayer, ScoreDeltas } from "../types";

// VERO O FALSO
// Un'affermazione: vero o falso, in segreto. Punto a chi indovina. Meccanica
// oggettiva (non sociale): funziona benissimo anche in 2.

interface Item {
  testo: string;
  vero: boolean;
}

const ITEMS: readonly Item[] = [
  { testo: "Un polpo ha tre cuori.", vero: true },
  { testo: "La Grande Muraglia è visibile a occhio nudo dalla Luna.", vero: false },
  { testo: "Il miele non scade mai.", vero: true },
  { testo: "I fulmini non colpiscono mai due volte lo stesso punto.", vero: false },
  { testo: "Le banane sono tecnicamente bacche.", vero: true },
  { testo: "Il sangue è blu finché non tocca l'ossigeno.", vero: false },
  { testo: "La Torre Eiffel può diventare più alta d'estate.", vero: true },
  { testo: "I pesci rossi hanno memoria di soli 3 secondi.", vero: false },
  { testo: "Venere è il pianeta più caldo del sistema solare.", vero: true },
  { testo: "Gli struzzi nascondono la testa sotto la sabbia per paura.", vero: false },
  { testo: "Una giornata su Venere dura più di un suo anno.", vero: true },
  { testo: "Il cioccolato è velenoso per i cani.", vero: true },
  { testo: "Gli esseri umani usano solo il 10% del cervello.", vero: false },
  { testo: "Le lumache possono dormire per anni.", vero: true },
];

export interface VeroFalsoRound {
  testo: string;
  vero: boolean;
}

export function createVeroFalsoRound(): VeroFalsoRound {
  const it = pick(ITEMS);
  return { testo: it.testo, vero: it.vero };
}

export interface VeroFalsoResult {
  vero: boolean;
  answers: Record<string, boolean>;
  scores: ScoreDeltas;
}

export function resolveVeroFalso(
  players: LocalPlayer[],
  answers: Record<string, boolean>,
  vero: boolean
): VeroFalsoResult {
  const scores: ScoreDeltas = {};
  for (const p of players) {
    scores[p.id] = answers[p.id] === vero ? 1 : 0;
  }
  return { vero, answers, scores };
}
