"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getHostToken, getPlayerToken } from "@/lib/identity";
import type { HeartbeatBody, PlayerRow, RoomRow } from "@/lib/types";

const HEARTBEAT_MS = 25_000; // ping ogni 25 secondi
const STALE_MS = 60_000; // oltre 60s senza ping -> attenuato
const CLOCK_TICK_MS = 10_000; // ricalcola la staleness ogni 10s

// Vista presentazionale della lobby. Riceve lo stato gia' pronto (stanza +
// giocatori) dal componente che gestisce Realtime e l'appartenenza.
export default function Lobby({
  code,
  room,
  players,
  connected,
}: {
  code: string;
  room: RoomRow;
  players: PlayerRow[];
  connected: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());
  const [copied, setCopied] = useState(false);
  const [isHost, setIsHost] = useState(false);

  // localStorage e' leggibile solo nel browser: leggo dopo il mount.
  useEffect(() => {
    setIsHost(getHostToken(code) !== null);
  }, [code]);

  // Heartbeat: tiene aggiornato last_seen finche' la pagina e' aperta.
  useEffect(() => {
    const token = getPlayerToken();
    if (!token) return;

    async function ping() {
      const body: HeartbeatBody = { code, player_token: token as string };
      try {
        await fetch("/api/room/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          keepalive: true,
        });
      } catch {
        // Silenzioso: il prossimo tick riprova.
      }
    }

    ping();
    const id = setInterval(ping, HEARTBEAT_MS);
    return () => clearInterval(id);
  }, [code]);

  // Orologio: fa ricalcolare "chi e' offline" anche senza nuovi eventi.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), CLOCK_TICK_MS);
    return () => clearInterval(id);
  }, []);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard non disponibile: ignora, il codice e' comunque visibile.
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-6 py-8">
      <header className="flex flex-col items-center gap-3">
        <span className="text-sm uppercase tracking-widest text-muted">
          Codice stanza
        </span>
        <div className="text-6xl font-black tracking-[0.2em]">{room.code}</div>
        <button
          onClick={copyLink}
          className="min-h-12 rounded-xl border border-border bg-surface px-5 text-sm font-semibold active:bg-surface-2"
        >
          {copied ? "Link copiato!" : "Copia link invito"}
        </button>
      </header>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            Giocatori{" "}
            <span className="text-muted">({players.length}/12)</span>
          </h2>
          <span
            className={`text-xs font-medium ${
              connected ? "text-ok" : "text-muted"
            }`}
          >
            {connected ? "● in tempo reale" : "○ riconnessione…"}
          </span>
        </div>

        <ul className="flex flex-col gap-2">
          {players.map((p) => {
            const stale = now - new Date(p.last_seen).getTime() > STALE_MS;
            return (
              <li
                key={p.id}
                className={`flex items-center justify-between rounded-2xl border border-border bg-surface px-4 py-4 ${
                  stale ? "opacity-40" : ""
                }`}
              >
                <span className="truncate text-lg font-semibold">{p.name}</span>
                {p.is_host && (
                  <span className="ml-3 shrink-0 rounded-full bg-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
                    host
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </section>

      <div className="mt-auto flex flex-col gap-3">
        {isHost ? (
          <div className="group relative">
            <button
              disabled
              className="w-full min-h-14 rounded-2xl bg-accent px-6 text-lg font-bold text-white opacity-40"
              title="prossima tappa"
            >
              Inizia
            </button>
            <p className="mt-2 text-center text-xs text-muted">
              Il gioco arriva nella prossima tappa.
            </p>
          </div>
        ) : (
          <p className="text-center text-sm text-muted">
            In attesa che l&apos;host avvii la partita…
          </p>
        )}
        <Link
          href="/"
          className="min-h-12 text-center text-muted underline-offset-4 active:underline"
        >
          Esci
        </Link>
      </div>
    </main>
  );
}
