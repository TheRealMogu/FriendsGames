"use client";

import { useMemo, useState } from "react";
import PassAround from "@/components/local/PassAround";
import Scoreboard from "@/components/local/Scoreboard";
import type { LocalGameProps, ScoreDeltas } from "../types";
import {
  createIntrusoRound,
  resolveIntruso,
  type IntrusoRound,
  type IntrusoResult,
} from "./logic";

type Phase = "deal" | "discuss" | "vote" | "reveal";

export default function IntrusoLocalGame({ players, onExit }: LocalGameProps) {
  const [round, setRound] = useState<IntrusoRound>(() =>
    createIntrusoRound(players)
  );
  const [phase, setPhase] = useState<Phase>("deal");
  const [result, setResult] = useState<IntrusoResult | null>(null);
  const [totals, setTotals] = useState<ScoreDeltas>(() =>
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );

  const nameOf = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p.name])),
    [players]
  );

  function newRound() {
    setRound(createIntrusoRound(players));
    setResult(null);
    setPhase("deal");
  }

  if (phase === "deal") {
    return (
      <PassAround<void>
        players={players}
        render={(player, done) => {
          const secret = round.secrets[player.id]!;
          return (
            <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
              {secret.intruso ? (
                <>
                  <div className="text-4xl font-black text-danger">
                    Sei l&apos;intruso
                  </div>
                  <p className="text-muted">
                    Non conosci la domanda. Ascolta, bluffa e non farti scoprire.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm uppercase tracking-widest text-muted">
                    La domanda è
                  </p>
                  <div className="text-2xl font-bold">{secret.domanda}</div>
                  <p className="text-muted">
                    Rispondi a voce al tuo turno. Uno di voi non ha questa
                    domanda…
                  </p>
                </>
              )}
              <button
                onClick={() => done()}
                className="min-h-16 w-full rounded-2xl bg-surface-2 px-6 text-lg font-bold active:opacity-80"
              >
                Ho visto — nascondi e passa
              </button>
            </main>
          );
        }}
        onComplete={() => setPhase("discuss")}
      />
    );
  }

  if (phase === "discuss") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div className="text-3xl font-black">Discutete!</div>
        <p className="text-muted">
          A turno, ognuno dà la sua risposta a voce. Fate domande. Quando siete
          pronti a smascherare l&apos;intruso, votate.
        </p>
        <button
          onClick={() => setPhase("vote")}
          className="min-h-16 w-full rounded-2xl bg-accent px-6 text-xl font-bold text-white active:bg-accent-strong"
        >
          Alla votazione
        </button>
      </main>
    );
  }

  if (phase === "vote") {
    return (
      <PassAround<string>
        players={players}
        handoverLabel="Vota in segreto —"
        render={(player, done) => (
          <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 px-6 py-8">
            <h2 className="text-center text-xl font-bold">
              Chi è l&apos;intruso?
            </h2>
            <div className="flex flex-col gap-2">
              {players
                .filter((p) => p.id !== player.id)
                .map((p) => (
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
          const res = resolveIntruso(players, round.intrusoId, votes);
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

  // reveal
  const res = result!;
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <div className="text-center">
        <p className="text-sm uppercase tracking-widest text-muted">
          L&apos;intruso era
        </p>
        <div className="mt-1 text-4xl font-black text-danger">
          {nameOf[res.intrusoId]}
        </div>
        <p className="mt-3 text-lg">
          {res.intrusoScoperto
            ? "Scoperto! Il gruppo vince."
            : "L'ha fatta franca! +2 all'intruso."}
        </p>
        <p className="mt-1 text-sm text-muted">
          Più votato: {res.accusedId ? nameOf[res.accusedId] : "—"}
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
