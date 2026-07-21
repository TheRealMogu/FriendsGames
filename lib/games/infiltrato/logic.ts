import { pick } from "../shared/rng";
import type { LocalPlayer } from "../types";

// L'INFILTRATO (undercover con le parole)
// Tutti ricevono la stessa parola tranne l'infiltrato, che ne riceve una simile
// ma diversa — e non sa di essere lui. A turno si dice UNA parola collegata
// alla propria. Poi si vota. La risoluzione è identica all'Intruso, quindi
// riusiamo `resolveIntruso` (stesso punteggio: gruppo +1 se scoperto, +2 a chi
// la fa franca).
export { resolveIntruso as resolveInfiltrato } from "../intruso/logic";
export type { IntrusoResult as InfiltratoResult } from "../intruso/logic";

interface Coppia {
  comune: string;
  infiltrato: string;
}

const COPPIE: readonly Coppia[] = [
  { comune: "Caffè", infiltrato: "Tè" },
  { comune: "Mare", infiltrato: "Lago" },
  { comune: "Cane", infiltrato: "Lupo" },
  { comune: "Pizza", infiltrato: "Focaccia" },
  { comune: "Chitarra", infiltrato: "Violino" },
  { comune: "Treno", infiltrato: "Tram" },
  { comune: "Neve", infiltrato: "Ghiaccio" },
  { comune: "Calcio", infiltrato: "Rugby" },
  { comune: "Luna", infiltrato: "Sole" },
  { comune: "Vino", infiltrato: "Birra" },
  { comune: "Montagna", infiltrato: "Collina" },
  { comune: "Film", infiltrato: "Teatro" },
];

export interface InfiltratoSecret {
  word: string;
  infiltrato: boolean;
}

export interface InfiltratoRound {
  infiltratoId: string;
  comune: string;
  infiltrato: string;
  secrets: Record<string, InfiltratoSecret>;
}

export function createInfiltratoRound(players: LocalPlayer[]): InfiltratoRound {
  const coppia = pick(COPPIE);
  const infiltrato = pick(players);
  const secrets: Record<string, InfiltratoSecret> = {};
  for (const p of players) {
    secrets[p.id] =
      p.id === infiltrato.id
        ? { word: coppia.infiltrato, infiltrato: true }
        : { word: coppia.comune, infiltrato: false };
  }
  return {
    infiltratoId: infiltrato.id,
    comune: coppia.comune,
    infiltrato: coppia.infiltrato,
    secrets,
  };
}
