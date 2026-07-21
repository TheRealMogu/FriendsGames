import type { GameDefinition } from "../types";
import VeroFalsoLocalGame from "./LocalGame";

export const verofalso: GameDefinition = {
  meta: {
    id: "verofalso",
    name: "Vero o Falso",
    tagline: "Trivia secca: indovina se è vero. Anche in due.",
    emoji: "✅",
    minPlayers: 2,
    maxPlayers: 12,
  },
  LocalGame: VeroFalsoLocalGame,
};
