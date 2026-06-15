# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `d6bd92b` (Zusatzregeln UI: Brennt im Overlay, Verkauf/Strafe dezent + eingeklappt)  
**Sprache:** Deutsch

Kompakte Startübergabe. **Roadmap:** `docs/milestone-roadmap-analysis.md` (**M30** App Store Release). Aktiver Milestone-Stand: `docs/milestones_active.md`. iOS/TestFlight: `docs/ios_current.md`. Architektur/Betrieb: `docs/decisions.md` nur bei Bedarf.

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
| Letzte Features | Zusatzregeln-UI (`d6bd92b`); Feature-Labor; Hausregeln Strategy |
| Roadmap | **M30** App Store Release als Nächstes |
| Backend Prod | Hausregeln-API deployed (Nutzer bestätigt) |
| Frontend-Tests | 33 Unit-Tests; Backend 86 Tests |
| Entwickler-Vorschau | `/settings/labs`; Code via `NEXT_PUBLIC_LABS_PIN` (Build-Zeit, Web + iOS) |
| iOS/TestFlight | Version `2.0`; **Build `2.0 (28)`** mit `d8b5952`; **nächster Upload `2.0 (29)`** auf aktuellem HEAD |

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle.
- Vor Archive: `git log -1`; `NEXT_PUBLIC_LABS_PIN` in `frontend/.env.production` setzen (für Entwickler-Vorschau).

## Letzte Produktänderungen

### Hausregeln (Feature-Labor, Strategy only)

| Regel | Kurz | Backend |
|-------|------|---------|
| **Brennt** | −5 Pool vor Eintrag (Feld leer), physisch neu würfeln — Button im **Wurf-Overlay** | `POST .../house-rules/burn` |
| **Wurf verkaufen** | Volle Feldzeile; Pool-Transfer; Freifeld 0 Würfe | `POST .../roll-sale` |
| **2× Alle Fünfe** | Letzte 2 KNIFFEL ≤3 Würfe → Gegner halber Pool | `POST .../yatzy-streak-penalty` |

Aktivierung: Entwickler-Vorschau → `/settings/labs` → Toggles. Im Spiel: **Zusatzregeln** (dezent rechts am Zettel oder eingeklappt im Wurf-Overlay); **Brennt** nur im Overlay. Labor-Code pro Gerät (`localStorage`).

Dateien: `houseRules.ts`, `houseRulesTableActions.tsx`, `HouseRulesPanel.tsx`, `ScoreEntryPanel.tsx`, `TableModePlayBoard.tsx`, `RollSaleOverlay.tsx`

### Feature-Labor (`5e621ac`)

- Code-Freischaltung (`NEXT_PUBLIC_LABS_PIN`), `/settings/labs`, `featureFlags.ts`

### Bugfix Strategy-Würfe (`e198293`)

- Kein 20er-Feld-Limit; Pool + Gesamtbudget; Alle-Fünfe-Hinweis bei fehlender Würfelwahl

## Prod-Verifikation & Deploy

```bash
bash /home/bottleadmin/projects/kniffel/infra/scripts/verify-prod-api.sh
```

**Backend-Deploy** (Projektroot):

```bash
cd ~/projects/kniffel
sudo bash infra/scripts/deploy-backend-prod.sh
```

Prisma-Migration `20260615120000_house_rules_roll_sale` (`roll_sale_free_fill_active` auf `runs`).

## Wichtige Dateien

- Hausregeln: `houseRules.ts`, `HouseRulesTableActions.tsx`, `HouseRulesPanel.tsx`, `ScoreEntryPanel.tsx`
- Feature-Labor: `featureFlags.ts`, `labsAccess.ts`, `app/settings/labs/page.tsx`
- Deploy: `infra/scripts/deploy-backend-prod.sh`
- iOS-Workflow: `docs/ios_current.md`, `GOiOS.md`

## Offene Prioritäten

1. **M30 Sprint 30.1** — TestFlight-Regression inkl. Hausregeln (Labor)
2. **iOS Build `2.0 (29)`** — `npm run build:ios` → Xcode Archive → TestFlight
3. **M30 Sprint 30.2** — App Store Connect (Agreement, 1,19 EUR, Metadaten)
4. `milestone-22-prep` → `main` nach Release-Freigabe

## Agent-Start

```text
Du arbeitest an dice.budget (kniffel). Lies AGENT_RULES.md und HANDOVER.md.
Branch milestone-22-prep. Feature-Labor und Hausregeln implementiert; M30 App Store als Nächstes.
Keine Commits ohne GO. Antworte auf Deutsch.
```
