"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRoom } from "@/lib/hooks/useRoom";
import {
  getMembership,
  saveMembership,
  getOrCreatePlayerToken,
} from "@/lib/identity";
import Lobby from "./Lobby";
import type { ApiError, JoinRoomResponse } from "@/lib/types";

// Gestisce lo stato della stanza e l'APPARTENENZA. Chi apre il link d'invito
// e non e' ancora dentro vede un form per entrare; chi e' gia' giocatore
// vede la lobby. Un solo useRoom qui: la lobby e' presentazionale.
export default function RoomClient({ code }: { code: string }) {
  const [reloadKey, setReloadKey] = useState(0);
  const { status, room, players, connected } = useRoom(code, reloadKey);

  // Appartenenza: id del nostro giocatore salvato al create/join.
  // Letto dopo il mount (localStorage e' solo lato browser).
  const [memberId, setMemberId] = useState<string | null>(null);
  const [membershipRead, setMembershipRead] = useState(false);
  useEffect(() => {
    setMemberId(getMembership(code));
    setMembershipRead(true);
  }, [code]);

  // Form d'ingresso (solo per chi arriva dal link senza essere in stanza).
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [justJoined, setJustJoined] = useState(false);

  const isMember =
    justJoined || (memberId !== null && players.some((p) => p.id === memberId));

  async function handleJoin() {
    setError(null);
    if (name.trim().length === 0) {
      setError("Scrivi il tuo nome.");
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
      setMemberId(ok.player.id);
      setJustJoined(true); // evita un flash di form finche' arriva il Realtime
    } catch {
      setError("Rete non raggiungibile. Riprova.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "loading" || !membershipRead) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md items-center justify-center px-6">
        <p className="text-muted">Carico la stanza…</p>
      </main>
    );
  }

  if (status === "not_found") {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Stanza non trovata</h1>
          <p className="mt-2 text-muted">
            Il codice <span className="font-mono font-bold">{code}</span> non
            esiste o la partita e' stata chiusa.
          </p>
        </div>
        <Link
          href="/"
          className="min-h-14 rounded-2xl bg-accent px-6 py-4 text-lg font-bold text-white active:bg-accent-strong"
        >
          Torna alla home
        </Link>
      </main>
    );
  }

  if (status === "error" || !room) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-danger">
          Qualcosa e' andato storto nel caricare la stanza.
        </p>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
          className="min-h-14 rounded-2xl bg-accent px-6 py-4 text-lg font-bold text-white active:bg-accent-strong"
        >
          Riprova
        </button>
        <Link href="/" className="text-muted underline">
          Torna alla home
        </Link>
      </main>
    );
  }

  // Stanza ok ma non sei dentro: sei arrivato dal link d'invito.
  if (!isMember) {
    if (room.phase !== "lobby") {
      return (
        <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold">Partita gia' iniziata</h1>
            <p className="mt-2 text-muted">
              Non si puo' entrare a partita in corso.
            </p>
          </div>
          <Link href="/" className="text-accent underline">
            Torna alla home
          </Link>
        </main>
      );
    }

    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-6 px-6 py-10">
        <header className="text-center">
          <p className="text-sm uppercase tracking-widest text-muted">
            Ti hanno invitato nella stanza
          </p>
          <div className="mt-2 text-5xl font-black tracking-[0.2em]">
            {room.code}
          </div>
          <p className="mt-2 text-muted">
            {players.length}/12 giocatori dentro. Scegli un nome per entrare.
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

        <div className="flex flex-col gap-4">
          <input
            className="min-h-14 rounded-2xl border border-border bg-surface px-4 text-lg outline-none focus:border-accent"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={16}
            placeholder="Come ti chiami?"
            autoFocus
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !busy) handleJoin();
            }}
          />
          <button
            disabled={busy}
            onClick={handleJoin}
            className="min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-white active:bg-accent-strong disabled:opacity-50"
          >
            {busy ? "Un attimo…" : "Entra in lobby"}
          </button>
          <Link
            href="/"
            className="min-h-12 text-center text-muted underline-offset-4 active:underline"
          >
            Annulla
          </Link>
        </div>
      </main>
    );
  }

  return (
    <Lobby code={code} room={room} players={players} connected={connected} />
  );
}
