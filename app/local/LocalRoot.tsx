"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GAMES, getGame } from "@/lib/games/registry";
import Scoreboard from "@/components/local/Scoreboard";
import type { LocalPlayer, ScoreDeltas } from "@/lib/games/types";

type Step = "setup" | "menu" | "play";

const STORAGE_KEY = "fg_local_session";
const MAX_SLOTS = 12;

interface StoredSession {
  players: LocalPlayer[];
  totals: ScoreDeltas;
}

// Orchestratore della modalita' locale (un telefono, offline). Nessuna rete:
// tutto vive qui e in localStorage, cosi' un refresh non azzera il gruppo.
export default function LocalRoot() {
  const [step, setStep] = useState<Step>("setup");
  const [players, setPlayers] = useState<LocalPlayer[]>([]);
  const [totals, setTotals] = useState<ScoreDeltas>({});
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);

  const [names, setNames] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Ripristina una sessione salvata (gruppo + punteggi).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as StoredSession;
        if (s.players?.length >= 2) {
          setPlayers(s.players);
          setTotals(s.totals ?? {});
          setStep("menu");
        }
      }
    } catch {
      // sessione corrotta: si riparte dal setup
    }
    setLoaded(true);
  }, []);

  function persist(next: StoredSession) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // spazio pieno o storage negato: pazienza, resta in memoria
    }
  }

  function start() {
    setError(null);
    const clean = names.map((n) => n.trim()).filter((n) => n.length > 0);
    if (clean.length < 2) {
      setError("Servono almeno 2 giocatori.");
      return;
    }
    const lower = clean.map((n) => n.toLowerCase());
    if (new Set(lower).size !== lower.length) {
      setError("Due giocatori hanno lo stesso nome.");
      return;
    }
    const built: LocalPlayer[] = clean.map((name, i) => ({
      id: `p${i}`,
      name,
    }));
    const freshTotals: ScoreDeltas = Object.fromEntries(
      built.map((p) => [p.id, 0])
    );
    setPlayers(built);
    setTotals(freshTotals);
    persist({ players: built, totals: freshTotals });
    setStep("menu");
  }

  function editGroup() {
    setNames(players.length ? players.map((p) => p.name) : ["", "", "", ""]);
    setStep("setup");
  }

  function onExitGame(deltas: ScoreDeltas) {
    setTotals((prev) => {
      const next = { ...prev };
      for (const p of players) next[p.id] = (next[p.id] ?? 0) + (deltas[p.id] ?? 0);
      persist({ players, totals: next });
      return next;
    });
    setCurrentGameId(null);
    setStep("menu");
  }

  function resetScores() {
    const zero: ScoreDeltas = Object.fromEntries(players.map((p) => [p.id, 0]));
    setTotals(zero);
    persist({ players, totals: zero });
  }

  if (!loaded) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-6">
        <p className="text-muted">Un attimo…</p>
      </main>
    );
  }

  // --- SETUP giocatori ---
  if (step === "setup") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
        <header>
          <h1 className="text-3xl font-black">Chi gioca?</h1>
          <p className="mt-1 text-muted">
            Un solo telefono, ve lo passate. Da 2 a {MAX_SLOTS} giocatori.
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-center text-danger"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col gap-2">
          {names.map((n, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="min-h-14 flex-1 rounded-2xl border border-border bg-surface px-4 text-lg outline-none focus:border-accent"
                value={n}
                onChange={(e) => {
                  const copy = [...names];
                  copy[i] = e.target.value;
                  setNames(copy);
                }}
                maxLength={16}
                placeholder={`Giocatore ${i + 1}`}
                autoComplete="off"
              />
              {names.length > 2 && (
                <button
                  onClick={() => setNames(names.filter((_, j) => j !== i))}
                  className="min-h-14 w-14 rounded-2xl border border-border bg-surface text-2xl text-muted active:bg-surface-2"
                  aria-label="Rimuovi giocatore"
                >
                  −
                </button>
              )}
            </div>
          ))}
        </div>

        {names.length < MAX_SLOTS && (
          <button
            onClick={() => setNames([...names, ""])}
            className="min-h-12 rounded-2xl border border-dashed border-border text-muted active:bg-surface"
          >
            + Aggiungi giocatore
          </button>
        )}

        <div className="mt-auto flex flex-col gap-3">
          <button
            onClick={start}
            className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-white active:bg-accent-strong"
          >
            Ai giochi
          </button>
          <Link
            href="/"
            className="min-h-12 text-center text-muted active:underline"
          >
            Home
          </Link>
        </div>
      </main>
    );
  }

  // --- PLAY: gioco in corso ---
  if (step === "play" && currentGameId) {
    const game = getGame(currentGameId);
    if (game) {
      const GameUI = game.LocalGame;
      return <GameUI players={players} onExit={onExitGame} />;
    }
  }

  // --- MENU: scelta gioco + classifica ---
  const playable = GAMES.filter(
    (g) => players.length >= g.meta.minPlayers && players.length <= g.meta.maxPlayers
  );

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black">Scegli un gioco</h1>
          <p className="text-muted">{players.length} giocatori</p>
        </div>
        <button
          onClick={editGroup}
          className="min-h-10 rounded-xl border border-border bg-surface px-3 text-sm text-muted active:bg-surface-2"
        >
          Cambia
        </button>
      </header>

      <div className="flex flex-col gap-3">
        {GAMES.map((g) => {
          const ok = playable.includes(g);
          return (
            <button
              key={g.meta.id}
              disabled={!ok}
              onClick={() => {
                setCurrentGameId(g.meta.id);
                setStep("play");
              }}
              className={`flex items-start gap-4 rounded-2xl border border-border bg-surface p-4 text-left active:bg-surface-2 ${
                ok ? "" : "opacity-40"
              }`}
            >
              <span className="text-3xl">{g.meta.emoji}</span>
              <span className="flex flex-col">
                <span className="text-lg font-bold">{g.meta.name}</span>
                <span className="text-sm text-muted">{g.meta.tagline}</span>
                {!ok && (
                  <span className="mt-1 text-xs text-danger">
                    Da {g.meta.minPlayers} a {g.meta.maxPlayers} giocatori
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Classifica</h2>
          <button
            onClick={resetScores}
            className="text-sm text-muted active:underline"
          >
            Azzera
          </button>
        </div>
        <Scoreboard players={players} totals={totals} />
      </section>

      <Link href="/" className="min-h-12 text-center text-muted active:underline">
        Home
      </Link>
    </main>
  );
}
