import { pick } from "../shared/rng";
import type { LocalPlayer, ScoreDeltas } from "../types";

// MAGGIORANZA
// Una domanda secca con due opzioni. Ognuno risponde in nascosto. Prende un
// punto chi finisce con la maggioranza. In caso di pareggio, nessun punto.

export type Choice = "a" | "b";

interface Domanda {
  q: string;
  a: string;
  b: string;
}

const DOMANDE: readonly Domanda[] = [
  { q: "Meglio...", a: "Cane", b: "Gatto" },
  { q: "Vacanza ideale?", a: "Mare", b: "Montagna" },
  { q: "Colazione?", a: "Dolce", b: "Salata" },
  { q: "Meglio guardare...", a: "Film", b: "Serie TV" },
  { q: "Pizza?", a: "Ananas sì", b: "Ananas no" },
  { q: "Come esci di casa?", a: "Sempre in orario", b: "Sempre in ritardo" },
  { q: "Il weekend?", a: "Uscire", b: "Restare a casa" },
  { q: "Caffè?", a: "Zucchero", b: "Amaro" },
  { q: "Preferisci...", a: "Estate", b: "Inverno" },
  { q: "Al ristorante scegli...", a: "Il solito", b: "Qualcosa di nuovo" },
  { q: "Musica in auto?", a: "Alta", b: "Bassa" },
  { q: "Meglio...", a: "Telefonare", b: "Scrivere" },
];

export interface MaggioranzaRound {
  domanda: string;
  a: string;
  b: string;
}

export function createMaggioranzaRound(): MaggioranzaRound {
  const d = pick(DOMANDE);
  return { domanda: d.q, a: d.a, b: d.b };
}

export interface MaggioranzaResult {
  counts: { a: number; b: number };
  majority: Choice | null; // null se pareggio
  scores: ScoreDeltas;
}

export function resolveMaggioranza(
  players: LocalPlayer[],
  answers: Record<string, Choice>
): MaggioranzaResult {
  let a = 0;
  let b = 0;
  for (const v of Object.values(answers)) {
    if (v === "a") a++;
    else b++;
  }
  const majority: Choice | null = a === b ? null : a > b ? "a" : "b";

  const scores: ScoreDeltas = {};
  for (const p of players) {
    scores[p.id] = majority && answers[p.id] === majority ? 1 : 0;
  }

  return { counts: { a, b }, majority, scores };
}
