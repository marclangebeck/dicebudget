# Dauerhafte Entscheidungen - dice.budget

Dieses Dokument sammelt weiterhin gueltige Architektur-, Betriebs- und Projektentscheidungen. Historische Milestone-Details stehen in `docs/milestones_archive.md`.

## Agentenbetrieb Und Server-Safety

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- Oberstes Ziel: keine Abuse-Sperre durch Netzwerk- oder Hintergrundaktivitaet.
- Der Agent arbeitet direkt auf dem Server in `/home/bottleadmin/projects/kniffel`.
- Der Agent hat keinen Mac-Zugriff und kein sudo.
- Keine Aenderungen ausserhalb des Projekts ohne ausdrueckliche Freigabe.
- Keine Drive-by-Refactors.
- Kleine Inkremente, Ursache erklaeren, betroffene Dateien nennen, bei groesseren Schritten GO einholen.

## Kein Polling, Keine Watcher, Kein Auto-Deploy

- Kein Polling gegen API oder Domain.
- Keine Netzwerk-Schleifen, keine Health-Check-Loops, keine Lasttests.
- Keine Watcher oder Dauerprozesse auf dem Server.
- Kein `npm run dev`, `next dev`, `tsx watch` oder vergleichbare Prozesse dauerhaft auf dem Server.
- Kein Auto-Deploy, keine cronjobs, keine systemd/path units ohne ausdrueckliche Freigabe.
- Erlaubt sind einzelne, gezielte Checks, sparsam und nachvollziehbar.

## GitHub / Server / Mac Synchronisation

- Nach jeder Code-Aenderung muessen GitHub, Server und Mac auf denselben Stand gebracht werden.
- Der verbindliche Ablauf steht in `AGENT_RULES.md` Sektion 9.
- Der Nutzer bekommt immer eine nummerierte Reihenfolge mit kopierbaren Befehlen.
- Befehle werden mit `[Server]` oder `[Mac]` markiert.
- Sudo-Schritte sind immer Nutzer-Aufgabe.
- Keine Inline-Kommentare in kopierbaren Befehlen.
- Keine Commits ohne ausdrueckliche Nutzer-Anweisung.

## Deployment Und Betrieb

- Produktion bevorzugt statischen Next.js-Export.
- Frontend-Produktion: `frontend/out/` wird direkt von Nginx ausgeliefert.
- Reine Frontend-Aenderungen brauchen auf dem Server nur:

```bash
cd /home/bottleadmin/projects/kniffel/frontend
npm run build
```

- Bei reinen Frontend-Aenderungen ist kein sudo und kein Backend-Neustart noetig.
- Backend-Produktion laeuft ueber `kniffel-backend.service`.
- Backend-/Nginx-Aenderungen brauchen Nutzer-sudo, typischerweise ueber `infra/scripts/deploy-backend-prod.sh`.
- `frontend/.env.production` enthaelt `NEXT_PUBLIC_API_URL`.

## Architektur

- Frontend: Next.js 15 mit statischem Export (`output: "export"`).
- Backend: Express + TypeScript + Prisma + SQLite.
- Produktion: https://dicebudget.bottle-trade.de
- API-Produktion: https://dicebudget.bottle-trade.de/api
- iOS: Capacitor 7, Bundle `de.bottletrade.dicebudget`.
- Web und iOS teilen die Frontend-Codebasis, Releases sind aber getrennt.
- Web-Deploy aktualisiert nicht die iOS-App; iOS braucht `npm run build:ios` auf dem Mac und Xcode-Upload.

## Datenschutz- Und Identitaetsmodell

- Solo laeuft lokal auf dem Geraet.
- Solo-Spielstaende und Solo-Statistik werden lokal gespeichert.
- Multiplayer verwendet eine lokale `playerId` pro Geraet.
- Server speichert Multiplayer-Daten pseudonym, nicht mit Klarnamen.
- Lesbare Namen/Aliase werden lokal auf dem Geraet aufgeloest.
- Dauerhafte Multiplayer-Vergleiche benoetigen serverseitige pseudonyme Matchdaten.
- "Gar nichts auf dem Server speichern" und "geraeteuebergreifende Langzeitvergleiche" sind nicht gleichzeitig erreichbar.
- **Stats-Sync Stufe 0 (2026-08):** Globale Korrektur nur Admin-Baseline und „Server bereinigen“. „Hier ausblenden“ ist bewusst nur lokal und darf nicht als Sync-Werkzeug gelten. Keine zentralen Anzeigenamen — Datenschutzmodell unveraendert.
- **Baseline absolut (2026-08):** Admin-Siege werden als absoluter Zielstand gespeichert (`is_absolute`), damit alle Geraete denselben Stand sehen; Legacy-Baselines bleiben additiv. Client-Merge nutzt bei Override Max statt Summe.
- **Stufe A (optional, spaeter):** Pseudonyme Geraete-`playerId`-Links nur bei nachgewiesenem Drift der „meine Bilanz“-Filter — weiterhin ohne Klarname auf dem Server.

## Produktentscheidungen

- Spiel unterstuetzt 1-6 Spiele pro Partie.
- Zwei Modi bleiben: Strategy Edition mit Wurf-Pool und Klassisch ohne Pool.
- Statischer Export erzwingt Query-Parameter statt dynamischer Segmente fuer Join-/Detailseiten.
- Aktives Spiel auf `/play` soll ohne Seiten-Scroll auf einen Bildschirm passen.
- Finish-/Detailansichten duerfen bei Bedarf scrollen.
- App startet nativ direkt auf `/app`, Web-Landing bleibt `/`.
- Alter App-Store-Connect-Eintrag `com.mlangebeck.mobileapp` wird ignoriert.

## Bekannte Risikoentscheidungen

- `POST /stats/pairings/reset` und `POST /stats/pairings/baseline` erfordern den Header `X-Admin-Key` (Backend `ADMIN_API_KEY`, Frontend `NEXT_PUBLIC_ADMIN_API_KEY`). **M38:** Baseline wieder admin-only (gemeinsame Bilanz); Spieler blenden lokal aus und pflegen Namen/„Das bin ich“ gerätebezogen. Ohne konfigurierten Key → **503**.
- API-erstellte Singleplayer-Runs (`POST /runs`) erhalten `soloSecretToken`; Schreibzugriffe brauchen `X-Player-Secret`. Legacy-Runs ohne Token bleiben offen.
- Rate-Limit: max. 30 Requests/min/IP auf `POST /runs`, `POST /sessions`, `POST .../join`.
- `LeagueStanding` wird nach Stats-Reset aus verbleibenden Sessions neu berechnet (M29, `rebuildLeagueStandings`).
- `GET /sessions/invite/:code/match-analysis`: ohne `X-Player-Secret` nur bei Session-Status `FINISHED`; mit gültigem Secret des Viewers jederzeit (sofern Analyse bereit). Historie unter `/stats/match-analysis` nutzt FINISHED-Fallback.
- Server validiert erlaubte Score-Werte je Feldtyp, aber nicht die physische Wuerfelrealitaet.
- **Hausregeln (Strategy, Feature-Labor):** Brennt (−5 Pool), Wurf verkaufen, 2× Alle-Fünfe-Strafe — buchen Pool/Flags serverseitig; Eintrag bleibt manuell mit Validierung (`houseRules.ts`). Nur sichtbar nach `NEXT_PUBLIC_LABS_PIN` + Toggle auf `/settings` (Hausregeln-Bereich).
- `playerSecret` liegt im Client-Kontext; Geraetewechsel erfordert erneuten Join.
