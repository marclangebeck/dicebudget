# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `f5c9ae7` (Stats absolut/Verwalten-Menü, Footer aktiv, Zoom-Fix, Brennt 2 Optionen, InApp-Käufe-Wording, M37–M41)  
**Sprache:** Deutsch  
**Stand Doku:** 2026-08-07

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
| Branch | `milestone-22-prep` @ `f5c9ae7` |
| Roadmap | **M30** App Store Release als Nächstes (Agreement, Preis 1,19 €, Metadaten, Submit) |
| Entwickler-Vorschau | **InApp-Käufe (Features)** auf `/settings` nach Code (`NEXT_PUBLIC_LABS_PIN`) — früher „Hausregeln“ |
| iOS/TestFlight | Version `2.0`; Builds bis **~45+** in Connect; Release-Kandidat = aktueller HEAD + `NEXT_PUBLIC_ADMIN_API_KEY` nur auf Admin-Gerät |
| Backend Prod | Migrationen inkl. `20260731120000_column_pool_bonuses`, `20260807120000_pairing_baseline_absolute` — Deploy bei Zweifel erneut |

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle und öffnet Xcode.
- Vor Archive: `git log -1`; in `frontend/.env.production`: `NEXT_PUBLIC_LABS_PIN`, für Admin-UI **`NEXT_PUBLIC_ADMIN_API_KEY`** (gleich Backend), `NEXT_PUBLIC_APP_VERSION=2.0`, `NEXT_PUBLIC_APP_BUILD=<Xcode-Build>`.

## Letzte Produktänderungen (bis HEAD `f5c9ae7`)

### Features / Regeln (Labs → „InApp-Käufe (Features)“)

| Feature | Kurz |
|---------|------|
| **Brennt** | −1 Pool neu würfeln (Rest liegen) / −2 Pool Augenzahl selbst |
| **Wurf verkaufen**, **2×/3× Alle Fünfe**, **Oberer Bereich**, **Spalten-Pool-Boni** | Labs + Session-Flags wo vorgesehen |
| **M41** | 2×/3× nur bei echtem Alle Fünfe (`score === 50`) |

### Statistik / Sync (M38 Stufe 0)

- Admin: **Verwalten**-Menü → Auswählen → **Löschen · Server** oder Paarung tippen → Siege/Diff.
- Baseline speichert **absolute** Siege + Diff (`isAbsolute`) — geräteübergreifend gleicher Stand nach erneutem Speichern.
- Spieler: lokal ausblenden / Rivalen / „Das bin ich“ (kein Klarname zentral).
- Admin-UI nur wenn `NEXT_PUBLIC_ADMIN_API_KEY` im Bundle steckt (Browser-Server-Env vs. Mac-`.env.production`).

### UX

- Footer: aktiver Tab (Home / Statistik / Spielregeln) hervorgehoben.
- Stats/Settings: kein iOS-Fokus-Zoom (`maximumScale: 1`, Inputs ≥ 16px).
- Einswurf-Sound (Strategy, 1 Wurf, Score > 0) unter Sounds-Toggle.

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
- iOS: `docs/ios_current.md`, `GOiOS.md`, `docs/testflight-app-store.md`

## Offene Prioritäten

1. **M30** — TestFlight-Regression auf HEAD; App Store Connect (Agreement, Bank/Steuer, Preis 1,19 €, Screenshots, Submit).
2. Stabilitäts-/Fehlerquellen-Review (nach Doku-Update, auf Nutzer-GO).
3. Optional **Stufe A** Stats (pseudonyme `playerId`-Links) nur bei nachgewiesenem Drift.
4. **M36** nach M30 (öffentliche Features / Session-UI).
5. `milestone-22-prep` → `main` nach Release-Freigabe.

## Agent-Start (Übergabeprompt)

```text
Du arbeitest an dice.budget (kniffel). Lies zuerst AGENT_RULES.md und HANDOVER.md, dann docs/milestones_active.md.

Workspace: /home/bottleadmin/projects/kniffel
Branch: milestone-22-prep
HEAD: f5c9ae7
Live: https://dicebudget.bottle-trade.de
Sprache: Deutsch

Regeln: Keine Commits ohne ausdrückliches GO. Kein sudo. Keine Watcher/Polling/Dauerprozesse. Nach Code-Änderungen nummerierte [Server]/[Mac]-Befehle (AGENT_RULES §9). Frontend-Build: cd frontend && npm run build. Backend-Deploy nur Nutzer: sudo bash infra/scripts/deploy-backend-prod.sh.

Stand: M37–M41 umgesetzt; Stats absolute Baseline + Verwalten-Menü; Footer aktiv; Zoom-Fix; Brennt 2 Optionen; Wording InApp-Käufe (Features); TestFlight 2.0 (Builds 40+).

Offen: M30 App Store Release; Stabilitäts-Review auf GO.

Antworte auf Deutsch. Kleine Inkremente, vor größeren Features GO einholen.
```
