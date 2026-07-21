import type { GameDefinition } from "./types";
import { intruso } from "./intruso";
import { infiltrato } from "./infiltrato";
import { maggioranza } from "./maggioranza";
import { minoranza } from "./minoranza";
import { piuprobabile } from "./piuprobabile";
import { stime } from "./stime";
import { frequenza } from "./frequenza";
import { verofalso } from "./verofalso";
import { tabu } from "./tabu";

// La libreria dei giochi. Aggiungerne uno = importarlo e metterlo in questa
// lista. La logica pura di ciascuno (in `*/logic.ts`) e' trasporto-agnostica,
// quindi lo stesso gioco potra' girare anche online.
export const GAMES: readonly GameDefinition[] = [
  intruso,
  infiltrato,
  maggioranza,
  minoranza,
  piuprobabile,
  stime,
  verofalso,
  tabu,
  frequenza,
];

export function getGame(id: string): GameDefinition | undefined {
  return GAMES.find((g) => g.meta.id === id);
}
