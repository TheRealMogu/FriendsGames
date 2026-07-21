import type { GameDefinition } from "../types";
import MinoranzaLocalGame from "./LocalGame";

export const minoranza: GameDefinition = {
  meta: {
    id: "minoranza",
    name: "Minoranza",
    tagline: "Opinioni divisive: qui il punto va a chi è controcorrente.",
    emoji: "⚖️",
    minPlayers: 3,
    maxPlayers: 12,
  },
  LocalGame: MinoranzaLocalGame,
};
