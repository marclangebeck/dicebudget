# Übergabe – dice.budget (Kniffel Strategy Edition)

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**GitHub:** `marclangebeck/dicebudget` · Branch **`milestone-22-prep`**  
**Sprache:** Deutsch  
**Stand:** 2026-05-28 · Commit `72119ed`

---

## Ist-Stand (kurz)

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Frontend Deploy | Erledigt (`deploy-frontend-prod.sh`) |
| M22 Datenschutz | Erledigt (Solo lokal, Multi pseudonym) |
| iOS UI (M23–27) | Abgenommen (TestFlight Build **1.0 (10)**) |
| TestFlight Upload | Build 10 erfolgreich |
| App Store Review | **Offen** — Paid-Vertrag, 1,19 €, Metadaten |

**Nächste Priorität:** App Store Connect (Paid Agreement, Screenshots, Beschreibung) → Review. Optional: Impressum-Platzhalter ausfüllen.

---

## Übergabe-Prompt (Copy & Paste)

```
Du arbeitest am Projekt dice.budget weiter (Repo-Ordner: kniffel).

LIES ZUERST (in dieser Reihenfolge):
1. AGENT_RULES.md
2. HANDOVER.md
3. GOiOS.md
4. milestones.md → Abschnitt „Aktueller Arbeitsstand“

Antworten auf Deutsch. Keine Commits ohne explizite Nutzer-Anweisung.

─── PROJEKT ───
Yatzy/Kniffel, 1–6 Spiele pro Partie, Strategy (Pool) vs. Klassisch.
Solo: lokal auf Gerät (frontend/lib/localSoloRun.ts).
Multi: pseudonym via playerId (UUID), Server speichert pid:<uuid>.
Web + iOS teilen frontend/ (Next.js static export + Capacitor).

─── URLs / PFADE ───
Prod:     https://dicebudget.bottle-trade.de
App:      /app (iOS-Start)
Legal:    /datenschutz, /impressum
Branch:   milestone-22-prep
Server:   /home/bottleadmin/projects/kniffel
Mac:      ~/projects/kniffel
Xcode:    frontend/ios/App/App.xcworkspace
Bundle:   de.bottletrade.dicebudget

─── ERLEDIGT (nicht neu bauen) ───
• Milestones 1–22, 23–27 (UI iOS abgenommen)
• TestFlight Build 1.0 (10) hochgeladen
• Legal-Links /app, app-nav-btn Navigation, SVG-Icons, dunkler Hintergrund
• LegalScrollShell (Scroll + Safe-Area Datenschutz/Impressum)
• rsync-Fix: brew unlink rsync vor Xcode-Upload

─── OFFEN (deine Priorität) ───
1. App Store Connect: Paid Applications Agreement, Bank/Steuer
2. Preis 1,19 €, Screenshots (6.7" iPhone), Beschreibung DE
3. App-Datenschutzfragebogen finalisieren
4. Impressum: Platzhalter-Anbieterangaben (frontend/app/impressum/page.tsx)
5. TestFlight stabil → Zur Überprüfung einreichen

─── MAC: iOS-Build ───
cd ~/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm install && npm run build:ios
brew unlink rsync   # falls which rsync → /opt/homebrew/bin/rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
# Xcode: Build-Nummer erhöhen → Any iOS Device → Archive → Upload

─── SERVER: Web-Deploy ───
cd /home/bottleadmin/projects/kniffel && git pull origin milestone-22-prep
sudo bash infra/scripts/deploy-frontend-prod.sh

─── WICHTIGE DATEIEN ───
frontend/app/app/page.tsx
frontend/components/HomeBentoGrid.tsx
frontend/components/LegalScrollShell.tsx
frontend/components/AppScreenHeader.tsx
frontend/app/globals.css
frontend/lib/localSoloRun.ts
frontend/lib/playerIdentity.ts
frontend/lib/branding.ts

─── STOLPERSTEINE ───
• Web-Deploy ≠ iOS — nach UI-Änderung immer npm run build:ios + neues Archive
• Copy failed beim Upload → brew unlink rsync, Xcode mit System-PATH öffnen
• Capacitor scrollEnabled:false → Legal-Seiten scrollen nur in LegalScrollShell
• Alter Connect-Eintrag com.mlangebeck.mobileapp IGNORIEREN

Nutzer: Marc, Xcode-Einsteiger — kleine Schritte, kopierbare Terminal-Befehle.
```

---

## Prompt für neuen Agent (Referenz)

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
backend/src/services/sessionService.ts
backend/src/services/pairingStats.ts

frontend/app/app/page.tsx
frontend/app/datenschutz/              # LegalScrollShell + Safe-Area
frontend/app/impressum/
frontend/components/HomeBentoGrid.tsx
frontend/components/AppScreenHeader.tsx
frontend/components/BackToHome.tsx
frontend/components/LegalScrollShell.tsx
frontend/components/SetupScreenLayout.tsx
frontend/components/PlayTopBar.tsx
frontend/components/PlayBoard.tsx
frontend/lib/localSoloRun.ts
frontend/lib/playerIdentity.ts
frontend/lib/branding.ts
frontend/app/globals.css
frontend/ios/App/App.xcworkspace
```

### Bereits erledigt

- Milestones **1–22**, **23–27** (UI iOS abgenommen)
- TestFlight **Build 10** hochgeladen
- Backend-Tests: `cd backend && npm test` (37 grün)

### Deploy

```bash
sudo bash infra/scripts/deploy-frontend-prod.sh
sudo bash infra/scripts/deploy-backend-prod.sh
```

**Keine Commits**, es sei denn, der Nutzer verlangt es explizit.

### iOS-Release (Mac)

```bash
cd ~/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm run build:ios
brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

### Gesprächskontext

- Antworten auf **Deutsch**, präzise, kopierbare Befehle.
- Nutzer: Marc Langebeck, Xcode-Einsteiger.

---

## Schnellcheck

```bash
cd /home/bottleadmin/projects/kniffel/backend && npm install && npx prisma migrate deploy && npm test
cd /home/bottleadmin/projects/kniffel/frontend && npm install && npm run build
curl -s https://dicebudget.bottle-trade.de/api/health
```

---

*Doku-Index: GOiOS.md · milestones.md · CHANGELOG.md · docs/testflight-app-store.md*
