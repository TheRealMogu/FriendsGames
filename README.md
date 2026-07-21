# FriendsGames

Party game web da giocare tra amici, ognuno dal proprio telefono.
Questa è la **Tappa 1**: creazione stanza + lobby in tempo reale. I giochi
veri e propri arrivano nelle tappe successive.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind v4
- Supabase (Postgres + Realtime)
- Deploy su Vercel

## Come funziona la sicurezza

- Il **client non scrive mai** su Supabase. Ogni scrittura passa da una API
  Route in `app/api/`, che usa la `SUPABASE_SERVICE_ROLE_KEY` (mai nel bundle
  client: i file che la toccano hanno `import 'server-only'`).
- Il client legge solo tramite il client anon e le subscription Realtime.
- `host_token` sta nella tabella `room_secrets`, senza policy RLS: invisibile
  al client. Le azioni da host vanno autorizzate server-side confrontando il
  token con questa tabella. `is_host` sui giocatori serve **solo** per il
  badge nella UI, non è un permesso.

## Setup

### 1. Database (Supabase)

Nell'SQL Editor di Supabase esegui **una** delle due:

- `schema.sql` — se parti da zero (schema completo, già aggiornato).
- `migration_tappa1.sql` — se hai già lo schema vecchio (host_token dentro
  `rooms` + view `rooms_public`) e vuoi solo aggiornarlo.

### 2. Variabili d'ambiente

Copia `.env.local.example` in `.env.local` e compila (Supabase → Settings → API):

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # service_role, segreta: solo lato server
```

### 3. Sviluppo locale

```bash
npm install
npm run dev
```

Apri http://localhost:3000

## Deploy su Vercel

- Framework Preset: **Next.js** (il repo include un `vercel.json` che lo forza;
  se nel pannello c'è un override "Output Directory = public", rimuovilo).
- Imposta le **3 variabili d'ambiente** anche su Vercel
  (Settings → Environment Variables), poi fai un **Redeploy**. Senza, il build
  passa ma le API rispondono errore a runtime.

## Testare la lobby con due schede

1. **Scheda A** (finestra normale): "Crea stanza", scegli un nome → entri in
   lobby, vedi il codice grande e il badge **host** accanto a te.
2. **Scheda B** (finestra **in incognito**, così ha un `player_token` diverso —
   due schede normali condividono `localStorage`): usa "Copia link invito"
   dalla scheda A e apri il link, oppure vai in home → "Entra" col codice.
   Scegli un nome → compari **in tempo reale** nella lista di A, senza refresh.
3. Casi d'errore da provare: stesso nome → rifiutato; codice inesistente →
   messaggio chiaro; refresh della scheda B → rientri come lo stesso giocatore,
   niente doppioni.
4. Chiudi la scheda B e aspetta ~60s: quel giocatore appare **attenuato**.

## Fuori scope (Tappa 1)

Giochi, punteggi, round, votazioni, autenticazione, test automatici.
