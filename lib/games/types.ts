import type { ComponentType } from "react";

// Un giocatore in modalita' locale (hotseat): vive nel browser, niente rete.
// L'id e' generato sul device ("p0", "p1"...), non e' il player_token online.
export interface LocalPlayer {
  id: string;
  name: string;
}

// Variazioni di punteggio a fine round, per giocatore.
export type ScoreDeltas = Record<string, number>;

// Metadati di un gioco: quel che serve per mostrarlo nella libreria e
// sapere con quanti si gioca.
export interface GameMeta {
  id: string;
  name: string;
  tagline: string;
  emoji: string;
  minPlayers: number;
  maxPlayers: number;
}

export interface LocalGameProps {
  players: LocalPlayer[];
  // Il gioco chiama questo quando l'utente esce, passando i punti accumulati.
  onExit: (deltas: ScoreDeltas) => void;
}

// La definizione di un gioco nella libreria. La logica pura sta nei rispettivi
// `logic.ts` (trasporto-agnostica, riusabile online in futuro); qui la
// colleghiamo alla UI locale.
export interface GameDefinition {
  meta: GameMeta;
  LocalGame: ComponentType<LocalGameProps>;
}
