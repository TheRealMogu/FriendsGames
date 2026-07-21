"use client";

import { useState } from "react";
import PassAround from "@/components/local/PassAround";
import Scoreboard from "@/components/local/Scoreboard";
import type { LocalGameProps, ScoreDeltas } from "../types";
import {
  createMinoranzaRound,
  resolveMinoranza,
  type Side,
  type MinoranzaRound,
  type MinoranzaResult,
} from "./logic";

type Phase = "answer" | "reveal";

export default function MinoranzaLocalGame({ players, onExit }: LocalGameProps) {
  const [round, setRound] = useState<MinoranzaRound>(() =>
    createMinoranzaRound()
  );
  const [phase, setPhase] = useState<Phase>("answer");
  const [result, setResult] = useState<MinoranzaResult | null>(null);
  const [totals, setTotals] = useState<ScoreDeltas>(() =>
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );

  function newRound() {
    setRound(createMinoranzaRound());
    setResult(null);
    setPhase("answer");
  }

  if (phase === "answer") {
    return (
      <PassAround<Side>
        players={players}
        handoverLabel="Rispondi in segreto —"
        render={(_player, done) => (
          <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-8">
            <p className="text-center text-sm uppercase tracking-widest text-muted">
              Stai con la minoranza per fare punti
            </p>
            <h2 className="text-center text-2xl font-bold">
              «{round.affermazione}»
            </h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => done("a")}
                className="min-h-20 rounded-2xl border border-border bg-surface px-6 text-xl font-bold active:bg-surface-2"
              >
                D&apos;accordo
              </button>
              <button
                onClick={() => done("b")}
                className="min-h-20 rounded-2xl border border-border bg-surface px-6 text-xl font-bold active:bg-surface-2"
              >
                Contrario
              </button>
            </div>
          </main>
        )}
        onComplete={(answers) => {
          const res = resolveMinoranza(players, answers);
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
  const minLabel =
    res.minority === "a"
      ? "D'accordo"
      : res.minority === "b"
        ? "Contrario"
        : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <div className="text-center">
        <h2 className="text-xl font-bold">«{round.affermazione}»</h2>
        <div className="mt-4 flex items-stretch gap-3">
          <Tally label="D'accordo" count={res.counts.a} win={res.minority === "a"} />
          <Tally label="Contrario" count={res.counts.b} win={res.minority === "b"} />
        </div>
        <p className="mt-4 text-lg">
          {minLabel
            ? `Minoranza: ${minLabel} (+1 a chi c'era)`
            : "Pareggio! Nessun punto."}
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

function Tally({
  label,
  count,
  win,
}: {
  label: string;
  count: number;
  win: boolean;
}) {
  return (
    <div
      className={`flex flex-1 flex-col items-center gap-1 rounded-2xl border px-3 py-4 ${
        win ? "border-accent bg-accent/10" : "border-border bg-surface"
      }`}
    >
      <span className="text-3xl font-black tabular-nums">{count}</span>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}
