"use client";

import { useMemo, useState } from "react";
import PassAround from "@/components/local/PassAround";
import Scoreboard from "@/components/local/Scoreboard";
import type { LocalGameProps, ScoreDeltas } from "../types";
import {
  createPiuProbabileRound,
  resolvePiuProbabile,
  type PiuProbabileRound,
  type PiuProbabileResult,
} from "./logic";

type Phase = "vote" | "reveal";

export default function PiuProbabileLocalGame({
  players,
  onExit,
}: LocalGameProps) {
  const [round, setRound] = useState<PiuProbabileRound>(() =>
    createPiuProbabileRound()
  );
  const [phase, setPhase] = useState<Phase>("vote");
  const [result, setResult] = useState<PiuProbabileResult | null>(null);
  const [totals, setTotals] = useState<ScoreDeltas>(() =>
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );

  const nameOf = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p.name])),
    [players]
  );

  function newRound() {
    setRound(createPiuProbabileRound());
    setResult(null);
    setPhase("vote");
  }

  if (phase === "vote") {
    return (
      <PassAround<string>
        players={players}
        handoverLabel="Vota in segreto —"
        render={(_player, done) => (
          <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-6 py-8">
            <h2 className="text-center text-xl font-bold">
              Chi è più probabile che {round.prompt}?
            </h2>
            <div className="flex flex-col gap-2">
              {players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => done(p.id)}
                  className="min-h-14 rounded-2xl border border-border bg-surface px-4 text-lg font-semibold active:bg-surface-2"
                >
                  {p.name}
                </button>
              ))}
            </div>
          </main>
        )}
        onComplete={(votes) => {
          const res = resolvePiuProbabile(players, votes);
          setResult(res);
          setTotals((prev) => {
            const next = { ...prev };
            for (const p of players) next[p.id] += res.scores[p.id] ?? 0;
            return next;
          });
          setPhase("reveal");
        }}
      />
    );
  }

  const res = result!;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <div className="text-center">
        <p className="text-sm text-muted">Chi è più probabile che {round.prompt}?</p>
        <div className="mt-2 text-4xl font-black text-accent">
          {res.winnerId ? nameOf[res.winnerId] : "—"}
        </div>
        <p className="mt-2 text-sm text-muted">
          {res.winnerId
            ? `${res.tally[res.winnerId] ?? 0} voti · +1 a chi l'aveva votato`
            : "Nessun voto"}
        </p>
      </div>

      <Scoreboard players={players} totals={totals} />

      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={newRound}
          className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-white active:bg-accent-strong"
        >
          Nuovo round
        </button>
        <button
          onClick={() => onExit(totals)}
          className="min-h-12 text-center text-muted active:underline"
        >
          Torna ai giochi
        </button>
      </div>
    </main>
  );
}
