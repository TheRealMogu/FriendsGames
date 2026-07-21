"use client";

import { useState, type ReactNode } from "react";
import type { LocalPlayer } from "@/lib/games/types";

// Primitiva del pass-and-play: mostra a turno a ciascun giocatore una schermata
// PRIVATA, con una "copertina" davanti finche' non conferma di avere in mano il
// telefono. Serve sia a mostrare un segreto (T = void) sia a raccogliere un
// input nascosto (T = scelta, valore...). Al termine chiama onComplete con
// tutto cio' che ha raccolto, indicizzato per giocatore.
export default function PassAround<T>({
  players,
  handoverLabel,
  render,
  onComplete,
}: {
  players: LocalPlayer[];
  handoverLabel?: string;
  render: (player: LocalPlayer, done: (data: T) => void) => ReactNode;
  onComplete: (collected: Record<string, T>) => void;
}) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [collected, setCollected] = useState<Record<string, T>>({});

  const player = players[index]!;

  function done(data: T) {
    const next = { ...collected, [player.id]: data };
    setCollected(next);
    if (index + 1 >= players.length) {
      onComplete(next);
    } else {
      setIndex(index + 1);
      setRevealed(false);
    }
  }

  if (!revealed) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm uppercase tracking-widest text-muted">
          {handoverLabel ?? "Passa il telefono a"}
        </p>
        <div className="text-5xl font-black">{player.name}</div>
        <button
          onClick={() => setRevealed(true)}
          className="min-h-16 w-full rounded-2xl bg-accent px-6 text-xl font-bold text-white active:bg-accent-strong"
        >
          Sono {player.name} — tocca
        </button>
        <p className="text-xs text-muted">
          {index + 1} di {players.length} · non far vedere agli altri
        </p>
      </main>
    );
  }

  return <>{render(player, done)}</>;
}
