# dice.budget — Xcode Schritt für Schritt (Einsteiger)

Diese Anleitung setzt voraus: **Apple Developer Program** ist aktiv und du arbeitest auf einem **Mac**.

---

## Übersicht (5 Phasen)

| Phase | Ziel | Dauer (grob) |
|-------|------|----------------|
| **A** | Software installieren | 30–60 Min |
| **B** | Projekt bauen & im Simulator testen | 20–40 Min |
| **C** | Signing (Apple-Team verbinden) | 10 Min |
| **D** | TestFlight (Beta auf dem iPhone) | 30 Min + Wartezeit |
| **E** | App Store (öffentlich) | optional später |

---

## Phase A — Vorbereitung auf dem Mac

### A1. Xcode installieren

1. **App Store** auf dem Mac öffnen.
2. Nach **Xcode** suchen → **Installieren** (groß, ca. 12 GB).
3. Nach der Installation **Xcode einmal starten**.
4. Lizenzbedingungen akzeptieren.
5. Warten, bis **„Installing additional components“** fertig ist.

### A2. Xcode Command Line Tools

1. Terminal öffnen (`Cmd + Leertaste` → „Terminal“).
2. Eingeben und mit Enter bestätigen:

```bash
xcode-select --install
```

Falls die Meldung „already installed“ kommt: gut, weiter.

### A3. Node.js

Falls noch nicht da: https://nodejs.org/ → **LTS** installieren.

Prüfen:

```bash
node -v
npm -v
```

### A4. CocoaPods (für das iOS-Projekt)

```bash
sudo gem install cocoapods
```

Passwort vom Mac eingeben. Das kann einige Minuten dauern.

### A5. Projekt-Ordner auf den Mac

Den Ordner `kniffel` brauchst du lokal — z. B.:

- per **Git** klonen, oder  
- vom Server kopieren (rsync/scp).

Pfad im Beispiel: `~/projects/kniffel` — passe ihn an deinen Mac an.

---

## Phase B — Erster Start im Simulator

### B1. Terminal: Abhängigkeiten & iOS-Sync

```bash
cd ~/projects/kniffel/frontend
npm install
npm run build:ios
```

**Was passiert:** Next.js baut die Web-App nach `out/`, Capacitor kopiert sie nach `ios/`.

Bei Fehler mit **Pods**:

```bash
cd ios/App
pod install
cd ../..
npx cap sync ios
```

### B2. Xcode öffnen (wichtig: Workspace!)

```bash
npx cap open ios
```

Oder manuell: Datei  
`frontend/ios/App/App.xcworkspace`  
doppelklicken — **nicht** `App.xcodeproj`.

### B3. In Xcode orientieren

Links die **Seitenleiste** (Navigator). Oben die **Symbolleiste**:

- Links vom Play-Button: Ziel wählen (z. B. **iPhone 16** Simulator).
- **Play (▶)** = Build & Start im Simulator.

### B4. Erster Build

1. Oben **App** als Scheme (steht meist schon).
2. Gerät: z. B. **iPhone 16** (Simulator).
3. **▶ Play** klicken (oder `Cmd + R`).

**Erster Lauf dauert oft 2–5 Minuten.**

### B5. Was du sehen solltest

- Simulator startet.
- App **dice.budget** öffnet sich.
- Kurz „Lade …“, dann der **Bento-Startscreen** (`/app`).
- **Einzelspiel** antippen → sollte laden (Internet nötig, API unter dicebudget.bottle-trade.de).

**Checkpoint:** Spiel startet im Simulator ohne Absturz.

---

## Phase C — Signing (Pflicht für iPhone & Store)

Ohne Signing geht nur der Simulator.

### C1. Apple-ID in Xcode

1. Menü **Xcode → Settings…** (oder **Preferences**).
2. Tab **Accounts**.
3. **+** → **Apple ID** → deine Developer-Apple-ID anmelden.

### C2. Team im Projekt setzen

1. In der linken Leiste ganz oben **App** (blaues Icon) anklicken.
2. Mitte: Unter **TARGETS** → **App** wählen.
3. Tab **Signing & Capabilities**.
4. **Automatically manage signing** aktivieren.
5. **Team:** dein Team aus dem Developer Program wählen.
6. **Bundle Identifier:** muss exakt sein:

   `de.bottletrade.dicebudget`

Falls Xcode warnt „Failed to register bundle identifier“:

- In [developer.apple.com](https://developer.apple.com/account) → **Identifiers** prüfen, ob die ID frei ist, oder  
- Xcode die ID automatisch anlegen lassen (mit Häkchen bei Automatically manage signing).

**Checkpoint:** Kein roter Fehler unter Signing.

### C3. Optional: echtes iPhone

1. iPhone per Kabel verbinden, „Diesem Computer vertrauen“.
2. Oben in Xcode dein **iPhone** statt Simulator wählen.
3. **▶ Play** — beim ersten Mal auf dem iPhone:  
   **Einstellungen → Allgemein → VPN & Geräteverwaltung** → Entwickler-App vertrauen.

---

## Phase D — App-Icon (vor Upload empfohlen)

Xcode erwartet ein **1024×1024** Icon.

1. Quelle: `frontend/public/icon-512.png` (oder `logo-source.png` in 1024 exportieren).
2. In Xcode: **App → Assets.xcassets → AppIcon**.
3. Bild **1024×1024** in das große Feld ziehen (Universal).

Ohne Icon kann der Upload zu App Store Connect scheitern.

---

## Phase E — App Store Connect vorbereiten

Browser: https://appstoreconnect.apple.com

### E1. Neue App anlegen

1. **Apps** → **+** → **Neue App**.
2. **Plattformen:** iOS.
3. **Name:** `dice.budget` (oder Anzeigename, falls frei).
4. **Primäre Sprache:** Deutsch.
5. **Bundle-ID:** `de.bottletrade.dicebudget` (muss in Developer Portal existieren).
6. **SKU:** z. B. `dicebudget-001` (beliebig, nur intern).
7. **Benutzerzugriff:** Vollzugriff (oder nach Bedarf).

### E2. Pflichtangaben (können später ergänzt werden)

| Feld | Wert |
|------|------|
| Datenschutz-URL | https://dicebudget.bottle-trade.de/datenschutz |
| Kategorie | Spiele |
| Beschreibung | Kurztext zu dice.budget / Yatzy-Variante |
| Screenshots | Aus Simulator (s. unten) |

**Screenshots im Simulator:** `Cmd + S` speichert Bild auf den Desktop.

---

## Phase F — Archive & TestFlight

### F1. Version in Xcode setzen

1. **App** Target → Tab **General**.
2. **Version** (z. B. `1.0.0`) — sichtbar im Store.
3. **Build** (z. B. `1`) — bei jedem Upload erhöhen.

### F2. Archive erstellen

1. Oben Gerät: **Any iOS Device (arm64)** wählen — **nicht** Simulator.
2. Menü **Product → Archive**.
3. Warten (einige Minuten).
4. Fenster **Organizer** öffnet sich.

Falls **Archive** ausgegraut ist: falsches Ziel gewählt → **Any iOS Device**.

### F3. Upload zu App Store Connect

1. Im Organizer: Archiv auswählen → **Distribute App**.
2. **App Store Connect** → **Upload**.
3. Optionen meist Standard (Häkchen bei Upload symbols, etc.).
4. **Next** bis **Upload** fertig.

### F4. TestFlight

1. In App Store Connect → deine App → **TestFlight**.
2. Warten (5–30 Min), bis Build **„Bereit zum Testen“** ist.
3. **Interne Tests** → Tester hinzufügen (deine Apple-ID).
4. Auf dem iPhone: App **TestFlight** installieren → Einladung öffnen → **dice.budget** installieren.

**Checkpoint:** App läuft auf echtem iPhone über TestFlight.

---

## Phase G — App Store (öffentlich, später)

1. App Store Connect → **App Store** Tab.
2. Screenshots, Beschreibung, Altersfreigabe, Datenschutzfragebogen ausfüllen.
3. Build aus TestFlight auswählen.
4. **Zur Überprüfung einreichen**.

Review dauert oft **1–3 Tage**.

---

## Nach Code-Änderungen (Web/UI)

Immer auf dem Mac:

```bash
cd frontend
npm run build:ios
```

Dann in Xcode erneut **Archive** (Build-Nummer erhöhen).

Die **Web-Seite** https://dicebudget.bottle-trade.de deployest du weiter separat — unabhängig vom App-Upload.

---

## Häufige Probleme

| Problem | Lösung |
|---------|--------|
| `Copy failed` / rsync beim Upload | `brew unlink rsync` → `/usr/bin/rsync`; Xcode beenden; `env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open …/App.xcworkspace` |
| `pod: command not found` | `sudo gem install cocoapods`, dann `cd ios/App && pod install` |
| Build-Fehler nach `npm install` | `cd ios/App && pod install && cd ../.. && npx cap sync ios` |
| Nur `.xcodeproj` geöffnet | Schließen, **`App.xcworkspace`** öffnen |
| Signing-Fehler | Team wählen, Bundle ID `de.bottletrade.dicebudget` |
| Weißer Bildschirm in App | Internet prüfen; API: https://dicebudget.bottle-trade.de/api/health |
| Archive grau | Ziel **Any iOS Device**, nicht Simulator |
| Upload rejected (Icon) | 1024×1024 in AppIcon setzen |

---

## Deine Referenzwerte

| | |
|--|--|
| App-Name | dice.budget |
| Bundle ID | de.bottletrade.dicebudget |
| Xcode-Workspace | `frontend/ios/App/App.xcworkspace` |
| Datenschutz | https://dicebudget.bottle-trade.de/datenschutz |

---

*Bei einem Schritt hängen: notiere die **genaue Fehlermeldung** (Screenshot oder Text) — dann gezielt weiter.*
