import type { GameDefinition } from "../types";
import PiuProbabileLocalGame from "./LocalGame";

export const piuprobabile: GameDefinition = {
  meta: {
    id: "piuprobabile",
    name: "Più probabile",
    tagline: "«Chi è più probabile che…?» Votate e ridete.",
    emoji: "🎲",
    minPlayers: 3,
    maxPlayers: 12,
  },
  LocalGame: PiuProbabileLocalGame,
};
