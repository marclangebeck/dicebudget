# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `04ab018` (Spielanalyse straffen, Statistik-Hero, Einstellungen Ein-Screen, Screenshot-Footer)  
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
| Letzte Features | Einstellungen Ein-Screen; Statistik-Hero; Spielanalyse-Kern; Screenshot-Footer; Startscreen-Würfel |
| Roadmap | **M30** App Store Release als Nächstes |
| Backend Prod | Hausregeln-API deployed (Nutzer bestätigt) |
| Frontend-Tests | **37** Unit-Tests (`npm run test`); Backend 86 Tests |
| Entwickler-Vorschau | Hausregeln-Toggles auf `/settings` nach Code-Eingabe (`NEXT_PUBLIC_LABS_PIN`) |
| iOS/TestFlight | Version `2.0`; **Build `2.0 (28)`** in Connect; **nächster Upload `2.0 (29)`** auf HEAD `04ab018` (noch offen) |

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle.
- Vor Archive: `git log -1`; `NEXT_PUBLIC_LABS_PIN` in `frontend/.env.production` setzen.

## Letzte Produktänderungen (2026-06-15, Web deployed)

### Einstellungen Ein-Screen (`561151d`, `9057e93`)

- Alle Toggles auf **einer scrollbaren Seite**: Modus, Feedback, Solo/Multi, iPad-Tisch, Hausregeln (nach Code).
- **Solo- und Multi-Start** direkt aus den Einstellungen.
- `/settings/feedback` und `/settings/labs` leiten auf `/settings` um.
- iPad-Namensfelder bleiben beim Löschen leer (Fallback „Links“/„Rechts“ nur beim Spielstart).

Dateien: `app/settings/page.tsx`, `components/settings/*`, `lib/uiPrefs.ts`

### Statistik UX Stufe A+B (`bbf4934`)

- **StatsHeroPanel:** Bilanz, Siegquote, KPIs (Rivalen, Runden, Best, Saison) + Teilen.
- Paarungskarten: Badges (+vorn/−hinten, Top-Rivalität), Duellbalken, Sortierung (Zuletzt / Engste / Meiste Runden).

Dateien: `StatsHeroPanel.tsx`, `lib/statsOverview.ts`, `lib/statsPairingInsights.ts`, `app/stats/page.tsx`

### Spielanalyse & Fortschritt (`04ab018`)

- **Spielanalyse:** Kompakter Kern „Warum verloren/gewonnen?“; Details eingeklappt.
- **Duell-Graph:** Vergleich alle **10 %** (0–100), nicht jeder Eintrag.
- **Fortschritt 25/50/75 %:** Hinweis **vorn/zurück/gleichauf** (ohne Abstand); Overlay per **Weiter** wegklickbar (kein Auto-Dismiss).

Dateien: `MatchAnalysisView.tsx`, `ScoreProgressionChart.tsx`, `lib/scoreProgressionChart.ts`, `RunProgressOverlay.tsx`, `lib/runProgressFeedback.ts`

### Screenshot (`d47d33a`)

- Button **„Bild“** in der Fußleiste; Kamera-Blitz, Vorschau vor Teilen, Toast.
- Hamburger-Menü nur noch Support, Datenschutz, Impressum, bottle-trade.de.

Dateien: `AppLegalFooter.tsx`, `ScreenshotPreviewDialog.tsx`, `AppToast.tsx`

### Startscreen (`72ba890`)

- 3D-Würfel **ohne** Puls-Ring/Glow; ~30 % größer, zentrierter; ein Card-Hintergrund.

Dateien: `HomeBentoGridCinematic.tsx`, `HomeBentoGridClassic.tsx`, `globals.css`

### Hausregeln (Feature-Labor, Strategy only) — unverändert funktional

| Regel | Kurz | Backend |
|-------|------|---------|
| **Brennt** | −5 Pool, neu würfeln — im **Wurf-Overlay** | `POST .../house-rules/burn` |
| **Wurf verkaufen** | Volle Feldzeile; Pool-Transfer | `POST .../roll-sale` |
| **2× Alle Fünfe** | Gegner halber Pool | `POST .../yatzy-streak-penalty` |

Aktivierung: Code auf `/settings` → Hausregeln-Toggles. Im Spiel: **Zusatzregeln** am Zettel / im Overlay.

## Prod-Verifikation & Deploy

```bash
bash /home/bottleadmin/projects/kniffel/infra/scripts/verify-prod-api.sh
```

**Backend-Deploy** (nur bei API-Änderungen):

```bash
cd ~/projects/kniffel
sudo bash infra/scripts/deploy-backend-prod.sh
```

Reine Frontend-Änderungen seit 2026-06-15: **kein** Backend-Neustart nötig.

## Wichtige Dateien

- Einstellungen: `app/settings/page.tsx`, `components/settings/`
- Statistik: `StatsHeroPanel.tsx`, `PairingSummaryCard.tsx`, `lib/statsOverview.ts`
- Spielanalyse: `MatchAnalysisView.tsx`, `ScoreProgressionChart.tsx`
- Screenshot: `AppLegalFooter.tsx`, `lib/screenshotFlow.ts`
- Hausregeln: `houseRules.ts`, `HouseRulesTableActions.tsx`, `HouseRulesPanel.tsx`
- Feature-Labor: `featureFlags.ts`, `labsAccess.ts`
- iOS-Workflow: `docs/ios_current.md`, `GOiOS.md`

## Offene Prioritäten

1. **iOS Build `2.0 (29)`** — `git pull` → `npm run build:ios` → Xcode Archive → TestFlight (HEAD `04ab018`)
2. **M30 Sprint 30.1** — TestFlight-Regression (Einstellungen, Statistik, Spielanalyse, Screenshot, Hausregeln)
3. **M30 Sprint 30.2** — App Store Connect (Agreement, 1,19 EUR, Metadaten)
4. `milestone-22-prep` → `main` nach Release-Freigabe

## Agent-Start

```text
Du arbeitest an dice.budget (kniffel). Lies AGENT_RULES.md und HANDOVER.md.
Branch milestone-22-prep. Web-HEAD 04ab018; iOS Build 29 noch offen. M30 App Store als Nächstes.
Keine Commits ohne GO. Antworte auf Deutsch.
```
