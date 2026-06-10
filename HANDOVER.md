# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** Branch `milestone-22-prep`, Stand 2026-06-10 (nach Commit: `git rev-parse --short HEAD`)  
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
| Produktcode | Stand 2026-06-10 auf `milestone-22-prep`; Frontend `out/` nach Build |
| Backend | Coaching-API, `scoreProgression`, Migration `extra_yatzy_die_values` — Deploy-Status durch Nutzer prüfen |
| Branding | Nutzer-sichtbar **DiceBudget** und **Alle Fünfe**; technische IDs unverändert |
| Startscreen | Zwei Vollbild-Arena-Kacheln (Multi vs. Solo), Hero mit Bilanz; Statistik/Einstellungen nur im Footer |
| Footer | `Home · Statistik · Einstellungen · Menü` — Menü: Screenshot, Support, Legal, bottle-trade.de |
| Teilen | **Nur** Spielende (`RunFinishScreen`) + Startscreen-Bilanz; ein **Teilen**-Button → System-Share (PNG) |
| Multi-Raum | **Code teilen** liefert **nur den Code** (kein Einladungstext/Link) |
| Abschluss/Analyse | Card-Dashboards in `RunFinishScreen` und `MatchAnalysisView` |
| Erfolgs-Animationen | Vollbild-Overlays (Bonus, Große Straße, Alle Fünfe, untere Spalte voll) |
| Spiel-Feedback | Granular unter `/settings/feedback`: Animationen, Sounds, Fortschritt 25/50/75 % |
| Fortschritt | Overlay + Sound bei 25/50/75 %; **Warteschlange** hinter Erfolgs-Overlays |
| Nginx | HTML `no-cache`, `_next/static/` `immutable` — reload durch Nutzer nach Config-Deploy |
| iOS/TestFlight | Version `2.0`, aktueller Build **`2.0 (25)`**, nächster Upload **`2.0 (26)`** |

## Letzte Produktänderungen (Commit-Batch 2026-06-10)

| Feature | Status | Backend nötig |
|---------|--------|---------------|
| Multi: Code teilen nur Code | `f29cf7d` | Nein |
| Erfolgs-Animationen Vollbild | `f29cf7d` | Nein |
| DiceBudget-Branding, Intro-Logo | `be566e5` | Nein |
| Abschluss/Analyse Card-Dashboards | `be566e5` | Nein |
| Footer-Menü + Screenshot teilen | `b17b9f5` | Nein |
| Startscreen Arena (Multi vs. Solo) | dieser Commit | Nein |
| nginx Cache-Header | dieser Commit | Nein (reload sudo) |
| Intro-Key v2 | dieser Commit | Nein |
| Doku-Sync (HANDOVER, milestones, CHANGELOG) | dieser Commit | Nein |

## Bekanntes UX-Thema (offen)

- **Pool-Endspiel + Statistik-Toggle:** Nicht-Sieger müssen ggf. **Aktualisieren** tippen, bevor Abschluss-Screen mit Toggle erscheint.
- **Punkte-Duell live:** Graphik in Multi-Analyse erst nach **Backend-Deploy** (`scoreProgression` in API), falls noch nicht deployed.
- **Safari-Cache:** Nach Frontend-Deploy ggf. privates Fenster oder Hard-Reload; nginx reload für neue Cache-Header.

## Wichtige Dateien

- Startscreen: `HomeBentoGrid.tsx`, `globals.css` (`.home-play-arena*`, `.home-bento-tile--arena`)
- Footer/Menü: `AppLegalFooter.tsx`, `AppFooterMenu.tsx`, `screenCapture.ts`, `shareSocial.ts`
- Intro: `AppIntroSplash.tsx`, `app/app/page.tsx` (`INTRO_SHOWN_KEY` v2)
- Multi-Teilen: `multi/page.tsx`, `shareSocial.ts`
- Abschluss/Analyse: `RunFinishScreen.tsx`, `MatchAnalysisView.tsx`
- Fortschritt: `runProgressFeedback.ts`, `feedbackOverlayQueue.ts`, `RunProgressOverlay.tsx`
- Erfolgs-Overlays: `AchievementOverlay.tsx`, `achievementTypes.ts`, `DiceFace.tsx`
- Nginx: `infra/nginx/dicebudget.bottle-trade.de.conf`
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. **Commit + Push** dieses Batches und `npm run build` auf dem Server.
2. **nginx reload** (Nutzer sudo): nach Config-Deploy Cache-Header aktivieren.
3. **Backend deployen** (falls noch offen): Coaching + `scoreProgression` + Migration `extra_yatzy_die_values`.
4. **iOS-Build `2.0 (26)`** auf dem Mac nach `git pull`.
5. TestFlight-Regression: Startscreen-Arena, Footer/Menü, `/play`, Pool-Endspiel, Fortschritt, Code teilen.
6. Optional: Pool-Endspiel Auto-Refresh.
7. App Store Connect: Agreement, Bank/Steuer, Preis `1,19 EUR`, Metadaten.

## Mac: iOS-Build 2.0 (26)

```bash
cd /Users/marclangebeck/projects/kniffel
git pull origin milestone-22-prep
```

Bei Konflikt in der Xcode-Projektdatei:

```bash
git restore frontend/ios/App/App.xcodeproj/project.pbxproj
git pull origin milestone-22-prep
```

Build und Xcode:

```bash
cd /Users/marclangebeck/projects/kniffel/frontend
npm run build:ios
brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

In Xcode: Team prüfen, Build-Nummer **26**, **Any iOS Device** → **Product → Archive** → Upload.

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
- Mac-Clone: /Users/marclangebeck/projects/kniffel (git pull, Xcode/iOS).
- Reine Frontend-Änderungen: cd frontend && npm run build auf dem Server.

Aktueller Kurzstand:
- Branch: milestone-22-prep
- Produktcode-HEAD: git log -1 --oneline nach git pull (Stand Juni 2026-06-10)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (25), nächster Upload 2.0 (26)
- Branding: DiceBudget; UI „Alle Fünfe“ statt Yatzy; technische IDs unverändert
- Startscreen: Zwei Vollbild-Arena-Kacheln Multi vs. Solo (VS-Badge, Aurora, Glow, Glas-Dock); Hero mit Bilanz; Statistik/Einstellungen nur im Footer
- Footer: Home · Statistik · Einstellungen · Menü — Menü mit Screenshot teilen, Support, Datenschutz, Impressum, bottle-trade.de
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

Mac iOS-Build 2.0 (26):
cd /Users/marclangebeck/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm run build:ios && brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
(Xcode: Build-Nummer 26, Archive, Upload)

Offene Prioritäten:
1. Backend deployen (falls offen: Coaching + scoreProgression + Migration extra_yatzy_die_values)
2. nginx reload falls Cache-Header noch nicht aktiv
3. iOS TestFlight 2.0 (26) bauen und hochladen
4. TestFlight-Regression (Startscreen-Arena, Footer/Menü, /play, Pool-Endspiel, Fortschritt, Code teilen)
5. Optional: Pool-Endspiel Auto-Refresh
6. App Store Connect (Agreement, Bank/Steuer, Preis 1,19 EUR)

Auftrag:
<hier konkrete Aufgabe einfügen>
```
