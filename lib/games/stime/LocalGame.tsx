"use client";

import { useMemo, useState } from "react";
import PassAround from "@/components/local/PassAround";
import Scoreboard from "@/components/local/Scoreboard";
import type { LocalGameProps, ScoreDeltas } from "../types";
import {
  createStimeRound,
  resolveStime,
  type StimeRound,
  type StimeResult,
} from "./logic";

type Phase = "guess" | "reveal";

export default function StimeLocalGame({ players, onExit }: LocalGameProps) {
  const [round, setRound] = useState<StimeRound>(() => createStimeRound());
  const [phase, setPhase] = useState<Phase>("guess");
  const [result, setResult] = useState<StimeResult | null>(null);
  const [totals, setTotals] = useState<ScoreDeltas>(() =>
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );

  const nameOf = useMemo(
    () => Object.fromEntries(players.map((p) => [p.id, p.name])),
    [players]
  );

  function newRound() {
    setRound(createStimeRound());
    setResult(null);
    setPhase("guess");
  }

  if (phase === "guess") {
    return (
      <PassAround<number>
        players={players}
        handoverLabel="Scrivi la tua stima —"
        render={(_player, done) => (
          <NumberGuess domanda={round.domanda} unit={round.unit} onConfirm={done} />
        )}
        onComplete={(guesses) => {
          const res = resolveStime(players, guesses, round.answer);
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
  const ranked = [...players]
    .map((p) => ({ p, g: res.guesses[p.id] ?? 0 }))
    .sort((x, y) => Math.abs(x.g - res.answer) - Math.abs(y.g - res.answer));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <div className="text-center">
        <p className="text-sm text-muted">{round.domanda}</p>
        <div className="mt-2 text-5xl font-black text-accent tabular-nums">
          {res.answer}
          {round.unit ? (
            <span className="ml-1 text-2xl text-muted">{round.unit}</span>
          ) : null}
        </div>
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        {ranked.map(({ p, g }) => (
          <li key={p.id} className="flex justify-between text-muted">
            <span>
              {nameOf[p.id]}: <span className="tabular-nums">{g}</span>
            </span>
            <span className="font-bold text-text">
              +{res.scores[p.id] ?? 0}
            </span>
          </li>
        ))}
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

function NumberGuess({
  domanda,
  unit,
  onConfirm,
}: {
  domanda: string;
  unit?: string;
  onConfirm: (value: number) => void;
}) {
  const [text, setText] = useState("");
  const valid = text.trim() !== "" && Number.isFinite(Number(text));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-8">
      <h2 className="text-center text-xl font-bold">{domanda}</h2>
      <div className="flex items-center gap-2">
        <input
          type="number"
          inputMode="numeric"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="min-h-16 flex-1 rounded-2xl border border-border bg-surface px-4 text-center text-3xl font-black tabular-nums outline-none focus:border-accent"
          placeholder="0"
          autoFocus
        />
        {unit ? <span className="text-xl text-muted">{unit}</span> : null}
      </div>
      <button
        disabled={!valid}
        onClick={() => onConfirm(Math.round(Number(text)))}
        className="min-h-16 w-full rounded-2xl bg-accent px-6 text-xl font-bold text-white active:bg-accent-strong disabled:opacity-40"
      >
        Conferma e passa
      </button>
    </main>
  );
}
