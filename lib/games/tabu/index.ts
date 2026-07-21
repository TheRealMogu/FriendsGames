import type { GameDefinition } from "../types";
import TabuLocalGame from "./LocalGame";

export const tabu: GameDefinition = {
  meta: {
    id: "tabu",
    name: "Tabù a tempo",
    tagline: "Descrivi la parola senza dirla. A tempo, a turni.",
    emoji: "⏱️",
    minPlayers: 2,
    maxPlayers: 12,
  },
  LocalGame: TabuLocalGame,
};
