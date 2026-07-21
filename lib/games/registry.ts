import type { GameDefinition } from "./types";
import { intruso } from "./intruso";
import { maggioranza } from "./maggioranza";
import { frequenza } from "./frequenza";

// La libreria dei giochi. Aggiungerne uno = importarlo e metterlo in questa
// lista. La logica pura di ciascuno (in `*/logic.ts`) e' trasporto-agnostica,
// quindi lo stesso gioco potra' girare anche online.
export const GAMES: readonly GameDefinition[] = [intruso, maggioranza, frequenza];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.meta.id === id);
}
