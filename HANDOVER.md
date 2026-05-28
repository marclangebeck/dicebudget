# Übergabe-Prompt – DiceBudget Strategy Edition

**Zweck:** Abschnitt „Prompt für neuen Agent“ (unten) in einen neuen Cursor-Chat kopieren.

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Sprache Antworten:** Deutsch  
**Letzte inhaltliche Session:** Mai 2026 – iOS-UI-Fixrunde (Navigation, Legal-Links, dunkler App-Hintergrund, TestFlight Build 10)

## Update 2026-05-28 (verbindlicher Ist-Stand)

- **Web-Produktion:** Frontend auf Server deployed (`deploy-frontend-prod.sh`), HTTPS OK.
- **GitHub:** Branch `milestone-22-prep`, letzter relevanter Commit `0c734e8`.
- **iOS/TestFlight:** Upload **Build `1.0 (10)`** erfolgreich (nach `Copy failed`-Fix via Homebrew-`rsync` deaktivieren → `/usr/bin/rsync`).
- **Milestone 22** (Datenschutz-Umbau, pseudonymes Multi, lokales Solo): abgeschlossen und ausgerollt.
- **UI-Fixrunde iOS (M23/M26/M27):** Nutzer-Abnahme **bestätigt** (TestFlight):
  - Legal-Links `Datenschutz` / `Impressum` auf `/app` sichtbar
  - Einheitlicher `← Startseite`-Button (`app-nav-btn`) auf Unterseiten
  - Größere SVG-Kachel-Icons, dunkler Slate-Verlauf app-weit
  - Datenschutz/Impressum: scrollbar, Safe-Area unter Statusleiste
- **Offen (Store, nicht UI):** Paid-Vertrag, Preis 1,19 €, Store-Metadaten, öffentliches Review (Milestone 21.9–21.11, 21.14).

---

## Prompt für neuen Agent

Du arbeitest am Projekt **dice.budget** (Repo-Ordner: `kniffel`) weiter. Lies zuerst **`AGENT_RULES.md`**, dann **`GOiOS.md`** (iOS/Store) und diese Datei.

### Was das Projekt ist

- **Yatzy/Kniffel** mit wählbarer **Spielanzahl 1–6** (13 Felder pro Block).
- **Zwei Modi:** Strategy (`useStrategyRules: true`, Pool) vs. Klassisch.
- **Singleplayer:** lokal auf dem Gerät (`frontend/lib/localSoloRun.ts`) — kein Server-`POST /runs`.
- **Multiplayer:** pseudonym via `playerId` (UUID lokal), Server speichert `pid:<uuid>`.
- **Serien:** `leagueCode`, Ligapunkte (Sieger +1, Differenz-Bonus).
- **Statistik:** `/stats` — Paarungen; Detail `/stats/pairing?key=…`; lokale Aliase pro `playerId`.

### Tech-Stack

| Teil | Stack |
|------|--------|
| Backend | Express, TypeScript, Prisma, SQLite, Port **3020** |
| Frontend | Next.js 15, Tailwind v4, **static export** (`out/`), Dev **3021** |
| iOS | Capacitor 7, `frontend/ios/`, Bundle `de.bottletrade.dicebudget` |
| Prod Web | `https://dicebudget.bottle-trade.de` — Nginx + `/api/` |

**Routen:** Landing `/`, App `/app`, Datenschutz `/datenschutz`, Impressum `/impressum`

**API-URL im Build:** `frontend/.env.production` → `NEXT_PUBLIC_API_URL=https://dicebudget.bottle-trade.de/api`

### Wichtige Dateien

```
backend/prisma/schema.prisma
backend/src/services/playField.ts
backend/src/services/sessionService.ts
backend/src/services/pairingStats.ts

frontend/app/app/page.tsx              # iOS-Start / Bento
frontend/app/datenschutz/              # LegalScrollShell + Safe-Area
frontend/app/impressum/
frontend/components/HomeBentoGrid.tsx  # Kacheln, Legal-Footer
frontend/components/AppScreenHeader.tsx
frontend/components/BackToHome.tsx
frontend/components/LegalScrollShell.tsx
frontend/components/SetupScreenLayout.tsx
frontend/components/PlayTopBar.tsx
frontend/components/PlayBoard.tsx
frontend/lib/localSoloRun.ts
frontend/lib/playerIdentity.ts
frontend/lib/branding.ts               # APP_HOME_PATH, PRIVACY_PATH, IMPRESSUM_PATH
frontend/app/globals.css               # .app-bg, .app-nav-btn, .home-bento-*, dunkler Verlauf
frontend/capacitor.config.ts
frontend/ios/App/App.xcworkspace
```

### Bereits erledigt (nicht neu erfinden)

- Milestones **1–20** (Grundgerüst, MP, UI-Modernisierung)
- Milestone **22** (pseudonymes Multi, lokales Solo, Migration, Deploy)
- Milestones **23–27** UI-Fixrunde: Navigation, Kachel-Icons, dunkler Hintergrund, Legal-Seiten, Impressum
- Milestone **21** technische Basis: Capacitor, TestFlight-Uploads bis Build **10**
- Backend-Tests: `cd backend && npm test` (37 grün)

### Deploy

```bash
sudo bash infra/scripts/deploy-prod.sh
sudo bash infra/scripts/deploy-backend-prod.sh
sudo bash infra/scripts/deploy-frontend-prod.sh
```

**Keine Commits**, es sei denn, der Nutzer verlangt es explizit.

### iOS-Release (Mac)

```bash
cd ~/projects/kniffel
git pull origin milestone-22-prep
cd frontend && npm run build:ios
brew unlink rsync   # falls which rsync → /opt/homebrew/bin/rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

Xcode: Build-Nummer erhöhen → **Any iOS Device** → Archive → Upload.

### Bekannte Stolpersteine

- Web-Deploy ≠ iOS-App — nach UI-Änderungen immer `npm run build:ios` + neues Archive.
- `Copy failed` beim Upload: Homebrew-`rsync` deaktivieren, Xcode mit System-PATH starten.
- Capacitor `scrollEnabled: false` — Legal-Seiten scrollen über `LegalScrollShell` (innerer Container).
- Statischer Export: Paarungs-Links als `<a href>` (voller Load).
- Frontend ohne `.env.production` → API zeigt auf localhost.

### Nächste sinnvolle Schritte (Store)

1. App Store Connect: Paid-Vertrag, Bank/Steuer, Preis **1,19 €**
2. Screenshots, Beschreibung DE, App-Datenschutzfragebogen finalisieren
3. TestFlight stabil halten → **Zur Überprüfung einreichen**

### Gesprächskontext

- Antworten auf **Deutsch**, präzise.
- Nutzer: Marc Langebeck, Xcode-Einsteiger — kleine Schritte mit kopierbaren Befehlen.
- Keine Drive-by-Refactors, keine Commits ohne Aufforderung.

---

## Schnellcheck nach Checkout

```bash
cd /home/bottleadmin/projects/kniffel/backend && npm install && npx prisma migrate deploy && npm test
cd /home/bottleadmin/projects/kniffel/frontend && npm install && npm run build
```

Health: `curl -s https://dicebudget.bottle-trade.de/api/health`

---

*Bei Fortsetzung `CHANGELOG.md`, `milestones.md` und ggf. diese Datei aktualisieren.*
