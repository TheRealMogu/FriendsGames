import { pick } from "../shared/rng";
import type { LocalPlayer, ScoreDeltas } from "../types";

// L'INTRUSO
// Tutti ricevono la stessa domanda tranne uno: l'intruso, che sa solo di
// esserlo. A turno si risponde a voce; l'intruso deve bluffare. Poi si vota
// chi si crede sia l'intruso.

const DOMANDE: readonly string[] = [
  "Quanto costa una birra media al bar?",
  "A che ora ti sei svegnato stamattina?",
  "Quanti paia di scarpe hai in casa?",
  "Quanto dura il tuo tragitto per andare al lavoro?",
  "Quante volte a settimana mangi fuori?",
  "Quanti anni dai al tuo vicino di casa?",
  "Quanto spendi di spesa in una settimana?",
  "Quante app hai aperto sul telefono adesso?",
  "Quanto sei alto in centimetri?",
  "Quanti bicchieri d'acqua bevi in un giorno?",
  "Quanti messaggi non letti hai adesso?",
  "A quanti matrimoni sei stato in vita tua?",
];

export interface IntrusoSecret {
  intruso: boolean;
  domanda: string | null; // null per l'intruso: non conosce la domanda
}

export interface IntrusoRound {
  intrusoId: string;
  domanda: string;
  secrets: Record<string, IntrusoSecret>;
}

export function createIntrusoRound(players: LocalPlayer[]): IntrusoRound {
  const domanda = pick(DOMANDE);
  const intruso = pick(players);
  const secrets: Record<string, IntrusoSecret> = {};
  for (const p of players) {
    secrets[p.id] =
      p.id === intruso.id
        ? { intruso: true, domanda: null }
        : { intruso: false, domanda };
  }
  return { intrusoId: intruso.id, domanda, secrets };
}

export interface IntrusoResult {
  intrusoId: string;
  accusedId: string | null;
  intrusoScoperto: boolean;
  tally: Record<string, number>;
  scores: ScoreDeltas;
}

// votes: voterId -> accusedId. L'intruso viene "scoperto" se e' il piu' votato.
export function resolveIntruso(
  players: LocalPlayer[],
  intrusoId: string,
  votes: Record<string, string>
): IntrusoResult {
  const tally: Record<string, number> = {};
  for (const target of Object.values(votes)) {
    tally[target] = (tally[target] ?? 0) + 1;
  }

  let accusedId: string | null = null;
  let best = -1;
  for (const [id, n] of Object.entries(tally)) {
    if (n > best) {
      best = n;
      accusedId = id;
    }
  }

  const intrusoScoperto = accusedId === intrusoId;
  const scores: ScoreDeltas = {};
  for (const p of players) scores[p.id] = 0;

  if (intrusoScoperto) {
    for (const p of players) if (p.id !== intrusoId) scores[p.id] = 1;
  } else {
    scores[intrusoId] = 2; // l'intruso la fa franca
  }

  return { intrusoId, accusedId, intrusoScoperto, tally, scores };
}
