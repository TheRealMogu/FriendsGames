import type { LocalPlayer, ScoreDeltas } from "@/lib/games/types";

// Classifica ordinata per punteggio decrescente. Condivisa da tutti i giochi.
export default function Scoreboard({
  players,
  totals,
  highlight,
}: {
  players: LocalPlayer[];
  totals: ScoreDeltas;
  highlight?: string; // id da evidenziare (es. chi ha dato l'indizio)
}) {
  const ranked = [...players].sort(
    (a, b) => (totals[b.id] ?? 0) - (totals[a.id] ?? 0)
  );
  return (
    <ul className="flex flex-col gap-2">
      {ranked.map((p) => (
        <li
          key={p.id}
          className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
            p.id === highlight
              ? "border-accent bg-accent/10"
              : "border-border bg-surface"
          }`}
        >
          <span className="text-lg font-semibold">{p.name}</span>
          <span className="text-lg font-black tabular-nums">
            {totals[p.id] ?? 0}
          </span>
        </li>
      ))}
    </ul>
  );
}
