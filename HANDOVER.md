# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `cce4996` → M24 nach Commit  
**Sprache:** Deutsch

Kompakte Startübergabe. **Roadmap:** `docs/milestone-roadmap-analysis.md` (M24 UX-Blocker & Deploy-Verifikation). Aktiver Milestone-Stand: `docs/milestones_active.md`. iOS/TestFlight: `docs/ios_current.md`. Architektur/Betrieb: `docs/decisions.md` nur bei Bedarf.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9: Nach Code-Änderungen nummerierte `[Server]`/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung.
- Kein `sudo` durch den Agent; Backend-Deploy/nginx reload per SSH auf dem Server (Nutzer).
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet nur unter `/home/bottleadmin/projects/kniffel`.
- Mac-Clone: `/Users/marclangebeck/projects/kniffel`.
- Reine Frontend-Änderungen: `cd frontend && npm run build` auf dem Server; Nginx liefert `frontend/out/` aus.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` |
| Produktcode-HEAD | M26 — Backend-Qualität (OpenAPI, Route-Tests, ABANDONED, player-names API) |
| Roadmap | M26 umgesetzt; **M27** Frontend-Tests als Nächstes |
| Startscreen (Standard) | **Cinematic Editorial** — gestapelte Poster-Kacheln Multi/Solo; Bilanz-Chip oben; integrierte Glas-CTA; Rollback: `HomeBentoGridClassic` |
| Layout-Umschaltung | `NEXT_PUBLIC_HOME_LAYOUT=cinematic\|classic` in `frontend/.env.production`; `bash infra/scripts/set-home-layout.sh …`; Browser: `localStorage dicebudget.homeLayout` |
| Backend | M23 deployed; Admin-Key gesetzt; Coaching/`scoreProgression`/Migration `extra_yatzy_die_values` — in M24 verifizieren |
| Branding | Nutzer-sichtbar **DiceBudget** und **Alle Fünfe** |
| Footer | `Home · Statistik · Einstellungen · Menü` — Glas-Morph-Menü, Screenshot, Support, Legal |
| Multi-Raum | **Code teilen** nur Code (kein Einladungstext/Link) |
| iOS/TestFlight | Version `2.0`; **Build `2.0 (28)`** mit `d8b5952` (Upload/Verarbeitung 2026-06-11); zuvor `2.0 (27)` mit `66e8487` |

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle.
- Vor Archive: `git log -1` → `d8b5952`; Bundle-Check: `grep -c home-cinematic-door` in `ios/App/App/public/_next/static/css/*.css` > 0.

## Letzte Produktänderungen (`d8b5952`)

| Feature | Backend nötig |
|---------|---------------|
| Cinematic Editorial Startscreen (gestapelte Poster, Bilanz-Chip, Würfel-Bühne + integrierte CTA) | Nein |
| Classic-Startscreen als `HomeBentoGridClassic` + Layout-Switch (`homeLayout.ts`, `set-home-layout.sh`) | Nein |

## Bekanntes UX-Thema (offen)

- **Punkte-Duell live:** Multi-Analyse-Graph nach Backend-Deploy (`scoreProgression`) — Prod-Verifikation: `bash infra/scripts/verify-prod-api.sh`
- **Safari-/WebView-Cache:** Hard-Reload nach Deploy/TestFlight-Update; nginx reload falls Cache-Header fehlen (siehe unten)
- **Mac `git pull`:** `git restore frontend/package-lock.json` vor Pull.

## Prod-Verifikation & nginx (M24)

Einmalig nach Deploy (kein Loop):

```bash
bash /home/bottleadmin/projects/kniffel/infra/scripts/verify-prod-api.sh
```

Optional mit abgeschlossener Multi-Session:

```bash
VERIFY_INVITE=CODE VERIFY_PLAYER=PLAYERID bash infra/scripts/verify-prod-api.sh
```

**nginx Cache-Header** (HTML `no-cache`, `_next/static/` `immutable`) — reload durch Nutzer:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Prisma-Migration auf Prod: `cd backend && npx prisma migrate status` (u. a. `extra_yatzy_die_values`, `solo_secret_token`).

## Wichtige Dateien

- Startscreen: `HomeBentoGrid.tsx`, `HomeBentoGridCinematic.tsx`, `HomeBentoGridClassic.tsx`, `HomeHeroBanner.tsx`, `lib/homeLayout.ts`, `lib/useHomeHeroData.ts`, `globals.css` (`.home-cinematic*`)
- Layout-Script: `infra/scripts/set-home-layout.sh`
- Footer/Menü: `AppLegalFooter.tsx`, `AppFooterMenu.tsx`
- Multi-Teilen: `multi/page.tsx`, `shareSocial.ts`
- Abschluss/Analyse: `RunFinishScreen.tsx`, `MatchAnalysisView.tsx`
- Nginx: `infra/nginx/dicebudget.bottle-trade.de.conf`

## Offene Prioritäten

1. **M27** (Roadmap): Frontend-Tests & Stabilität — `GO M27` vom Nutzer.
2. TestFlight-Regression: Cinematic-Startscreen, Footer/Menü, `/play`, Pool-Endspiel (Auto-Refresh Nicht-Sieger), Fortschritt, Code teilen.
3. nginx reload (Cache-Header), falls `verify-prod-api.sh` no-cache meldet.
4. App Store Connect: Agreement, Bank/Steuer, Preis `1,19 EUR`.
5. Später: Web-Zugang nach App-Store-Release deaktivieren (nur App + API).

## Pflicht-Lesereihenfolge

1. `AGENT_RULES.md`
2. `HANDOVER.md`
3. `docs/milestones_active.md` (nur bei Bedarf)

Optional: `docs/ios_current.md`, `docs/decisions.md`, `docs/milestones_archive.md`, `docs/ios_archive.md`

## Agent-Start

```text
Du arbeitest an dice.budget (kniffel). Lies AGENT_RULES.md und HANDOVER.md — Aufträge folgen danach; milestones_active.md nur bei Bedarf.
```
