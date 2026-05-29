# Übergabe – dice.budget (Kniffel Strategy Edition)

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**GitHub:** `marclangebeck/dicebudget` · Branch **`milestone-22-prep`**  
**Sprache:** Deutsch  
**Stand:** 2026-05-29 · Commit `aac288f`

---

## Ist-Stand (kurz)

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Legal (dice.budget) | Impressum + Datenschutz mit Anbieterangaben — **live** |
| Legal (Plattform) | bottle-trade.de — **live** (separates Projekt auf Server) |
| Frontend Deploy | Erledigt (`npm run build` → Nginx aus `frontend/out/`) |
| M22 Datenschutz | Erledigt (Solo lokal, Multi pseudonym) |
| iOS UI (M23–27) | Abgenommen (TestFlight Build **1.0 (11)**) |
| TestFlight | Build 11 aktuell — **kein neuer Upload** bis Nutzer batched |
| Sync Mac/Server/GitHub | Commit **`aac288f`** überall |

**Nächste Priorität:** App Store Connect (Paid Agreement, 1,19 €, Screenshots, Beschreibung, Datenschutzfragebogen) → Review.

---

## Übergabe-Prompt (Copy & Paste)

Kopiere den gesamten Block in einen **neuen Chat**. Ergänze unten unter **„DEINE AUFTRÄGE“** die konkrete Aufgabe.

```
Du arbeitest am Projekt dice.budget weiter (Repo: kniffel).

LIES ZUERST (Reihenfolge):
1. AGENT_RULES.md
2. HANDOVER.md
3. GOiOS.md
4. milestones.md → Abschnitt „Aktueller Arbeitsstand“

Antworten auf Deutsch. Keine Commits ohne explizite Nutzer-Anweisung.

─── PROJEKT ───
Yatzy/Kniffel, 1–6 Spiele pro Partie, Strategy (Pool) vs. Klassisch.
Solo: lokal (frontend/lib/localSoloRun.ts). Multi: pseudonym playerId (UUID).
Web + iOS: Next.js static export + Capacitor 7.

─── PFADE ───
Prod:     https://dicebudget.bottle-trade.de
App:      /app (iOS-Start) · Legal: /datenschutz, /impressum
Branch:   milestone-22-prep · Commit: aac288f
Server:   /home/bottleadmin/projects/kniffel
Mac:      /Users/marclangebeck/projects/kniffel
Xcode:    /Users/marclangebeck/projects/kniffel/frontend/ios/App/App.xcworkspace
Bundle:   de.bottletrade.dicebudget
Kontakt:  info@bottle-trade.de (Marc Langebeck, Kiel — siehe frontend/lib/legal.ts)

─── ERLEDIGT (nicht neu erfinden) ───
• M1–22, M23–27 (UI iOS abgenommen)
• TestFlight 1.0 (11) — aktuell in App Store Connect
• Legal dice.budget + bottle-trade.de mit echten Anbieterangaben (live)
• Legal-Daten zentral: frontend/lib/legal.ts + branding.ts
• LegalScrollShell, app-nav-btn, dunkler Hintergrund, SVG-Icons
• rsync-Fix: brew unlink rsync vor Xcode-Upload

─── OFFEN (typische nächste Themen) ───
1. App Store Connect: Paid Agreement, Bank/Steuer
2. Store: Preis 1,19 €, Screenshots 6.7", Beschreibung DE
3. App-Datenschutzfragebogen in Connect (URL: …/datenschutz)
4. TestFlight Build 11 prüfen → „Zur Überprüfung einreichen“
5. Optional: milestone-22-prep → main (nur nach Nutzer-Freigabe)
6. bottle-trade-platform: kein Git — nur Server /home/bottleadmin/projects/bottle-trade-platform

─── iOS-BUILD (nur wenn Nutzer es verlangt) ───
Nutzer batcht iOS-Releases — nicht pro kleiner Änderung archivieren.
cd /Users/marclangebeck/projects/kniffel && git pull origin milestone-22-prep
cd /Users/marclangebeck/projects/kniffel/frontend && npm install && npm run build:ios
brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open /Users/marclangebeck/projects/kniffel/frontend/ios/App/App.xcworkspace
# Build-Nummer 11→12 → Archive → Upload

─── WEB-DEPLOY (Server) ───
cd /home/bottleadmin/projects/kniffel && git pull origin milestone-22-prep
cd /home/bottleadmin/projects/kniffel/frontend && npm run build
# Nginx liefert aus frontend/out/ — sudo deploy-Skript optional

─── WICHTIGE DATEIEN ───
frontend/lib/legal.ts          ← Anbieterangaben (Impressum + Datenschutz)
frontend/lib/branding.ts       ← CONTACT_EMAIL, URLs
frontend/app/impressum/page.tsx
frontend/app/datenschutz/page.tsx
frontend/app/app/page.tsx
frontend/components/HomeBentoGrid.tsx
frontend/lib/localSoloRun.ts
frontend/lib/playerIdentity.ts

─── STOLPERSTEINE ───
• Web-Deploy ≠ iOS — UI in App erst nach build:ios + neuem Archive
• Copy failed → brew unlink rsync, Xcode mit System-PATH
• Capacitor scrollEnabled:false → Legal nur in LegalScrollShell
• com.mlangebeck.mobileapp in Connect IGNORIEREN

Nutzer: Marc Langebeck, Xcode-Einsteiger — kleine Schritte, kopierbare Befehle.

─── DEINE AUFTRÄGE (vom Nutzer — hier eintragen) ───

```

**Beispiele für „DEINE AUFTRÄGE“** (eine Zeile reicht):

- `Hilf mir bei App Store Connect: Paid Agreement und Screenshots Schritt für Schritt.`
- `Implementiere Feature X in frontend/…`
- `Committe und deploye die letzten Änderungen auf Prod.`

---

## Prompt für neuen Agent (Referenz)

### Was das Projekt ist

- **Yatzy/Kniffel** mit wählbarer **Spielanzahl 1–6** (13 Felder pro Block).
- **Zwei Modi:** Strategy (`useStrategyRules: true`, Pool) vs. Klassisch.
- **Singleplayer:** lokal auf dem Gerät (`frontend/lib/localSoloRun.ts`).
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

### Legal / Anbieter (Commit aac288f)

| Feld | Wert |
|------|------|
| Anbieter | Marc Langebeck |
| Anschrift | Moltkestr. 41, 24105 Kiel |
| E-Mail | info@bottle-trade.de |
| Telefon | +49 (0) 176 - 6 31 29 242 |
| Hosting | netcup GmbH, Deutschland |
| DSB | Marc Langebeck |
| Code | `frontend/lib/legal.ts` |

**Plattform-Website** (gleiche Legal-Daten, separates Repo-Ordner ohne Git):

- Pfad Server: `/home/bottleadmin/projects/bottle-trade-platform`
- Live: https://bottle-trade.de/impressum · https://bottle-trade.de/datenschutz
- Deploy: `cd …/bottle-trade-platform && npm run build`

### Wichtige Dateien

```
frontend/lib/legal.ts                 # Anbieterangaben (neu)
frontend/lib/branding.ts
frontend/app/impressum/page.tsx
frontend/app/datenschutz/page.tsx
frontend/app/app/page.tsx
frontend/components/HomeBentoGrid.tsx
frontend/components/LegalScrollShell.tsx
frontend/components/AppScreenHeader.tsx
frontend/lib/localSoloRun.ts
frontend/lib/playerIdentity.ts
frontend/app/globals.css
frontend/ios/App/App.xcworkspace
```

### Bereits erledigt

- Milestones **1–22**, **23–27**
- TestFlight **Build 11**
- Legal-Seiten dice.budget + bottle-trade.de
- Backend-Tests: `cd backend && npm test` (37 grün)

### Deploy

```bash
# Web (ohne sudo, wenn nur out/ neu gebaut wird):
cd /home/bottleadmin/projects/kniffel/frontend && npm run build

# Mit Nginx-Reload (sudo):
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-frontend-prod.sh
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
```

**Keine Commits**, es sei denn, der Nutzer verlangt es explizit.

### iOS-Release (Mac) — nur auf Nutzerwunsch

```bash
cd /Users/marclangebeck/projects/kniffel && git pull origin milestone-22-prep
cd /Users/marclangebeck/projects/kniffel/frontend && npm install && npm run build:ios
brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open /Users/marclangebeck/projects/kniffel/frontend/ios/App/App.xcworkspace
```

### Gesprächskontext

- Nutzer batcht **iOS-Releases** — nicht nach jeder kleinen Änderung uploaden.
- Antworten auf **Deutsch**, präzise, kopierbare Befehle.
- Nutzer: Marc Langebeck, Xcode-Einsteiger.

---

## Schnellcheck

```bash
cd /home/bottleadmin/projects/kniffel/backend && npm install && npx prisma migrate deploy && npm test
cd /home/bottleadmin/projects/kniffel/frontend && npm install && npm run build
curl -s https://dicebudget.bottle-trade.de/api/health
curl -s https://dicebudget.bottle-trade.de/impressum | grep -o "Marc Langebeck" | head -1
```

---

*Doku-Index: GOiOS.md · milestones.md · CHANGELOG.md · docs/testflight-app-store.md*
