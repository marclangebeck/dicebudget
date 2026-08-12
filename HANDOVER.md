# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `40977d1` (Menü-Version native iOS)  
**Sprache:** Deutsch  
**Stand Doku:** 2026-08-11

Kompakte Startübergabe. **Roadmap:** `docs/milestone-roadmap-analysis.md` (**M30** App Store Release). Aktiver Milestone-Stand: `docs/milestones_active.md`. iOS/TestFlight: `docs/ios_current.md`. Architektur/Betrieb: `docs/decisions.md` nur bei Bedarf.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9: Nach Code-Änderungen nummerierte `[Server]`/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung (**GO**).
- Kein `sudo` durch den Agent; Backend-Deploy per Nutzer auf dem Server.
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet nur unter `/home/bottleadmin/projects/kniffel`.
- Mac-Clone: `/Users/marclangebeck/projects/kniffel` (auch `~/projects/kniffel`).
- Reine Frontend-Änderungen: `cd frontend && npm run build` auf dem Server; Nginx liefert `frontend/out/` aus.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` |
| Roadmap | **M30** App Store Release als Nächstes (Agreement, Preis 1,19 €, Metadaten, Submit) |
| Entwickler-Vorschau | **InApp-Käufe (Features)** auf `/settings` nach Code (`NEXT_PUBLIC_LABS_PIN`) — früher „Hausregeln“ |
| iOS/TestFlight | Version `2.0`; Builds bis **~45+** in Connect; Admin-UI nur wenn `NEXT_PUBLIC_ADMIN_API_KEY` im **Mac**-Build steckt |
| Backend Prod | Migrationen inkl. `20260807120000_pairing_baseline_absolute`, `20260807140000_pairing_baseline_app_snapshot` — Deploy nötig nach diesem Stabilitäts-Batch |

## Wichtig: Admin-Key (Web vs. iOS)

- **Öffentliches Web:** `frontend/.env.production` hat **keinen** `NEXT_PUBLIC_ADMIN_API_KEY` → kein Key im static Bundle, keine Admin-Buttons.
- **Admin-iOS / TestFlight:** Key nur in Mac-`.env.production` **vor** `npm run build:ios` setzen (gleich Backend `ADMIN_API_KEY`).
- Backend `requireAdminKey` bleibt Pflicht für Baseline + Reset (`X-Admin-Key`).

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle und öffnet Xcode.
- Vor Archive: `git log -1`; in `frontend/.env.production`: `NEXT_PUBLIC_LABS_PIN`, für Admin-UI **`NEXT_PUBLIC_ADMIN_API_KEY`** (gleich Backend), `NEXT_PUBLIC_APP_VERSION=2.0`. Menü-Build auf iOS kommt aus Xcode (`App.getInfo`); Web-Fallback `NEXT_PUBLIC_APP_BUILD=web`.

## Letzte Produktänderungen

### UX-Batch 2026-08-11 — Zettel-Lauffeuer + Sound-Fix

- **Zeilen-Highlight:** Wenn eine Feld-Zeile über alle Spiele voll ist → kurzes Lauffeuer (~1,2 s) um die Zeile.
- **Spalten-Highlight:** Fertige Spiel-Spalte (13 Felder) → gleiches Lauffeuer um die Spalte.
- **Sounds:** Achievement-/Einswurf-Töne zuverlässiger (AudioContext Unlock im Tap + `await resume`; nicht mehr über `prefers-reduced-motion` stumm).
- Settings „Visuelle Einblendungen“ / Info-„i“ um Zeilen-/Spalten-Lauffeuer ergänzt.
- Dateien: `sheetFuseHighlight.ts`, `ScoreSheetTable.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`, `achievementSound.ts`, `visualFeedbackInfo.ts`, `globals.css`

### Stabilitäts-Review 2026-08-07

- Web ohne eingebetteten Admin-Key; Finalize atomar; Absolute Baseline schreibt nach Korrektur weiter (App-Snapshot); Neue Runde behält Pool/House-Rules; Pairing-Cache nach Finalize; Auth-Texte.

### Features / Regeln (Labs → „InApp-Käufe (Features)“)

| Feature | Kurz |
|---------|------|
| **Brennt** | −1 Pool neu würfeln (Rest liegen) / −2 Pool Augenzahl selbst |
| **Wurf verkaufen**, **2×/3× Alle Fünfe**, **Oberer Bereich**, **Spalten-Pool-Boni** | Labs + Session-Flags wo vorgesehen |
| **M41** | 2×/3× nur bei echtem Alle Fünfe (`score === 50`) |

### Statistik / Sync (M38 Stufe 0)

- Admin: **Verwalten**-Menü → Auswählen → **Löschen · Server** oder Paarung tippen → Siege/Diff.
- Baseline speichert **absoluten** Zielstand zum Korrekturzeitpunkt (`isAbsolute` + App-Snapshot) — danach neue App-Partien schreiben Siege/Diff fort; geräteübergreifend ohne Additiv-Drift.
- Spieler: lokal ausblenden / Rivalen / „Das bin ich“ (kein Klarname zentral).

### UX

- Footer: aktiver Tab (Home / Statistik / Spielregeln) hervorgehoben.
- Stats/Settings/Root: kein iOS-Fokus-Zoom (`maximumScale: 1`, Inputs ≥ 16px).
- Einswurf-Sound (Strategy, 1 Wurf, Score > 0) unter Sounds-Toggle.
- Zettel-Lauffeuer bei fertiger Zeile/Spalte (Erfolgsanimationen-Toggle).

## Prod-Verifikation & Deploy

```bash
bash /home/bottleadmin/projects/kniffel/infra/scripts/verify-prod-api.sh
```

```bash
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
```

Frontend: `cd frontend && npm run build`.

## Wichtige Dateien

- Features: `featureFlags.ts`, `houseRules.ts` / Service, `houseRuleInfo.ts`
- Statistik: `app/stats/page.tsx`, `pairingMerge.ts`, `pairingStats.ts`, `hiddenPairings.ts`
- Footer: `AppLegalFooter.tsx`
- Feedback: `sheetFuseHighlight.ts`, `achievementSound.ts`, `visualFeedbackInfo.ts`
- iOS: `docs/ios_current.md`, `GOiOS.md`, `docs/testflight-app-store.md`

## Offene Prioritäten

1. **M30** — TestFlight-Regression auf HEAD; App Store Connect (Agreement, Bank/Steuer, Preis 1,19 €, Screenshots, Submit).
2. Optional **Stufe A** Stats (pseudonyme `playerId`-Links) nur bei nachgewiesenem Drift.
3. **M36** nach M30 (öffentliche Features / Session-UI).
4. `milestone-22-prep` → `main` nach Release-Freigabe.

## Agent-Start (Übergabeprompt)

```text
Du arbeitest an dice.budget (kniffel). Lies zuerst AGENT_RULES.md und HANDOVER.md, dann docs/milestones_active.md.

Workspace: /home/bottleadmin/projects/kniffel
Branch: milestone-22-prep
Live: https://dicebudget.bottle-trade.de
Sprache: Deutsch

Regeln: Keine Commits ohne ausdrückliches GO. Kein sudo. Keine Watcher/Polling/Dauerprozesse. Nach Code-Änderungen nummerierte [Server]/[Mac]-Befehle (AGENT_RULES §9). Frontend-Build: cd frontend && npm run build. Backend-Deploy nur Nutzer: sudo bash infra/scripts/deploy-backend-prod.sh.

Stand: UX-Batch Lauffeuer + Sound-Fix erledigt; Strategy-Würfe nur Pool; M37–M41; M30 offen.

Antworte auf Deutsch. Kleine Inkremente, vor größeren Features GO einholen.
```
