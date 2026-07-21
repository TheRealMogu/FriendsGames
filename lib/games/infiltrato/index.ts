import type { GameDefinition } from "../types";
import InfiltratoLocalGame from "./LocalGame";

export const infiltrato: GameDefinition = {
  meta: {
    id: "infiltrato",
    name: "L'Infiltrato",
    tagline: "Come l'Intruso, ma con le parole. Uno ne ha una diversa.",
    emoji: "🦫",
    minPlayers: 3,
    maxPlayers: 10,
  },
  LocalGame: InfiltratoLocalGame,
};
