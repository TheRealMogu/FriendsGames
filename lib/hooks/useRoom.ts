"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase/client";
import type { PlayerRow, RoomRow } from "@/lib/types";

export type RoomStatus = "loading" | "ready" | "not_found" | "error";

export interface UseRoomState {
  status: RoomStatus;
  room: RoomRow | null;
  players: PlayerRow[];
  connected: boolean; // stato del websocket Realtime
}

const PLAYER_COLS = "id, room_id, name, score, is_host, last_seen, created_at";
const ROOM_COLS = "id, code, phase, game_id, round_no, created_at";

// Carica lo stato iniziale della stanza e poi lo tiene aggiornato via Realtime.
// Si iscrive a `players` e a `rooms` (tabelle, non view: Realtime non funziona
// sulle view). Gestisce riconnessione del websocket e pulizia all'unmount.
export function useRoom(code: string): UseRoomState {
  const [status, setStatus] = useState<RoomStatus>("loading");
  const [room, setRoom] = useState<RoomRow | null>(null);
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [connected, setConnected] = useState(false);

  // roomId serve sia per filtrare la subscription sia per i refetch.
  const roomIdRef = useRef<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const sortPlayers = (rows: PlayerRow[]) =>
    [...rows].sort((a, b) => a.created_at.localeCompare(b.created_at));

  // Rilegge tutta la lista giocatori: usato al primo caricamento e a ogni
  // (ri)connessione del websocket, per recuperare eventi persi.
  const refetchPlayers = useCallback(async (roomId: string) => {
    const { data, error } = await getSupabase()
      .from("players")
      .select(PLAYER_COLS)
      .eq("room_id", roomId);
    if (!error && data) {
      setPlayers(sortPlayers(data as PlayerRow[]));
    }
  }, []);

  const refetchRoom = useCallback(async (roomId: string) => {
    const { data, error } = await getSupabase()
      .from("rooms")
      .select(ROOM_COLS)
      .eq("id", roomId)
      .maybeSingle();
    if (!error && data) setRoom(data as RoomRow);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const normalized = code.trim().toUpperCase();
    const supabase = getSupabase();

    async function init() {
      const { data: roomData, error: roomError } = await supabase
        .from("rooms")
        .select(ROOM_COLS)
        .eq("code", normalized)
        .maybeSingle();

      if (cancelled) return;

      if (roomError) {
        setStatus("error");
        return;
      }
      if (!roomData) {
        setStatus("not_found");
        return;
      }

      const roomRow = roomData as RoomRow;
      roomIdRef.current = roomRow.id;
      setRoom(roomRow);
      await refetchPlayers(roomRow.id);
      if (cancelled) return;
      setStatus("ready");

      // --- Subscription Realtime ---
      const channel = supabase
        .channel(`room:${roomRow.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "players",
            filter: `room_id=eq.${roomRow.id}`,
          },
          (payload) => {
            setPlayers((prev) => {
              if (payload.eventType === "DELETE") {
                const oldId = (payload.old as { id?: string }).id;
                return prev.filter((p) => p.id !== oldId);
              }
              const row = payload.new as PlayerRow;
              const rest = prev.filter((p) => p.id !== row.id);
              return sortPlayers([...rest, row]);
            });
          }
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "rooms",
            filter: `id=eq.${roomRow.id}`,
          },
          (payload) => {
            if (payload.eventType === "DELETE") {
              setStatus("not_found");
              setRoom(null);
              return;
            }
            setRoom(payload.new as RoomRow);
          }
        )
        .subscribe((channelStatus) => {
          const isUp = channelStatus === "SUBSCRIBED";
          setConnected(isUp);
          // A ogni (ri)connessione riallineo lo stato: durante una
          // disconnessione posso aver perso degli eventi.
          if (isUp && roomIdRef.current) {
            refetchPlayers(roomIdRef.current);
            refetchRoom(roomIdRef.current);
          }
        });

      channelRef.current = channel;
    }

    init();

    return () => {
      cancelled = true;
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [code, refetchPlayers, refetchRoom]);

  return { status, room, players, connected };
}
