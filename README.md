# RandApp Multihotel — Hotel Operations Platform

PWA interna React 19 + Vite 7 + Supabase/Postgres per l'operatività multi-hotel di **Hotel Giò**, **ChocoHotel** e **Hotel Il Brigantino**. Target verificati dalla Quality Matrix: **iOS/iPadOS, Android, tablet e Windows/desktop**.

Questo repository è la copia di **Apicehotel/Apicehotel-Manutenzione** **senza RandAI**: contiene solo l'app operativa. Sono stati rimossi l'assistente RandAI, la console `/randai`, RandAILive, le edge function `randai-*` / `rand-*` / `randcore-*`, il gateway MCP e WhatsApp inbound, i workflow e i test di governance dell'ecosistema Rand, gli skill/agent config. Il resto dell'app (shell, moduli operativi, chat tra utenti, offline, notifiche) è invariato.

## Cosa fa l'app

Moduli operativi: segnalazioni, interventi, planning lavori e sale, housekeeping (tabellone camere), rifornimenti, magazzino (ledger/stock/seriali), urgenze, promemoria/task, sensori e temperature, rubrica tecnici, utenti e ruoli, feedback, chat (gruppi e DM E2EE con media), notifiche push/ntfy, WhatsApp in uscita, download RandDesktop (stampa).

- **Login:** PIN per utente, per struttura. Edge function `pin-auth` (hash-only, rate-limit, Postgres diretto per le operazioni privilegiate); Supabase Auth resta proprietario di identità e sessione.
- **Multi-hotel:** ogni dato è legato a `hotel_id`; RLS/RPC di Supabase sono l'autorità finale (nascondere una voce di menu non concede permessi).
- **Ruoli:** `admin`, `Supremo`, `Direzione`, `Direttore Centro Congressi`, `Portiere Notturno`, `manutentore`, `Tecnico esterno`, `Governante`, `Capo Governante`, `Reception`, `Isola dei Golosi`, `Ristorante Wine/Jazz`, `Colazione Jazz`. Permessi per modulo/azione in `src/permissions.js` (con matrice live da Supabase).
- **Navigazione mobile:** barra a cinque slot stabili — Operatività · Planning · Home · destinazione contestuale (Task o Chat) · Altro. Il profilo apre il menu completo. Governanti: Segnalazioni · Housekeeping · Home · Task · Rifornimenti.
- **Home:** mini-scrivania con KPI a striscia, banco personale, attrezzi a portata e vassoio "Da smaltire".
- **Dettaglio operativo:** Segnalazioni, Interventi, Avvisi, Promemoria e Rifornimenti usano `OperationalDetailPage` (Focus Mode, Operational Dock, Timeline basata su dati reali).
- **Offline:** Service Worker + sessione locale controllata + Dexie/IndexedDB. TanStack Query gestisce il server-state in memoria; nessuna seconda cache persistente. Le operazioni in coda mantengono `hotel_id` e identità per il replay.
- **UI:** RandUI è il design system della shell (`src/randapp/randui/`); tema chiaro/scuro/sistema e dimensioni Piccolo/Normale/Grande.

## Stack

- React 19 + Vite 7, TanStack Query, Dexie, Supabase JS, Sentry/OpenTelemetry opzionali (disattivati di default), SheetJS per gli export Excel.
- Supabase/Postgres: dati, Auth, RLS/RPC, Realtime, Storage, Edge Function.
- Node **24.x** (`.nvmrc` = 24.20.0; `engine-strict=true` in `.npmrc`).

## Avvio locale

```bash
npm ci
npm run dev        # http://localhost:3000
```

Variabili: `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sono obbligatorie in build di produzione (client fail-closed). In sviluppo usa `.env.development`; l'elenco completo (Sentry, OTEL, Telegram backup) è in `.env.example`. Nessuna chiave `service_role` o segreto va mai nel frontend.

> I valori Supabase scritti in `.env.development` e nei workflow puntano ancora al **progetto Supabase esistente** del repo originale. Per un'istanza separata creane uno nuovo, applica le migration e aggiorna questi valori.

## Struttura del repository

- `src/` — app. `src/main.jsx` (entry e rotte standalone: `/tecnico/:token`, `/tecnici-esterni`, `/s/:token`, `/n/:alias`), `src/randapp/` (shell, viste, chat, planning, admin, RandUI), `src/reliability/` (recupero JWT, validazione, safe-write, concorrenza offline).
- `supabase/migrations/` — schema completo, in ordine cronologico. `supabase/functions/` — edge function dell'app (vedi sotto). `supabase/config.toml` — solo le funzioni con `verify_jwt=false`.
- `test/` — suite `node --test` + gate e2e/device (Playwright). `scripts/` — gate (quality matrix, critical, bundle) e utility ntfy/backfill.
- `desktop/` — RandDesktop (Electron, solo stampa/capacità native ristrette).
- `docs/` — architettura (multihotel, RLS, offline, chat, rifornimenti, desktop, RandUI). `AGENTS.md` — contratto di ingegneria per chi modifica il codice. `FRONTEND_ARCHITECTURE.md` — architettura frontend.

### Edge function

`pin-auth`, `pin-recovery`, `admin-users`, `admin-chat-settings`, `presence-status`, `public-iss`, `tech-portal`, `push-subscribe`, `send-push`, `assignment-notify`, `ntfy-admin`, `ntfy-alert`, `ntfy-config`, `ntfy-resolve`, `reminder-worker`, `urgent-reminder-worker`, `weather-alert-worker`, `sync-sensori-temperatura`, `supply-api`, `inventory-qr-label`, `send-tecnico-whatsapp`, `maintenance-completion-whatsapp`, `create-and-send-hotel-test-whatsapp`, `telegram-backup`, `randchat-media-cleanup`.

Dopo ogni modifica alle edge function serve il **deploy su Supabase** (per ntfy: `scripts/deploy-ntfy-edge.sh`, smoke con `node scripts/smoke-ntfy-edge.mjs`).

### Note sul database (importante)

Le migration sono copiate **intere** dal repo originale per non rompere la catena dello schema: contengono ancora le tabelle/funzioni `randai_*`, `randcore_*`, `randguide_*`, `randmind_*`, `randgateway_*` create dall'ecosistema Rand. **L'app non le usa più**: restano inerti. Potare lo schema richiede di verificare dipendenze e RLS su un database reale (squash o nuove migration di drop), non per sola ricerca nel codice. `pin-auth` continua a nascondere dalla directory login gli utenti con ruolo `RandAI`, se presenti nel database.

Separazione spazi Supabase (transizione): confini applicativi **HotelGio | MultiHotel | Eye Supremo**; HotelGio è fuori scope. Dettagli in `docs/architecture/SUPABASE_SPACE_SEPARATION.md`.

## Confini invariabili

- `hotel_id`, membership e scope hotel sono obbligatori.
- Supabase RLS/RPC è l'autorità finale.
- Nessun frontend riceve `service_role`, PIN, refresh token o secret non necessari.
- Un solo proprietario canonico per capacità (navigazione, permessi, offline, notifiche): niente secondi sistemi paralleli.
- Una parte è zombie soltanto dopo verifica di utilizzo, riferimenti e dipendenze.

## Quality Matrix e test

```bash
npm run build
npm test                 # suite completa
npm run test:quality     # matrix + critical + multihotel + suite
npm run test:matrix
npm run test:critical
npm run test:phase0
npm run test:phase1
npm run test:chaos
npm run test:randui
npm run test:e2e         # richiede un preview server (E2E_BASE_URL)
npm run test:device
node scripts/check-bundle.mjs
```

La CI (`.github/workflows/ci.yml`) esegue audit dipendenze, Phase 0/1, Quality Matrix, critical gate, chaos gate, parità multi-hotel, build + bundle budget, contratti RandUI, suite completa, Chromium + WebKit e device acceptance. Una build verde da sola non basta per claim su UI, PWA o cross-platform. Nota: `test/page-load-hardening.test.js` richiede Node 24 (con Node 22 va in "cancelled", comportamento identico al repo originale).

## Deploy

- Repository: `Apicehotel/Randapp-Multihotel`.
- **Vercel:** Git deploy automatici sospesi (`vercel.json → git.deploymentEnabled=false`).
- **DigitalOcean/Ocean:** `.do/app.yaml` + `Dockerfile.ocean` (nginx serve `dist`, 404 reale su `/assets/*` mancanti, fallback SPA solo sulla navigazione). Il workflow `digitalocean-preview.yml` verifica sulle PR e fa il deploy su push a `main` o avvio manuale (`workflow_dispatch`); richiede il secret `DIGITALOCEAN_ACCESS_TOKEN` (senza, il job di deploy fallisce senza toccare nulla). Prima di attivarlo ricontrolla repo/branch in `.do/app.yaml` e l'URL in `E2E_BASE_URL`: puntano all'app Ocean esistente.
- Nessun deploy produzione automatico e nessun merge diretto su `main` da strumenti automatici: branch + PR + CI + revisione umana.
- Il Service Worker verifica la freschezza della build (avvio, ritorno in primo piano, riconnessione) e ricarica una sola volta se l'HTML punta a un bundle diverso.

## Documentazione

- `AGENTS.md` — contratto di ingegneria (invarianti, Supabase, sicurezza, PWA, notifiche, offline, test).
- `FRONTEND_ARCHITECTURE.md` — architettura frontend.
- `docs/architecture/MULTIHOTEL_CONTRACT.md`, `MULTIHOTEL_FEATURE_MATRIX.md`, `AUTHORIZATION_RLS_MATRIX.md`, `OFFLINE_RETRY_CONCURRENCY.md`, `RANDCHAT.md`, `RIFORNIMENTI_INTERNI.md`, `RANDDESKTOP_PRINTING.md`, `SUPABASE_SPACE_SEPARATION.md`.
- `docs/DEVICE_ACCEPTANCE.md` — acceptance su dispositivi.

**README:** ogni PR sostanziale aggiorna questo file allo stato operativo corrente (niente documentazione zombie; la cronologia resta nei documenti dedicati).
