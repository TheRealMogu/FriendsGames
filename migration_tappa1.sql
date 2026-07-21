-- =====================================================================
--  MIGRATION — Tappa 1
--  Esegui questo blocco nell'SQL Editor di Supabase (una volta sola),
--  su uno schema creato con la versione PRECEDENTE di schema.sql.
--
--  Cosa cambia e perche':
--   - host_token esce da `rooms` e va in una nuova tabella `room_secrets`
--     senza policy RLS (invisibile al client per costruzione).
--     Motivo: `rooms` e' pubblicata in supabase_realtime, quindi OGNI sua
--     colonna arriva al browser. host_token non deve mai uscire.
--   - La view `rooms_public` sparisce: Realtime non funziona sulle view,
--     e ora `rooms` e' sicura da leggere per intero.
--   - `players` guadagna la colonna is_host (solo per il badge nella UI).
-- =====================================================================

-- 1. Nuova tabella per il segreto della stanza.
create table if not exists room_secrets (
  room_id    uuid primary key references rooms(id) on delete cascade,
  host_token text not null
);

alter table room_secrets enable row level security;
-- NESSUNA policy: nessuno la legge dal client. Voluto.

-- 2. Migra gli host_token esistenti (se ci sono stanze gia' create).
insert into room_secrets (room_id, host_token)
select id, host_token from rooms
on conflict (room_id) do nothing;

-- 3. Rimuovi la view pubblica: il client leggera' direttamente `rooms`.
drop view if exists rooms_public;

-- 4. Togli host_token da `rooms`.
alter table rooms drop column if exists host_token;

-- 5. Aggiungi is_host ai giocatori.
alter table players add column if not exists is_host boolean not null default false;
