"use client";

import { useState } from "react";
import PassAround from "@/components/local/PassAround";
import Scoreboard from "@/components/local/Scoreboard";
import type { LocalGameProps, ScoreDeltas } from "../types";
import {
  createFrequenzaRound,
  resolveFrequenza,
  pointsForDistance,
  type FrequenzaRound,
  type FrequenzaResult,
} from "./logic";

type Phase = "clue" | "guess" | "reveal";

export default function FrequenzaLocalGame({ players, onExit }: LocalGameProps) {
  const [round, setRound] = useState<FrequenzaRound>(() =>
    createFrequenzaRound(players)
  );
  const [phase, setPhase] = useState<Phase>("clue");
  const [result, setResult] = useState<FrequenzaResult | null>(null);
  const [totals, setTotals] = useState<ScoreDeltas>(() =>
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );

  const clueGiver = players.find((p) => p.id === round.clueGiverId)!;
  const guessers = players.filter((p) => p.id !== round.clueGiverId);

  function newRound() {
    setRound(createFrequenzaRound(players));
    setResult(null);
    setPhase("clue");
  }

  if (phase === "clue") {
    return (
      <PassAround<void>
        players={[clueGiver]}
        render={(_player, done) => (
          <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-8 text-center">
            <p className="text-sm uppercase tracking-widest text-muted">
              Dai tu l&apos;indizio, {clueGiver.name}
            </p>
            <ScaleBar poloMin={round.poloMin} poloMax={round.poloMax} target={round.target} />
            <p className="text-muted">
              Solo tu vedi dov&apos;è l&apos;obiettivo. Di&apos; a voce UNA parola
              o frase per farci avvicinare — senza spoilerare la posizione.
            </p>
            <button
              onClick={() => done()}
              className="min-h-16 w-full rounded-2xl bg-accent px-6 text-xl font-bold text-white active:bg-accent-strong"
            >
              Indizio dato — passa agli altri
            </button>
          </main>
        )}
        onComplete={() => setPhase("guess")}
      />
    );
  }

  if (phase === "guess") {
    return (
      <PassAround<number>
        players={guessers}
        handoverLabel="Piazza il cursore —"
        render={(_player, done) => (
          <GuessScreen
            poloMin={round.poloMin}
            poloMax={round.poloMax}
            onConfirm={done}
          />
        )}
        onComplete={(guesses) => {
          const res = resolveFrequenza(
            players,
            round.clueGiverId,
            round.target,
            guesses
          );
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
        <p className="text-sm uppercase tracking-widest text-muted">
          L&apos;obiettivo era a {res.target}
        </p>
        <div className="mt-3">
          <ScaleBar
            poloMin={round.poloMin}
            poloMax={round.poloMax}
            target={res.target}
            markers={guessers.map((g) => ({
              value: res.guesses[g.id] ?? 0,
              label: g.name,
            }))}
          />
        </div>
        <p className="mt-3 text-sm text-muted">
          Indizio di {clueGiver.name}
        </p>
      </div>

      <ul className="flex flex-col gap-1 text-sm">
        {guessers.map((g) => {
          const guess = res.guesses[g.id] ?? 0;
          const pts = pointsForDistance(Math.abs(guess - res.target));
          return (
            <li key={g.id} className="flex justify-between text-muted">
              <span>
                {g.name}: {guess}
              </span>
              <span className="font-bold text-text">+{pts}</span>
            </li>
          );
        })}
      </ul>

      <Scoreboard players={players} totals={totals} highlight={round.clueGiverId} />

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

function GuessScreen({
  poloMin,
  poloMax,
  onConfirm,
}: {
  poloMin: string;
  poloMax: string;
  onConfirm: (value: number) => void;
}) {
  const [value, setValue] = useState(50);
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-8">
      <div className="flex justify-between text-sm font-semibold text-muted">
        <span>{poloMin}</span>
        <span>{poloMax}</span>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="h-3 w-full cursor-pointer appearance-none rounded-full bg-surface-2 accent-accent"
        aria-label="Posizione stimata"
      />
      <div className="text-center text-4xl font-black tabular-nums">{value}</div>
      <button
        onClick={() => onConfirm(value)}
        className="min-h-16 w-full rounded-2xl bg-accent px-6 text-xl font-bold text-white active:bg-accent-strong"
      >
        Conferma e passa
      </button>
    </main>
  );
}

function ScaleBar({
  poloMin,
  poloMax,
  target,
  markers,
}: {
  poloMin: string;
  poloMax: string;
  target: number;
  markers?: { value: number; label: string }[];
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between text-xs font-semibold text-muted">
        <span>{poloMin}</span>
        <span>{poloMax}</span>
      </div>
      <div className="relative h-4 rounded-full bg-gradient-to-r from-accent/30 to-accent">
        {/* obiettivo */}
        <div
          className="absolute top-[-6px] h-7 w-1 rounded bg-white"
          style={{ left: `calc(${target}% - 2px)` }}
        />
        {/* stime */}
        {markers?.map((m, i) => (
          <div
            key={i}
            className="absolute top-[-10px] h-9 w-0.5 bg-danger"
            style={{ left: `calc(${m.value}% - 1px)` }}
            title={m.label}
          />
        ))}
      </div>
    </div>
  );
}
