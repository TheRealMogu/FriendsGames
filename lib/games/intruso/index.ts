import type { GameDefinition } from "../types";
import IntrusoLocalGame from "./LocalGame";

export const intruso: GameDefinition = {
  meta: {
    id: "intruso",
    name: "L'Intruso",
    tagline: "Uno di voi non ha la stessa domanda. Scovatelo.",
    emoji: "🕵️",
    minPlayers: 3,
    maxPlayers: 10,
  },
  LocalGame: IntrusoLocalGame,
};
