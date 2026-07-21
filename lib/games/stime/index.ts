import type { GameDefinition } from "../types";
import StimeLocalGame from "./LocalGame";

export const stime: GameDefinition = {
  meta: {
    id: "stime",
    name: "Stime",
    tagline: "Trivia numerica: il più vicino vince.",
    emoji: "🧠",
    minPlayers: 2,
    maxPlayers: 12,
  },
  LocalGame: StimeLocalGame,
};
