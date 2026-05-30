# GOiOS — dice.budget im Apple App Store

Leitfaden für **iOS (Capacitor)**, **TestFlight** und **App Store** — ergänzt [milestones.md](./milestones.md) (Milestone 21) und die Web-App unter [README.md](./README.md).

**Stand:** Mai 2026  
**Nutzer:** Marc Langebeck · Apple Developer Program aktiv

---

## 0. Aktueller Stand (2026-05-30, verbindlich)

- **Branch:** `milestone-22-prep` · Commit **`dade49d`**
- **M29 Punktwahl-Eintrag:** erledigt — Overlay oben, Zahlen statt Würfel-Icons, Auswahl-Highlight
- **M30 Bonus-Delta-Anzeige:** erledigt — „Ergebnis 1“ zeigt Delta zur Soll-Marke „3 je Augenzahl“ (+ grün / − rot / ±0 grau)
- **M31 Bonus-Einblendung:** erledigt — Overlay bei 6/6 & ≥63, Auto-Close 2,5 s, Geräte-Toggle
- **M32 Topbar & Gegner-Pool:** erledigt — „Rest" entfernt; Multiplayer-Host-Toggle „Gegner-Pool sichtbar" (nur 2 Spieler); Backend-Flag `show_opponent_pool` deployed
- **M33 Pool-Endspiel:** erledigt — Multiplayer-Host-Toggle „Pool-Endspiel"; Sieger mit eindeutig größtem Pool verbessert am Ende 1 Feld; Backend-Flags `pool_endgame_*` deployed. Würfe-Standard Strategy 2→3
- **iOS im Repo:** Version **1.0** (Build-Nummer wird in Xcode gesetzt)
- **TestFlight:** **Build 18** — enthält M29–M33 + Würfe-Standard 3 (Upload durch Nutzer); nächster Upload wäre **19**
- **`Copy failed` / rsync:** `brew unlink rsync`, Xcode mit System-PATH (Abschnitt 6)
- **Signing:** `DEVELOPMENT_TEAM` **nicht** im Git — nach `git pull`/`reset` Team in Xcode setzen
- **Web:** https://dicebudget.bottle-trade.de — nach UI-Änderungen `npm run build` auf Server; Backend-Änderungen via `sudo bash infra/scripts/deploy-backend-prod.sh`
- **Nächster Schritt:** App Store Connect (Paid Agreement, Preis, Store-Metadaten, Datenschutzfragebogen) → TestFlight Build 18 weiter testen

---

## 1. Zielbild

| Ebene | URL / Ort | Status |
|-------|-----------|--------|
| **Web (Produktion)** | https://dicebudget.bottle-trade.de | Live |
| **API** | https://dicebudget.bottle-trade.de/api | Live |
| **Datenschutz** | https://dicebudget.bottle-trade.de/datenschutz | Live |
| **GitHub** | https://github.com/marclangebeck/dicebudget | Code gepusht |
| **iOS (Capacitor)** | `frontend/ios/` | Im Repo, Simulator OK (Mac) |
| **App Store Connect** | App **dice.budget**, Bundle `de.bottletrade.dicebudget` | In Einrichtung |
| **Store-Preis (Ziel)** | **1,19 €** (kostenpflichtige App) | Ausstehend (Paid-Vertrag + Preisstufe) |

**Wichtig:** Web und iOS teilen **dieselbe Codebasis** (`frontend/`). Web-Deploy ändert **nicht** automatisch die iOS-App — nach UI-Änderungen: `npm run build:ios` → erneut Archive auf dem Mac.

---

## 2. Architektur iOS vs. Web

```mermaid
flowchart LR
  subgraph web [Web Produktion]
    Nginx[dicebudget.bottle-trade.de]
    Out[frontend/out]
    Nginx --> Out
    API[/api/]
    Nginx --> API
  end
  subgraph ios [iOS App]
    Xcode[App.xcworkspace]
    WK[WKWebView Capacitor]
    Xcode --> WK
    WK --> API2[dicebudget.bottle-trade.de/api]
  end
  subgraph store [Apple]
    ASC[App Store Connect]
    TF[TestFlight]
    AS[App Store]
    ASC --> TF
    ASC --> AS
  end
  Xcode -->|Archive Upload| ASC
```

| | Browser | iOS-App |
|---|---------|---------|
| Start-URL | `/` Landing | direkt `/app` (`NativeAppEntry`) |
| API | `/api` (same-origin) | `https://dicebudget.bottle-trade.de/api` (`lib/apiBase.ts`) |
| Bundle / App-ID | — | `de.bottletrade.dicebudget` |

**Nicht verwenden:** alte App Store Connect-Eintrag **mobile-app** mit `com.mlangebeck.mobileapp` — gehört **nicht** zu diesem Xcode-Projekt.

---

## 3. Meilensteine (Überblick)

### Bereits erledigt (Web + Backend, M1–M20)

Diese Milestones sind **Voraussetzung** für eine sinnvolle iOS-App; Details in [milestones.md](./milestones.md).

| Block | Inhalt |
|-------|--------|
| M1–M6 | Backend, Frontend, Scoring, Pool, Abschluss |
| M7–M10 | Statistik (Basis), Multiplayer, Rangliste |
| M11–M14 | Modi, PWA, Validierung, `npm test` (Backend) |
| M15–M19 | Liga, Paarungsstatistik, Namen, Feld löschen, Zusatz-Yatzy |
| M20 | UI: Bento, Statistik, Setup, Spielzettel ohne Seiten-Scroll |

### Milestone 21 — iOS (dieser Leitfaden)

| # | Thema | Status | Wo / Hinweis |
|---|--------|--------|----------------|
| 21.1 | Capacitor 7, `frontend/ios/` | **erledigt** | `capacitor.config.ts` |
| 21.2 | Bundle ID `de.bottletrade.dicebudget` in Xcode | **erledigt** | `project.pbxproj` |
| 21.3 | App-ID im Developer Portal | **erledigt** | Description z. B. `DiceBudget` (ohne Punkt) |
| 21.4 | Native API-URL, Start `/app` | **erledigt** | `apiBase.ts`, `NativeAppEntry.tsx` |
| 21.5 | Doku Xcode / TestFlight | **erledigt** | `docs/ios-xcode-anleitung.md`, `docs/testflight-app-store.md` |
| 21.6 | GitHub-Repo `marclangebeck/dicebudget` | **erledigt** | Clone auf Mac für Xcode |
| 21.7 | Mac: Node, CocoaPods, Xcode, Simulator | **erledigt** | Nutzer bestätigt: App läuft im Simulator |
| 21.8 | App Store Connect: **neue** App dice.budget | **in Arbeit** | Vollzugriff; Bundle `de.bottletrade.dicebudget` |
| 21.9 | Geschäftliches: Lizenz, EU-Händler, **Paid-Vertrag**, Bank/Steuer | **offen** | Für **1,19 €** nötig |
| 21.10 | Preisstufe **1,19 €** in Connect | **offen** | Tab App Store → Preis und Verfügbarkeit |
| 21.11 | App-Icon 1024, Screenshots, Beschreibung DE | **offen** | Store-Metadaten |
| 21.12 | Xcode: Archive → Upload | **erledigt** | Build `1.0 (18)` in TestFlight (aktuell, M29–M33 + Würfe-Standard 3) |
| 21.13 | TestFlight (intern + iPhone) | **in Arbeit** | Build 18 hochgeladen; Store-Metadaten offen |
| 21.14 | App Store Review (kostenpflichtig) | **offen** | Nach stabiler Beta |

---

## 4. Prozess (End-to-End)

### Phase A — Voraussetzungen (einmalig)

| Schritt | Aktion | Status |
|---------|--------|--------|
| A1 | Apple Developer Program (99 €/Jahr) | erledigt |
| A2 | Mac mit **Xcode** (App Store), nicht nur Command Line Tools | erledigt |
| A3 | `xcode-select -s /Applications/Xcode.app/Contents/Developer` | erledigt |
| A4 | Node.js LTS, `pod install` in `frontend/ios/App` | erledigt |
| A5 | App-ID **App IDs** → `de.bottletrade.dicebudget` | erledigt |

### Phase B — Repository & Build (Mac)

```bash
git clone https://github.com/marclangebeck/dicebudget.git kniffel
cd kniffel/frontend
npm install
npm run build:ios          # next build + cap sync ios
open ios/App/App.xcworkspace   # immer .xcworkspace
```

Details: [docs/ios-xcode-anleitung.md](./docs/ios-xcode-anleitung.md)

### Phase C — App Store Connect

1. **Apps** → **+** → Neue App: **dice.budget**, Bundle **`de.bottletrade.dicebudget`**, **Vollzugriff**
2. **Geschäftliches:** Developer-Lizenz akzeptieren, EU-Händler (DSA), **Vertrag kostenpflichtige Apps** + Bank + Steuer
3. **App-Datenschutz:** URL `https://dicebudget.bottle-trade.de/datenschutz` + Fragebogen (kein Tracking)
4. **App Store** (Version 1.0): Preis **kostenpflichtig** (~1,19 €), Screenshots, Texte, Kategorie Spiele

Details: [docs/testflight-app-store.md](./docs/testflight-app-store.md)

### Phase D — Release

1. Xcode: **Any iOS Device** → **Product → Archive**
2. **Distribute App** → **App Store Connect** → **Upload**
3. **TestFlight** → interne Tester → iPhone-Test
4. **Zur Überprüfung einreichen** (öffentlicher Store)

### Phase E — Wartung nach Code-Änderungen

```bash
git pull
cd frontend && npm run build:ios
# Build-Nummer in Xcode erhöhen → Archive → Upload
```

Web separat: `sudo bash infra/scripts/deploy-frontend-prod.sh` (Server).

---

## 5. Referenzwerte (Copy-Paste)

| Feld | Wert |
|------|------|
| Anzeigename | dice.budget |
| Bundle ID | `de.bottletrade.dicebudget` |
| Capacitor `appId` | `de.bottletrade.dicebudget` |
| Version / Build (Start) | 1.0 / 1 |
| Datenschutz-URL | https://dicebudget.bottle-trade.de/datenschutz |
| Support-URL | https://dicebudget.bottle-trade.de |
| GitHub | https://github.com/marclangebeck/dicebudget |
| Xcode-Workspace | `frontend/ios/App/App.xcworkspace` |

---

## 6. Bekannte Stolpersteine

| Problem | Lösung |
|---------|--------|
| App Store Connect ohne Kachel **Apps** | **Geschäftliches** → Verträge + Lizenz |
| Nur „Vertrag kostenlose Apps“ | **Paid Applications** + Bank/Steuer |
| `xcodebuild` / Command Line Tools | Volles Xcode, `xcode-select` setzen |
| CocoaPods fehlt | `sudo gem install cocoapods`, `pod install` |
| Leeres Xcode-Fenster | `App.xcworkspace` öffnen, nicht `.xcodeproj` |
| Bundle-ID mismatch | Connect **de.bottletrade.dicebudget** = Xcode; nicht `com.mlangebeck.mobileapp` |
| App-ID Description mit Punkt | Nur alphanumerisch: z. B. `DiceBudget` |
| Gelbe Xcode-Warnungen (WKProcessPool, Pods) | Meist ignorierbar, Build trotzdem möglich |
| `Copy failed` / `rsync error` beim Distribute | `brew unlink rsync` (→ `/usr/bin/rsync`), Xcode beenden, dann: `env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open frontend/ios/App/App.xcworkspace` |
| Push vom Server | SSH-Key `github_dicebudget` oder HTTPS-Token |

---

## 7. Dokumentation im Repo

| Datei | Inhalt |
|-------|--------|
| [GOiOS.md](./GOiOS.md) | Dieser Leitfaden + Agent-Prompt |
| [docs/ios-xcode-anleitung.md](./docs/ios-xcode-anleitung.md) | Xcode Einsteiger |
| [docs/testflight-app-store.md](./docs/testflight-app-store.md) | Connect, Archive, TestFlight, Review |
| [docs/ios-app-store.md](./docs/ios-app-store.md) | Kurzreferenz Capacitor |
| [docs/github-setup.md](./docs/github-setup.md) | Git / Push |
| [HANDOVER.md](./HANDOVER.md) | Gesamtprojekt Web + Backend |
| [milestones.md](./milestones.md) | M1–M21 |

---

## 8. Noch nicht geplant (nach iOS-Release)

- In-App-Käufe (nur **App-Preis** 1,19 € geplant, kein IAP)
- Push-Benachrichtigungen
- Android / Play Store
- Next.js Security-Upgrade (CVE-Hinweis bei `next@15.5.4`)

---

# Prompt für neuen Agent (iOS & Store)

**Kopiere ab hier bis „Ende Prompt“ in einen neuen Cursor-Chat.**

---

Du setzt **dice.budget** (iOS + App Store) fort. Lies zuerst:

1. **[AGENT_RULES.md](./AGENT_RULES.md)**
2. **[HANDOVER.md](./HANDOVER.md)** (Gesamtstand)
3. **[GOiOS.md](./GOiOS.md)** (Abschnitte 1–7)
4. Bei Bedarf: [docs/testflight-app-store.md](./docs/testflight-app-store.md)

**Antworten auf Deutsch.** Keine Commits ohne explizite Nutzer-Anweisung.

### Ist-Stand (Mai 2026)

- Branch: **`milestone-22-prep`** · Commit **`dade49d`** · GitHub synchron
- Web live: https://dicebudget.bottle-trade.de
- iOS: Capacitor, Bundle **`de.bottletrade.dicebudget`**, TestFlight **Build 18** (M29–M33 + Würfe-Standard 3; Upload durch Nutzer; nächster Upload 19)
- M29: Punktwahl-Eintrag (`PlayBoard`, `ScoreEntryPanel`, `FieldScoreChoiceGrid`)
- M30: Bonus-Delta-Anzeige (`gameScoring.upperBonusDelta`, `ScoreSheetTable`)
- M31: Bonus-Einblendung (`BonusOverlay`, `uiPrefs`, `gameScoring.upperBonusAchieved`)
- M32: Topbar/Gegner-Pool (`PlayTopBar`, Backend `show_opponent_pool`)
- M33: Pool-Endspiel (`PoolEndgamePanel`, `PlayBoard`-Improver-Phase, Backend `pool_endgame_*`, `resolvePoolEndgame`)
- Legal: `frontend/lib/legal.ts`
- **iOS-Releases:** Nutzer batcht Uploads; nach Pull Signing-Team in Xcode prüfen

### Deine Priorität (Store + Coding nach Nutzer-Auftrag)

1. TestFlight **Build 18** weiter testen
2. **Paid Applications Agreement**, Bank/Steuer in App Store Connect
3. Preis **1,19 €**, Screenshots, Beschreibung DE, Datenschutzfragebogen
4. Coding-Aufgaben: siehe **DEINE AUFTRÄGE** im HANDOVER-Prompt
5. Optional: `main`-Branch mit `milestone-22-prep` mergen (nur nach Nutzer-Freigabe)

### Mac-Workflow (nach Code-Änderung)

```bash
cd /Users/marclangebeck/projects/kniffel
git restore frontend/ios/App/App.xcodeproj/project.pbxproj   # bei Pull-Konflikt
git pull origin milestone-22-prep
cd frontend && npm install && npm run build:ios
brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

Xcode: **Signing → Team** · Build **19** (nächster Upload) · Clean → Archive → Upload.

### Server-Workflow (Web)

```bash
cd /home/bottleadmin/projects/kniffel && git pull origin milestone-22-prep
cd frontend && npm run build
```

Optional Nginx-Reload: `sudo bash infra/scripts/deploy-frontend-prod.sh`

### Wichtige Pfade

```
frontend/components/PlayBoard.tsx
frontend/components/ScoreEntryPanel.tsx
frontend/components/FieldScoreChoiceGrid.tsx
frontend/lib/labels.ts
frontend/lib/legal.ts
frontend/app/globals.css
frontend/ios/App/App.xcworkspace
```

### Regeln

- Web-Deploy und iOS-Release sind **getrennt**.
- Alter Connect-Eintrag `com.mlangebeck.mobileapp` **ignorieren**.
- Nutzer ist Xcode-Einsteiger — **kopierbare Terminal-Befehle**, kleine Schritte.

**Ende Prompt**
