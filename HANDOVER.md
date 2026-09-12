# Übergabe - DiceBudget Strategy Edition

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**HEAD:** siehe `git log -1`  
**Sprache:** Deutsch  
**Stand Doku:** 2026-09-12 — TestFlight **2.0 (103)**, Bundle-Modus, HEAD `905ff1e`

Kompakte Startübergabe. **Roadmap:** `docs/milestone-roadmap-analysis.md`. Aktiver Stand: `docs/milestones_active.md`. iOS/TestFlight: `docs/ios_current.md`. Architektur/Betrieb: `docs/decisions.md` nur bei Bedarf. **Produktfamilie (3 Apps):** `docs/tournament/products.md`. Event-Host: `docs/tournament/` — DiceBudget-Kern unantastbar.

## Produkt kurz

| | |
|--|--|
| Name | DiceBudget · Strategy Edition |
| Monetisierung | Einmaliger App-Kauf; **keine Werbung**; **keine Kern-In-App-Käufe** |
| Strategy | Bestandteil der gekauften App (kein IAP-Gate) |
| Login | Keiner |
| Solo | Weitgehend lokal |
| Multi / Stats | Eigener Server |
| Multi-Einstieg | QR/Link primär, Raumcode Fallback |
| Datenschutz | `/datenschutz` live |

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9: Nach Code-Änderungen nummerierte `[Server]`/`[Mac]`-Befehle ausgeben.
- Nach abgeschlossenen Aufträgen mit Dateiänderungen **automatisch commit + push** (kein extra Git-GO). Ausnahme: Nutzer sagt „nicht pushen“. Feature-/Deploy-GO bleibt für Start großer Arbeiten und sudo.
- Kein `sudo` durch den Agent; Backend-Deploy per Nutzer auf dem Server.
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet nur unter `/home/bottleadmin/projects/kniffel`.
- Mac-Clone: `/Users/marclangebeck/projects/kniffel` (auch `~/projects/kniffel`).
- Reine Frontend-Änderungen: `cd frontend && npm run build` auf dem Server; Nginx liefert `frontend/out/` aus.
- **Events:** drei Apps — **DiceBudget** (Pro), **DiceBudget Tournament** (Host), **DiceBudget GO** (nur Teilnahme, geplant). Quelle: `docs/tournament/products.md`. DiceBudget-Kern unantastbar; Events nur additiv. Hosten nur Tournament.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` |
| Release-Ziel iOS | **2.0 (103)** TestFlight — Bundle, siehe `docs/ios_current.md` |
| Hausregeln | Einstellungen → **Multi** (Strategy), immer ohne Labs-PIN |
| Admin | PIN + lokal hinterlegter API-Key (M43), getrennt von Legacy-Labs |
| iOS | Capacitor-Bundle; Deployment Target **15.0**; Bundle `de.bottletrade.dicebudget` |
| Tournament | T1–T6 code-fertig; Host separat; Kern unantastbar |
| Backend Prod | Nach API-Änderungen: `deploy-backend-prod.sh` + Dienst-Neustart |

## Multi-Beitritt — Stand 2026-09

- **Primär:** QR scannen oder Link/Universal Link (`…/multi/join?code=…`).
- **Fallback:** Raumcode manuell („Code eingeben“) in `JoinByQrScan`.
- Host: QR + Lobby; AASA + Associated Domains `applinks:dicebudget.bottle-trade.de`.

## Admin (ein Build, M43)

- `NEXT_PUBLIC_ADMIN_PIN` setzen; `NEXT_PUBLIC_ADMIN_API_KEY` im Bundle **leer**.
- Nach PIN: Einstellungen → **Admin** → Server-`ADMIN_API_KEY` lokal speichern.
- Backend `requireAdminKey` bleibt Pflicht (`X-Admin-Key`).

## iOS-Bundle ≠ Web-Deploy

- **iOS-Bundle ≠ Web:** Capacitor packt `ios/App/App/public` ein (im Git). **Kein** `server.url`. Vor Archive: `npm run build:ios` + `verify:ios-web`.
- Vor Archive: `git log -1`; Marketing **2.0**, Build = ASC-höchste + 1 (aktuell TF **103**); Admin-API-Key leer.
- Details: `docs/ios_current.md`.

## Events (kurz)

**Drei Apps:** Pro (`frontend/`) · Tournament (`apps/tournament/`) · GO geplant.  
Ablauf und Deploy: `docs/tournament/README.md`. DiceBudget-Kern bleibt voll nutzbar ohne Event.

## Letzte relevante Produktänderungen (Auswahl)

- Hausregeln unter Multi freigegeben; Labs-PIN-Sperre entfernt (2026-09).
- Alle-Fünfe-Effizienz (Strategy); Backend muss aktuelle Dist laufen.
- Marketing-LP / Soft-Launch-Copy; Tournament T1–T6; Spielername auf Server; Multi-QR.

Vollständige Historie: `CHANGELOG.md`, `docs/milestones_active.md`.
