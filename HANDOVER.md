# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `75f5228` (Gold-Aufleuchten Zeile/Spalte) · Tip `2140090`  
**Sprache:** Deutsch  
**Stand Doku:** 2026-08-12

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
| Branch | `milestone-22-prep` @ Tip `2140090` |
| Frontend-Tests | **87** grün |
| Roadmap | **M42/M43** vor M30: Rival-Avatare lokal + Admin-PIN (ein Build) |
| Entwickler-Vorschau | **InApp-Käufe (Features)** auf `/settings` nach Code (`NEXT_PUBLIC_LABS_PIN`) — früher „Hausregeln“ |
| iOS/TestFlight | Version `2.0`; Builds bis **~51+**; Menü-Version = natives Bundle (`App.getInfo`); Admin per **PIN** + lokalem Key (M43) |
| Backend Prod | Migrationen inkl. `20260807120000_pairing_baseline_absolute`, `20260807140000_pairing_baseline_app_snapshot` — Deploy nötig nach Stabilitäts-Batch |

## Wichtig: Admin (ein Build, M43)

- **Ein App-Build:** `NEXT_PUBLIC_ADMIN_PIN` setzen; `NEXT_PUBLIC_ADMIN_API_KEY` im öffentlichen Bundle **leer** lassen.
- Nach PIN unter Menü/Einstellungen → **Admin** den Server-`ADMIN_API_KEY` lokal hinterlegen.
- Backend `requireAdminKey` bleibt Pflicht für Baseline + Reset (`X-Admin-Key`).
- Legacy: Env-Key im Bundle funktioniert nur noch mit PIN (falls PIN gesetzt).

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle und öffnet Xcode.
- Vor Archive: `git log -1`; in `frontend/.env.production`: `NEXT_PUBLIC_LABS_PIN`, **`NEXT_PUBLIC_ADMIN_PIN`**, `NEXT_PUBLIC_APP_VERSION=2.0` (Admin-API-Key lieber lokal nach PIN). Menü-Build auf iOS kommt aus Xcode (`App.getInfo`); Web-Fallback `NEXT_PUBLIC_APP_BUILD=web`.
- Bei Pull-Konflikt oft: `git restore frontend/package-lock.json` vor `git pull`.

## Letzte Produktänderungen

### UX 2026-08-12 — Gold-Aufleuchten + Menü-Version

- **Gold-Aufleuchten:** Bei fertiger Feld-Zeile oder Spiel-Spalte leuchten die betroffenen Felder **3× gleichzeitig vollflächig gold**; kurze Fanfare (Sounds-Toggle). Kein Extra-Trigger für den gesamten Zettel.
- **Toggle** unter Visuelle Einblendungen: „Gold-Aufleuchten“ (unabhängig von Erfolgsanimationen), inkl. Info-„i“.
- **Menü-Version (iOS):** `App.getInfo()` → z. B. `Version 2.0 (51)`; Web: `Version 2.0 (web)`.
- **Achievement-Sounds:** AudioContext Unlock im Tap + `await resume`; nicht mehr über `prefers-reduced-motion` stumm.
- Dateien: `sheetFuseHighlight.ts`, `ScoreSheetTable.tsx`, `PlayBoard.tsx`, `TableModePlayBoard.tsx`, `achievementSound.ts`, `gameFeedbackPrefs.ts`, `visualFeedbackInfo.ts`, `appVersion.ts`, `AppFooterMenu.tsx`, `globals.css`

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
- Gold-Aufleuchten bei fertiger Zeile/Spalte (eigener Toggle).

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
- Feedback: `sheetFuseHighlight.ts`, `achievementSound.ts`, `visualFeedbackInfo.ts`, `gameFeedbackPrefs.ts`, `appVersion.ts`
- iOS: `docs/ios_current.md`, `GOiOS.md`, `docs/testflight-app-store.md`

## Offene Prioritäten

1. **M42 / M43** — Rivalen-Bilder lokal; Admin-PIN + Key; manuell prüfen.
2. **M30** danach — TestFlight-Regression; App Store Connect (Agreement, Bank/Steuer, Preis 1,19 €, Screenshots, Submit).
3. Optional **Stufe A** Stats (pseudonyme `playerId`-Links) nur bei nachgewiesenem Drift.
4. **M36** nach M30 (öffentliche Features / Session-UI).
5. `milestone-22-prep` → `main` nach Release-Freigabe.

## Agent-Start (Übergabeprompt)

```text
Du arbeitest an dice.budget (kniffel). Lies zuerst AGENT_RULES.md und HANDOVER.md, dann docs/milestones_active.md.

Workspace: /home/bottleadmin/projects/kniffel
Branch: milestone-22-prep
HEAD: 2140090 / Produkt 75f5228 (Gold-Aufleuchten Zeile/Spalte)
Live: https://dicebudget.bottle-trade.de
Sprache: Deutsch

Regeln: Keine Commits ohne ausdrückliches GO. Kein sudo. Keine Watcher/Polling/Dauerprozesse. Nach Code-Änderungen nummerierte [Server]/[Mac]-Befehle (AGENT_RULES §9). Frontend-Build: cd frontend && npm run build. Backend-Deploy nur Nutzer: sudo bash infra/scripts/deploy-backend-prod.sh.

Stand: M42 Rival-Avatare + M43 Admin-PIN (ein Build); Gold-Aufleuchten; M37–M41; M30 bewusst danach.

Antworte auf Deutsch. Kleine Inkremente, vor größeren Features GO einholen.
```
