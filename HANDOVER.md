# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `66e8487` (Stand 2026-06-10)  
**Doku-HEAD:** `06405a4`  
**Sprache:** Deutsch

Diese Datei ist die kompakte Startübergabe. Aktiver Arbeitsstand: `docs/milestones_active.md`. iOS/TestFlight/App Store: `docs/ios_current.md`. Dauerhafte Projektentscheidungen nur bei Bedarf: `docs/decisions.md`.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9 ist Pflicht: Nach jeder Code-Änderung GitHub, Server und Mac synchronisieren und nummerierte `[Server]`-/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung — **außer** wenn der Nutzer explizit Commit/Push anweist.
- Kein `sudo` durch den Agent; sudo-Schritte sind immer Nutzer-Aufgabe **auf dem Server** (per SSH), nicht auf dem Mac.
- Keine Watcher, kein Polling, keine Dauerprozesse, kein Auto-Deploy.
- Agent arbeitet nur auf dem Server unter `/home/bottleadmin/projects/kniffel`.
- Mac-Pfad des Nutzers: `/Users/marclangebeck/projects/kniffel`.
- Reine Frontend-Änderungen: auf dem Server genügt `cd frontend && npm run build`; Nginx liefert `frontend/out/` direkt aus.
- Backend-Neustart: Nutzer per SSH auf dem Server mit `sudo bash …/deploy-backend-prod.sh` — **nicht** mit Mac-Pfad `/home/bottleadmin/…`.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` |
| Produktcode-HEAD | `66e8487` — Frontend `out/` nach Build auf dem Server |
| Backend | Coaching-API, `scoreProgression`, Migration `extra_yatzy_die_values` — Deploy-Status durch Nutzer prüfen |
| Branding | Nutzer-sichtbar **DiceBudget** und **Alle Fünfe**; technische IDs unverändert |
| Startscreen | Zwei Arena-Kacheln **Multi** / **Solo**, **ohne** Mittel-Logo; zentrierte Texte/Badges; dominante 3D-Würfel-Icons; Hero mit Bilanz |
| Footer | `Home · Statistik · Einstellungen · Menü` — Hamburger dezent, Menü-Panel Glas-Morph; Screenshot, Support, Legal, bottle-trade.de |
| Teilen | **Nur** Spielende (`RunFinishScreen`) + Startscreen-Bilanz; System-Share (PNG) |
| Multi-Raum | **Code teilen** liefert **nur den Code** (kein Einladungstext/Link) |
| Abschluss/Analyse | Card-Dashboards in `RunFinishScreen` und `MatchAnalysisView` |
| Erfolgs-Animationen | Vollbild-Overlays (Bonus, Große Straße, Alle Fünfe, untere Spalte voll) |
| Spiel-Feedback | Granular unter `/settings/feedback`: Animationen, Sounds, Fortschritt 25/50/75 % |
| Fortschritt | Overlay + Sound bei 25/50/75 %; **Warteschlange** hinter Erfolgs-Overlays |
| Nginx | HTML `no-cache`, `_next/static/` `immutable` — reload durch Nutzer nach Config-Deploy |
| iOS/TestFlight | Version `2.0`; **aktueller Build `2.0 (27)`** mit Produktcode `66e8487` (Arena, Footer Glas-Morph); historisch: `2.0 (26)` wirkungslos (ohne `git pull`/`build:ios`) |

## Wichtig: iOS-Bundle ≠ Web-Deploy

- Die iOS-App lädt UI aus `frontend/ios/App/App/public/` (lokal im App-Bundle).
- Dieser Ordner ist **gitignored** und wird nur durch **`npm run build:ios`** auf dem Mac befüllt (`next build` → `out/` → `cap sync ios`).
- **`git pull` allein** oder **nur Xcode Archive** reichen **nicht** — ohne `npm run build:ios` bleibt alter Web-Stand in TestFlight.
- Vor Archive prüfen: `git log -1` muss `66e8487` sein; `grep -c home-arena-pane` in `ios/App/App/public/_next/static/css/*.css` muss > 0 sein.

## Letzte Produktänderungen (Commits bis `66e8487`)

| Feature | Commit | Backend nötig |
|---------|--------|---------------|
| Footer-Menü Glas-Morph, dezenter Hamburger | `66e8487` | Nein |
| Startscreen Arena ohne Mittel-Logo, zentriert, große 3D-Icons | `3f690d5` | Nein |
| Footer-Menü + Screenshot teilen | `b17b9f5` | Nein |
| Multi: Code teilen nur Code | `f29cf7d` | Nein |
| Erfolgs-Animationen Vollbild | `f29cf7d` | Nein |
| DiceBudget-Branding, Intro-Logo | `be566e5` | Nein |
| Abschluss/Analyse Card-Dashboards | `be566e5` | Nein |
| nginx Cache-Header | Arena-Batch | Nein (reload sudo) |

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nicht-Sieger müssen ggf. **Aktualisieren** tippen, bevor Abschluss-Screen mit Toggle erscheint.
- **Punkte-Duell live:** Graphik in Multi-Analyse erst nach **Backend-Deploy** (`scoreProgression` in API), falls noch nicht deployed.
- **Safari-/WebView-Cache:** Hard-Reload bzw. App-Neustart nach TestFlight-Update.
- **Mac `git pull`:** Lokale Änderung an `frontend/package-lock.json` blockiert Pull — `git restore frontend/package-lock.json` vor Pull.

## Wichtige Dateien

- Startscreen: `HomeBentoGrid.tsx`, `globals.css` (`.home-play-arena`, `.home-arena-pane*`)
- Footer/Menü: `AppLegalFooter.tsx`, `AppFooterMenu.tsx`, `screenCapture.ts`, `shareSocial.ts`
- Intro: `AppIntroSplash.tsx`, `app/app/page.tsx` (`INTRO_SHOWN_KEY` v2)
- Multi-Teilen: `multi/page.tsx`, `shareSocial.ts`
- Abschluss/Analyse: `RunFinishScreen.tsx`, `MatchAnalysisView.tsx`
- Fortschritt: `runProgressFeedback.ts`, `feedbackOverlayQueue.ts`, `RunProgressOverlay.tsx`
- Erfolgs-Overlays: `AchievementOverlay.tsx`, `achievementTypes.ts`, `DiceFace.tsx`
- Nginx: `infra/nginx/dicebudget.bottle-trade.de.conf`
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. TestFlight-Regression: Startscreen-Arena, Footer/Menü/Glas, `/play`, Pool-Endspiel, Fortschritt, Code teilen.
2. **Backend deployen** (falls noch offen): Coaching + `scoreProgression` + Migration `extra_yatzy_die_values`.
3. **nginx reload** (Nutzer sudo), falls Cache-Header noch nicht aktiv.
4. App Store Connect: Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten.
5. Optional: Pool-Endspiel Auto-Refresh.

## Mac: iOS-Referenz-Workflow (künftiger Build)

```bash
cd /Users/marclangebeck/projects/kniffel
git restore frontend/package-lock.json
git pull origin milestone-22-prep
git log -1 --oneline
```

Erwartung: `66e8487 Footer-Menü: dezenterer Trigger und stärkerer Glas-Look`

Bei Konflikt in der Xcode-Projektdatei:

```bash
git restore frontend/ios/App/App.xcodeproj/project.pbxproj
git pull origin milestone-22-prep
```

Build, Sync, Xcode öffnen (eine Zeile):

```bash
cd /Users/marclangebeck/projects/kniffel/frontend && npm ci && npm run build:ios && brew unlink rsync && env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

Bundle prüfen:

```bash
grep -c home-arena-pane /Users/marclangebeck/projects/kniffel/frontend/ios/App/App/public/_next/static/css/*.css
```

In Xcode: **⇧⌘K** (Clean), Build-Nummer **28** (oder höher — `27` ist bereits in TestFlight), **Any iOS Device** → **Product → Archive** → Upload.

## Pflicht-Lesereihenfolge

1. `AGENT_RULES.md`
2. `HANDOVER.md`
3. `docs/milestones_active.md`

Nur bei Bedarf: `docs/ios_current.md`, `docs/decisions.md`, `docs/milestones_archive.md`, `docs/ios_archive.md`

## Übergabeprompt Für Neuen Agent

```text
Du arbeitest am Projekt dice.budget weiter (Repo: kniffel / DiceBudget Strategy Edition).

Antworten auf Deutsch. Keine Commits ohne explizite Nutzer-Anweisung.

LIES ZUERST in dieser Reihenfolge:
1. AGENT_RULES.md
2. HANDOVER.md
3. docs/milestones_active.md

LIES NUR BEI BEDARF:
4. docs/ios_current.md
5. docs/decisions.md
6. docs/milestones_archive.md
7. docs/ios_archive.md

Wichtige Regeln:
- AGENT_RULES.md hat Vorrang.
- AGENT_RULES.md Sektion 9: Nach Code-Änderungen nummerierte [Server]/[Mac]-Befehle ausgeben.
- Kein sudo durch den Agent; Backend-Deploy/nginx reload per SSH auf dem Server (Nutzer-Aufgabe).
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet auf dem Server unter /home/bottleadmin/projects/kniffel.
- Mac-Clone: /Users/marclangebeck/projects/kniffel (git pull, npm run build:ios, Xcode).
- Reine Frontend-Änderungen: cd frontend && npm run build auf dem Server.

Aktueller Kurzstand:
- Branch: milestone-22-prep
- Produktcode-HEAD: 66e8487 (Stand 2026-06-10)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0; aktueller TestFlight-Build 2.0 (27) mit Produktcode 66e8487; 2.0 (26) historisch wirkungslos (ohne git pull/build:ios)
- iOS-Bundle: frontend/ios/App/App/public/ ist gitignored — UI nur via npm run build:ios auf dem Mac im TestFlight-Bundle
- Branding: DiceBudget; UI „Alle Fünfe“ statt Yatzy; technische IDs unverändert
- Startscreen: Zwei Arena-Kacheln Multi/Solo, kein Mittel-Logo, zentrierte Texte/Badges, dominante 3D-Würfel-Icons; Hero mit Bilanz; Statistik/Einstellungen nur im Footer
- Footer: Home · Statistik · Einstellungen · Menü — Hamburger dezent, Menü-Panel Glas-Morph, Screenshot teilen, Support, Legal, bottle-trade.de
- Multi: Code teilen nur Code (kein Einladungstext/Link)
- Erfolgs-Animationen: Vollbild (Bonus, Große Straße, Alle Fünfe, untere Spalte voll)
- Abschluss/Analyse: Card-Dashboards (RunFinishScreen, MatchAnalysisView)
- Fortschritt: Overlay + Sound 25/50/75 %; Warteschlange nach Erfolgs-Overlays
- Spiel-Feedback: granular unter /settings/feedback
- Teilen: nur Spielende + Startscreen-Bilanz (System-Share PNG)
- Intro-Splash: DiceBudget-Logo; Key dicebudget.introShown.v2
- Nginx: HTML no-cache, _next/static immutable (reload durch Nutzer nach Config-Deploy)
- Backend-Neustart (bei Backend-Änderung): Nutzer per SSH:
  sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
- nginx reload (nach infra/nginx-Änderung): Nutzer per SSH:
  sudo nginx -t && sudo systemctl reload nginx

Mac iOS-Referenz (nur bei neuem UI-Stand nötig):
cd /Users/marclangebeck/projects/kniffel
git restore frontend/package-lock.json
git pull origin milestone-22-prep
cd frontend && npm ci && npm run build:ios && brew unlink rsync
grep -c home-arena-pane ios/App/App/public/_next/static/css/*.css
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
(Xcode: Clean Build Folder, Build-Nummer erhöhen, Archive, Upload)

Offene Prioritäten:
1. TestFlight-Regression (Startscreen-Arena, Footer/Menü, /play, Pool-Endspiel, Fortschritt, Code teilen)
2. Backend deployen (falls offen: Coaching + scoreProgression + Migration extra_yatzy_die_values)
3. nginx reload falls Cache-Header noch nicht aktiv
4. App Store Connect (Agreement, Bank/Steuer, Preis 1,19 EUR)
5. Optional: Pool-Endspiel Auto-Refresh

Auftrag:
<hier konkrete Aufgabe einfügen>
```
