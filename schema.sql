-- =====================================================================
--  PARTY GAME — schema Supabase
--  Eseguire nell'SQL Editor di Supabase, tutto in una volta.
--
--  NOTA: questo file rappresenta lo schema FINALE dopo la migration
--  della Tappa 1. Se hai gia' uno schema con la vecchia tabella `rooms`
--  (host_token dentro rooms + view rooms_public), esegui invece
--  `migration_tappa1.sql`.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. STANZE
--    Una riga per partita. Il "code" e' quello che digitano gli amici.
--    host_token NON sta qui: `rooms` e' pubblicata in supabase_realtime,
--    quindi ogni sua colonna arriva al browser. Il segreto sta in
--    `room_secrets` (vedi sotto).
-- ---------------------------------------------------------------------
create table rooms (
  id           uuid primary key default gen_random_uuid(),
  code         text unique not null,          -- es. "KFRT"
  phase        text not null default 'lobby', -- lobby | playing | ended
  game_id      text,                          -- quale gioco e' in corso
  round_no     int  not null default 0,
  created_at   timestamptz default now()
);


-- ---------------------------------------------------------------------
-- 1b. SEGRETO DELLA STANZA
--     host_token: lo conosce solo chi ha creato la stanza. Il client non
--     legge MAI questa tabella (nessuna policy RLS). Le azioni da host
--     sono autorizzate server-side confrontando host_token con questa riga.
-- ---------------------------------------------------------------------
create table room_secrets (
  room_id    uuid primary key references rooms(id) on delete cascade,
  host_token text not null
);


-- ---------------------------------------------------------------------
-- 2. GIOCATORI
--    player_token e' il "documento d'identita'" salvato sul telefono.
--    Serve per riconoscerlo se ricarica la pagina.
--    is_host e' solo per il badge nella UI: NON e' un permesso.
-- ---------------------------------------------------------------------
create table players (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references rooms(id) on delete cascade,
  name         text not null,
  score        int  not null default 0,
  player_token text not null,
  is_host      boolean not null default false,
  last_seen    timestamptz default now(),
  created_at   timestamptz default now()
);

create index on players (room_id);


-- ---------------------------------------------------------------------
-- 3. ROUND
--    public_data contiene tutto cio' che TUTTI possono vedere.
--      L'Intruso    -> {}                        (niente di pubblico)
--      Frequenza    -> {"scala": ["freddo","caldo"], "indizio": "il caffe'"}
--      Maggioranza  -> {"domanda": "Cane o gatto?", "opzioni": ["cane","gatto"]}
-- ---------------------------------------------------------------------
create table rounds (
  id           uuid primary key default gen_random_uuid(),
  room_id      uuid not null references rooms(id) on delete cascade,
  n            int  not null,
  game_id      text not null,
  phase        text not null default 'answering', -- answering | voting | reveal
  public_data  jsonb not null default '{}',
  deadline     timestamptz,                       -- per il timer
  created_at   timestamptz default now()
);

create index on rounds (room_id);


-- ---------------------------------------------------------------------
-- 4. SEGRETI DEL ROUND
--    Cosa vede SOLO quel giocatore. Il client non legge MAI questa tabella:
--    gliela serve l'API Route, un pezzo alla volta.
--    Esempio Intruso -> {"domanda": "Quanto costa una birra?", "ruolo": "intruso"}
-- ---------------------------------------------------------------------
create table round_secrets (
  round_id     uuid not null references rounds(id) on delete cascade,
  player_id    uuid not null references players(id) on delete cascade,
  payload      jsonb not null,
  primary key (round_id, player_id)
);


-- ---------------------------------------------------------------------
-- 5. RISPOSTE
--    Una riga per giocatore. Mai un array condiviso: niente collisioni.
-- ---------------------------------------------------------------------
create table answers (
  round_id     uuid not null references rounds(id) on delete cascade,
  player_id    uuid not null references players(id) on delete cascade,
  value        jsonb not null,          -- {"testo": "1,20"} oppure {"scelta": 7}
  created_at   timestamptz default now(),
  primary key (round_id, player_id)
);


-- ---------------------------------------------------------------------
-- 6. VOTI
-- ---------------------------------------------------------------------
create table votes (
  round_id     uuid not null references rounds(id) on delete cascade,
  voter_id     uuid not null references players(id) on delete cascade,
  target       jsonb not null,          -- {"player_id": "..."} oppure {"valore": 4}
  created_at   timestamptz default now(),
  primary key (round_id, voter_id)
);


-- =====================================================================
--  ROW LEVEL SECURITY
--
--  Principio: il client anonimo puo' solo LEGGERE, e solo cio' che
--  non rovina il gioco. Tutte le scritture passano dalle API Route
--  con la service_role key, che ignora le RLS.
-- =====================================================================

alter table rooms         enable row level security;
alter table room_secrets  enable row level security;
alter table players       enable row level security;
alter table rounds        enable row level security;
alter table round_secrets enable row level security;
alter table answers       enable row level security;
alter table votes         enable row level security;


-- Stanze: leggibili per intero. host_token non e' qui, quindi e' sicuro.
create policy "leggi stanze" on rooms
  for select to anon using (true);

-- Segreto stanza: NESSUNA policy = nessuno lo legge dal client. Voluto.

-- Giocatori: nome, punteggio e is_host sono pubblici
create policy "leggi giocatori" on players
  for select to anon using (true);

-- Round: solo la parte pubblica (i segreti stanno in un'altra tabella)
create policy "leggi round" on rounds
  for select to anon using (true);

-- Segreti del round: NESSUNA policy = nessuno li legge dal client. Voluto.

-- Risposte: visibili solo quando si passa alla votazione
create policy "leggi risposte dopo la fase" on answers
  for select to anon using (
    exists (
      select 1 from rounds r
      where r.id = answers.round_id
        and r.phase in ('voting', 'reveal')
    )
  );

-- Voti: visibili solo alla rivelazione
create policy "leggi voti al reveal" on votes
  for select to anon using (
    exists (
      select 1 from rounds r
      where r.id = votes.round_id
        and r.phase = 'reveal'
    )
  );


-- =====================================================================
--  REALTIME
--  Attiva il push websocket sulle tabelle che il client deve seguire.
--  Il client si iscrive a `rooms` (non a una view) e a `players`.
-- =====================================================================

alter publication supabase_realtime add table rooms;
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table rounds;
alter publication supabase_realtime add table answers;
alter publication supabase_realtime add table votes;


-- =====================================================================
--  PULIZIA
--  Cancella le stanze piu' vecchie di 12 ore (i CASCADE fanno il resto).
--  Da chiamare con un Cron Job di Supabase, oppure a mano all'inizio.
-- =====================================================================
create function pulisci_stanze_vecchie()
returns void language sql as $$
  delete from rooms where created_at < now() - interval '12 hours';
$$;
