import type { GameDefinition } from "../types";
import MaggioranzaLocalGame from "./LocalGame";

export const maggioranza: GameDefinition = {
  meta: {
    id: "maggioranza",
    name: "Maggioranza",
    tagline: "Rispondi in segreto. Punto a chi sta col gruppo.",
    emoji: "🗳️",
    minPlayers: 2,
    maxPlayers: 12,
  },
  LocalGame: MaggioranzaLocalGame,
};
