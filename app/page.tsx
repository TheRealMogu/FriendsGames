"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  getOrCreatePlayerToken,
  saveHostToken,
  saveMembership,
} from "@/lib/identity";
import type {
  ApiError,
  CreateRoomResponse,
  JoinRoomResponse,
} from "@/lib/types";

type Mode = "menu" | "create" | "join";

export default function Home() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("menu");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    setError(null);
    if (name.trim().length === 0) {
      setError("Scrivi il tuo nome.");
      return;
    }
    setBusy(true);
    try {
      const playerToken = getOrCreatePlayerToken();
      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, player_token: playerToken }),
      });
      const data = (await res.json()) as CreateRoomResponse | ApiError;
      if (!res.ok) {
        setError((data as ApiError).error ?? "Errore imprevisto.");
        return;
      }
      const ok = data as CreateRoomResponse;
      saveHostToken(ok.code, ok.host_token);
      saveMembership(ok.code, ok.player.id);
      router.push(`/room/${ok.code}`);
    } catch {
      setError("Rete non raggiungibile. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin() {
    setError(null);
    if (name.trim().length === 0) {
      setError("Scrivi il tuo nome.");
      return;
    }
    if (code.trim().length !== 4) {
      setError("Il codice ha 4 lettere.");
      return;
    }
    setBusy(true);
    try {
      const playerToken = getOrCreatePlayerToken();
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, name, player_token: playerToken }),
      });
      const data = (await res.json()) as JoinRoomResponse | ApiError;
      if (!res.ok) {
        setError((data as ApiError).error ?? "Errore imprevisto.");
        return;
      }
      const ok = data as JoinRoomResponse;
      saveMembership(ok.code, ok.player.id);
      router.push(`/room/${ok.code}`);
    } catch {
      setError("Rete non raggiungibile. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-8 px-6 py-10">
      <header className="text-center">
        <h1 className="text-4xl font-black tracking-tight">FriendsGames</h1>
        <p className="mt-2 text-muted">Party game da giocare tra amici.</p>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-danger/50 bg-danger/10 px-4 py-3 text-center text-danger"
        >
          {error}
        </div>
      )}

      {mode === "menu" && (
        <div className="flex flex-col gap-4">
          <button
            className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-white active:bg-accent-strong"
            onClick={() => {
              setError(null);
              setMode("create");
            }}
          >
            Crea stanza
          </button>
          <button
            className="min-h-14 rounded-2xl border border-border bg-surface px-6 text-lg font-bold text-text active:bg-surface-2"
            onClick={() => {
              setError(null);
              setMode("join");
            }}
          >
            Entra
          </button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs uppercase tracking-widest text-muted">
              oppure
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <Link
            href="/local"
            className="min-h-14 flex items-center justify-center rounded-2xl border border-border bg-surface px-6 text-lg font-bold text-text active:bg-surface-2"
          >
            🎉 Gioca su un telefono
          </Link>
        </div>
      )}

      {mode !== "menu" && (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium text-muted">Il tuo nome</span>
            <input
              className="min-h-14 rounded-2xl border border-border bg-surface px-4 text-lg outline-none focus:border-accent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={16}
              placeholder="Come ti chiami?"
              autoFocus
              autoComplete="off"
            />
          </label>

          {mode === "join" && (
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium text-muted">
                Codice stanza
              </span>
              <input
                className="min-h-14 rounded-2xl border border-border bg-surface px-4 text-center text-2xl font-bold uppercase tracking-[0.3em] outline-none focus:border-accent"
                value={code}
                onChange={(e) =>
                  setCode(e.target.value.toUpperCase().slice(0, 4))
                }
                maxLength={4}
                placeholder="ABCD"
                autoCapitalize="characters"
                autoComplete="off"
              />
            </label>
          )}

          <button
            disabled={busy}
            className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-white active:bg-accent-strong disabled:opacity-50"
            onClick={mode === "create" ? handleCreate : handleJoin}
          >
            {busy
              ? "Un attimo…"
              : mode === "create"
                ? "Crea e vai in lobby"
                : "Entra in lobby"}
          </button>

          <button
            className="min-h-12 text-center text-muted underline-offset-4 active:underline"
            onClick={() => {
              setError(null);
              setMode("menu");
            }}
          >
            Indietro
          </button>
        </div>
      )}
    </main>
  );
}
