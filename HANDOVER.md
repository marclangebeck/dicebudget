# Übergabe – dice.budget (Kniffel Strategy Edition)

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**GitHub:** `marclangebeck/dicebudget` · Branch **`milestone-22-prep`**  
**Sprache:** Deutsch  
**Stand:** 2026-05-29 · Commit `2e68f53`

---

## Ist-Stand (kurz)

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Legal (dice.budget) | Impressum + Datenschutz — **live** |
| Legal (Plattform) | bottle-trade.de — **live** (separates Projekt) |
| **M29 Punktwahl-Eintrag** | **Erledigt** — Feld antippen → Overlay (Punkte + Würfe) → Eintragen |
| Frontend Deploy (Server) | Nach Pull: `cd frontend && npm run build` (Nginx aus `out/`) |
| iOS im Repo | Build-Nummer **15** · Version **1.0** |
| TestFlight | Build **11** zuletzt hochgeladen · **15** im Repo, Upload durch Nutzer auf Mac |
| Sync Mac/Server/GitHub | Commit **`2e68f53`** auf `origin/milestone-22-prep` |

**Nächste Priorität (typisch):** TestFlight **1.0 (15)** hochladen & testen → App Store Connect (Paid Agreement, 1,19 €, Screenshots, Review).

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
Branch:   milestone-22-prep · Commit: 2e68f53
Server:   /home/bottleadmin/projects/kniffel
Mac:      /Users/marclangebeck/projects/kniffel
Xcode:    /Users/marclangebeck/projects/kniffel/frontend/ios/App/App.xcworkspace
Bundle:   de.bottletrade.dicebudget
Kontakt:  info@bottle-trade.de (Marc Langebeck, Kiel — frontend/lib/legal.ts)

─── M29 EINTRAG (aktueller Stand) ───
• Feld auf Zettel antippen → Overlay (ScoreEntryPanel) von OBEN am Bildschirm
• Obere Sektion (Einser–Sechser): Zahlen-Buttons 0, 2, 4, … (keine Würfel-Icons)
• Unten: Dreier/Vierer Pasch + Chance 0–30 · Full House/Straßen/Yatzy 0 oder Festwert
• Gewählte Punkte + Würfe: hellgelbe Markierung (#fef3c7)
• Strategy: Würfe wählen (Default 2) · Klassisch: rollsUsed=1 intern
• Korrektur: befülltes Feld antippen → gleiches Overlay + „Eintrag löschen“
• ENTFERNT: Würfel-Zähler, Wurf vergleichen, CommittedThrowBanner, DiceThrowOverlay
• Kern-Dateien: PlayBoard.tsx, ScoreEntryPanel.tsx, FieldScoreChoiceGrid.tsx, lib/labels.ts (fieldScoreChoices)

─── ERLEDIGT (nicht neu erfinden) ───
• M1–22, M23–27 (UI iOS abgenommen)
• M29 Punktwahl-Eintrag (Commits 087d5d9 … 2e68f53)
• Legal dice.budget + bottle-trade.de (live)
• Legal-Daten: frontend/lib/legal.ts + branding.ts
• rsync-Fix: brew unlink rsync vor Xcode-Upload
• Spiel beenden: ✕ in PlayTopBar (ABANDON_RUN_CONFIRM)

─── OFFEN (typische nächste Themen) ───
1. TestFlight Upload Build 1.0 (15) — Nutzer auf Mac (Signing Team in Xcode!)
2. App Store Connect: Paid Agreement, Bank/Steuer, Preis 1,19 €
3. Store: Screenshots 6.7", Beschreibung DE, Datenschutzfragebogen
4. Web auf Server deployen nach UI-Änderungen (npm run build)
5. Optional: milestone-22-prep → main (nur nach Nutzer-Freigabe)

─── SYNC LOKAL + SERVER ───
Server:
  cd /home/bottleadmin/projects/kniffel && git pull origin milestone-22-prep
Mac:
  cd /Users/marclangebeck/projects/kniffel
  git restore frontend/ios/App/App.xcodeproj/project.pbxproj   # falls Pull blockiert
  git fetch origin milestone-22-prep && git reset --hard origin/milestone-22-prep
  cd frontend && npm install && npm run build:ios

─── iOS-BUILD / TESTFLIGHT (Mac) ───
brew unlink rsync 2>/dev/null; true
cd /Users/marclangebeck/projects/kniffel/frontend && npm run build:ios
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
# Signing: Team wählen (DEVELOPMENT_TEAM nicht im Git!)
# Version 1.0 · Build 15 → Clean → Archive → Upload

─── WEB-DEPLOY (Server) ───
cd /home/bottleadmin/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm run build
# Nginx: frontend/out/ — sudo deploy-frontend-prod.sh nur bei Nginx-Config-Änderung

─── WICHTIGE DATEIEN (Spiel/Eintrag) ───
frontend/components/PlayBoard.tsx
frontend/components/ScoreEntryPanel.tsx
frontend/components/FieldScoreChoiceGrid.tsx
frontend/components/ScoreSheetTable.tsx
frontend/lib/labels.ts              ← fieldScoreChoices, upperFieldDieCount
frontend/lib/legal.ts
frontend/app/globals.css              ← .field-entry-*, .play-score-btn--selected

─── STOLPERSTEINE ───
• Web-Deploy ≠ iOS — UI in App erst nach npm run build:ios + Archive
• ios/App/App/public/ ist gitignored — build:ios auf Mac Pflicht
• git pull blockiert durch pbxproj → git restore …/project.pbxproj
• Signing-Fehler nach Pull → Xcode: Signing & Capabilities → Team wählen
• Copy failed → brew unlink rsync, Xcode mit System-PATH
• Capacitor scrollEnabled:false → Legal nur in LegalScrollShell
• com.mlangebeck.mobileapp in Connect IGNORIEREN

Nutzer: Marc Langebeck, Xcode-Einsteiger — kleine Schritte, kopierbare Befehle.

─── DEINE AUFTRÄGE (vom Nutzer — hier eintragen) ───

```

---

## M29 — Eintrag (Referenz)

| Feldtyp | Auswahl im Overlay |
|---------|-------------------|
| Einser … Sechser | 0, face×1 … face×5 (nur Zahlen) |
| Dreier/Vierer Pasch, Chance | 0–30 |
| Full House, Straßen, Yatzy | 0 oder Festwert |

Logik: `fieldScoreChoices()` in `frontend/lib/labels.ts` (parallel Backend `fieldScores.ts`).

---

## Prompt für neuen Agent (Referenz)

### Was das Projekt ist

- **Yatzy/Kniffel** mit wählbarer **Spielanzahl 1–6** (13 Felder pro Block).
- **Zwei Modi:** Strategy (`useStrategyRules: true`, Pool) vs. Klassisch.
- **Singleplayer:** lokal (`frontend/lib/localSoloRun.ts`).
- **Multiplayer:** pseudonym via `playerId` (UUID lokal).
- **Serien / Statistik:** wie in milestones.md.

### Tech-Stack

| Teil | Stack |
|------|--------|
| Backend | Express, TypeScript, Prisma, SQLite, Port **3020** |
| Frontend | Next.js 15, Tailwind v4, static export (`out/`), Dev **3021** |
| iOS | Capacitor 7, Bundle `de.bottletrade.dicebudget` |
| Prod Web | https://dicebudget.bottle-trade.de |

### Wichtige Dateien

```
frontend/components/PlayBoard.tsx
frontend/components/ScoreEntryPanel.tsx
frontend/components/FieldScoreChoiceGrid.tsx
frontend/components/ScoreSheetTable.tsx
frontend/components/PlayTopBar.tsx
frontend/lib/labels.ts
frontend/lib/localSoloRun.ts
frontend/lib/legal.ts
frontend/app/globals.css
frontend/ios/App/App.xcworkspace
```

### Bereits erledigt

- Milestones **1–22**, **23–27**, **M29** (Punktwahl-Eintrag)
- TestFlight **Build 11** (älter); Repo-Stand **Build 15**
- Legal-Seiten live
- Backend-Tests: `cd backend && npm test`

### Deploy

```bash
# Web (Server):
cd /home/bottleadmin/projects/kniffel/frontend && npm run build

# iOS (Mac):
cd /Users/marclangebeck/projects/kniffel/frontend && npm run build:ios
```

**Keine Commits**, es sei denn, der Nutzer verlangt es explizit.

### Gesprächskontext

- Nutzer batcht **iOS-Releases**, testet Simulator + TestFlight.
- Antworten auf **Deutsch**, präzise, kopierbare Befehle.
- Nutzer: Marc Langebeck, Xcode-Einsteiger.

---

## Schnellcheck

```bash
cd /home/bottleadmin/projects/kniffel/backend && npm test
cd /home/bottleadmin/projects/kniffel/frontend && npm run build
curl -s https://dicebudget.bottle-trade.de/api/health
git log -1 --oneline   # erwartet: 2e68f53
grep CURRENT_PROJECT_VERSION frontend/ios/App/App.xcodeproj/project.pbxproj | head -1   # erwartet: 15
```

---

*Doku-Index: GOiOS.md · milestones.md · CHANGELOG.md · docs/testflight-app-store.md*
