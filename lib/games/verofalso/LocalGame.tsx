"use client";

import { useState } from "react";
import PassAround from "@/components/local/PassAround";
import Scoreboard from "@/components/local/Scoreboard";
import type { LocalGameProps, ScoreDeltas } from "../types";
import {
  createVeroFalsoRound,
  resolveVeroFalso,
  type VeroFalsoRound,
  type VeroFalsoResult,
} from "./logic";

type Phase = "answer" | "reveal";

export default function VeroFalsoLocalGame({ players, onExit }: LocalGameProps) {
  const [round, setRound] = useState<VeroFalsoRound>(() =>
    createVeroFalsoRound()
  );
  const [phase, setPhase] = useState<Phase>("answer");
  const [result, setResult] = useState<VeroFalsoResult | null>(null);
  const [totals, setTotals] = useState<ScoreDeltas>(() =>
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );

  function newRound() {
    setRound(createVeroFalsoRound());
    setResult(null);
    setPhase("answer");
  }

  if (phase === "answer") {
    return (
      <PassAround<boolean>
        players={players}
        handoverLabel="Rispondi in segreto —"
        render={(_player, done) => (
          <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-8">
            <h2 className="text-center text-2xl font-bold">{round.testo}</h2>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => done(true)}
                className="min-h-20 rounded-2xl border border-border bg-surface px-6 text-xl font-bold active:bg-surface-2"
              >
                Vero
              </button>
              <button
                onClick={() => done(false)}
                className="min-h-20 rounded-2xl border border-border bg-surface px-6 text-xl font-bold active:bg-surface-2"
              >
                Falso
              </button>
            </div>
          </main>
        )}
        onComplete={(answers) => {
          const res = resolveVeroFalso(players, answers, round.vero);
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
        <h2 className="text-xl font-bold">{round.testo}</h2>
        <div
          className={`mt-3 text-4xl font-black ${
            res.vero ? "text-ok" : "text-danger"
          }`}
        >
          {res.vero ? "VERO" : "FALSO"}
        </div>
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        {players.map((p) => {
          const right = res.answers[p.id] === res.vero;
          return (
            <li key={p.id} className="flex justify-between text-muted">
              <span>
                {p.name}: {res.answers[p.id] ? "Vero" : "Falso"}
              </span>
              <span className={right ? "font-bold text-ok" : "text-danger"}>
                {right ? "+1" : "—"}
              </span>
            </li>
          );
        })}
      </ul>

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
