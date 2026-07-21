"use client";

import { useEffect, useRef, useState } from "react";
import Scoreboard from "@/components/local/Scoreboard";
import type { LocalGameProps, ScoreDeltas } from "../types";
import { TURN_SECONDS, pescaParola } from "./logic";

type Phase = "ready" | "play" | "turnEnd" | "done";

export default function TabuLocalGame({ players, onExit }: LocalGameProps) {
  const [describerIndex, setDescriberIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>("ready");
  const [word, setWord] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState(TURN_SECONDS);
  const [turnScore, setTurnScore] = useState(0);
  const [totals, setTotals] = useState<ScoreDeltas>(() =>
    Object.fromEntries(players.map((p) => [p.id, 0]))
  );

  // Il conteggio del turno vive anche in un ref: il timer (closure) legge
  // sempre l'ultimo valore senza dipendere dallo stato catturato.
  const turnScoreRef = useRef(0);
  const describer = players[describerIndex]!;
  const isLastDescriber = describerIndex >= players.length - 1;

  // Timer del turno.
  useEffect(() => {
    if (phase !== "play") return;
    if (timeLeft <= 0) {
      endTurn();
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, timeLeft]);

  function startTurn() {
    turnScoreRef.current = 0;
    setTurnScore(0);
    setTimeLeft(TURN_SECONDS);
    setWord(pescaParola());
    setPhase("play");
  }

  function guessed() {
    turnScoreRef.current += 1;
    setTurnScore(turnScoreRef.current);
    setWord((w) => pescaParola(w));
  }

  function skip() {
    setWord((w) => pescaParola(w));
  }

  function endTurn() {
    setTotals((prev) => ({
      ...prev,
      [describer.id]: (prev[describer.id] ?? 0) + turnScoreRef.current,
    }));
    setPhase("turnEnd");
  }

  function next() {
    if (isLastDescriber) {
      setPhase("done");
    } else {
      setDescriberIndex((i) => i + 1);
      setPhase("ready");
    }
  }

  function restart() {
    setDescriberIndex(0);
    setPhase("ready");
  }

  if (phase === "ready") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-sm uppercase tracking-widest text-muted">
          Tocca a descrivere a
        </p>
        <div className="text-5xl font-black">{describer.name}</div>
        <p className="text-muted">
          Tieni tu il telefono. Descrivi la parola SENZA dirla; gli altri
          indovinano a voce. Hai {TURN_SECONDS} secondi.
        </p>
        <button
          onClick={startTurn}
          className="min-h-16 w-full rounded-2xl bg-accent px-6 text-xl font-bold text-white active:bg-accent-strong"
        >
          Via!
        </button>
      </main>
    );
  }

  if (phase === "play") {
    const low = timeLeft <= 10;
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
        <div className="flex items-center justify-between">
          <span
            className={`text-3xl font-black tabular-nums ${
              low ? "text-danger" : "text-text"
            }`}
          >
            {timeLeft}s
          </span>
          <span className="text-lg font-bold text-muted">
            Punti: {turnScore}
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="text-center text-5xl font-black">{word}</div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={guessed}
            className="min-h-20 rounded-2xl bg-ok px-6 text-2xl font-black text-black active:opacity-80"
          >
            Indovinato +1
          </button>
          <div className="flex gap-3">
            <button
              onClick={skip}
              className="min-h-14 flex-1 rounded-2xl border border-border bg-surface text-lg font-bold active:bg-surface-2"
            >
              Passa
            </button>
            <button
              onClick={endTurn}
              className="min-h-14 flex-1 rounded-2xl border border-border bg-surface text-lg font-bold text-muted active:bg-surface-2"
            >
              Fine turno
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (phase === "turnEnd") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-muted">Turno di {describer.name}</p>
        <div className="text-6xl font-black text-accent">+{turnScore}</div>
        <button
          onClick={next}
          className="min-h-16 w-full rounded-2xl bg-accent px-6 text-xl font-bold text-white active:bg-accent-strong"
        >
          {isLastDescriber ? "Vedi la classifica" : "Prossimo giocatore"}
        </button>
      </main>
    );
  }

  // done
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <h2 className="text-center text-2xl font-black">Giro completato!</h2>
      <Scoreboard players={players} totals={totals} />
      <div className="mt-auto flex flex-col gap-3">
        <button
          onClick={restart}
          className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-white active:bg-accent-strong"
        >
          Altro giro
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
