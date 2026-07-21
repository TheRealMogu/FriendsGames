import type { GameDefinition } from "../types";
import FrequenzaLocalGame from "./LocalGame";

export const frequenza: GameDefinition = {
  meta: {
    id: "frequenza",
    name: "Frequenza",
    tagline: "Un indizio, una scala. Avvicinati all'obiettivo segreto.",
    emoji: "🎯",
    minPlayers: 3,
    maxPlayers: 10,
  },
  LocalGame: FrequenzaLocalGame,
};
