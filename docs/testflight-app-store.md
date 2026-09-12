# dice.budget — TestFlight & App Store (Schritt für Schritt)

Referenzwerte für dieses Projekt:

| | Wert |
|--|------|
| App-Name (Anzeige) | dice.budget |
| Bundle ID | `de.bottletrade.dicebudget` |
| Datenschutz-URL | https://dicebudget.bottle-trade.de/datenschutz |
| Website | https://dicebudget.bottle-trade.de |
| Primärsprache | Deutsch |

---

## Phase 1 — App Store Connect: App anlegen

1. Öffnen: https://appstoreconnect.apple.com  
2. Mit der **Apple-ID des Developer Program** anmelden.  
3. **Apps** → **+** → **Neue App**.

| Feld | Eintrag |
|------|---------|
| Plattformen | iOS |
| Name | `dice.budget` (falls belegt: `dice.budget Yatzy` o. Ä.) |
| Primäre Sprache | Deutsch |
| Bundle-ID | `de.bottletrade.dicebudget` (muss in [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list) existieren) |
| SKU | z. B. `dicebudget-001` (nur intern, beliebig) |
| Benutzerzugriff | Voller Zugriff |

4. **Erstellen**.

### Bundle-ID fehlt?

1. https://developer.apple.com/account/resources/identifiers/list  
2. **+** → **App IDs** → **App**  
3. Description: `DiceBudget` (ohne Punkt — nur alphanumerisch)  
4. Bundle ID: **Explicit** → `de.bottletrade.dicebudget`  
5. Capabilities: für Start **keine** Extra-Häkchen nötig (kein Push, kein Sign in with Apple).  
6. **Register**.

---

## Phase 2 — Pflichtdaten in App Store Connect

Links in der App unter **App Store** (Tab) und **App-Datenschutz**.

### 2.1 Datenschutz-URL

- **App-Datenschutz** → Datenschutzrichtlinie-URL:  
  `https://dicebudget.bottle-trade.de/datenschutz`

### 2.2 App-Datenschutzfragebogen (Privacy Nutrition Labels)

Ehrlich ausfüllen — für dice.budget typisch:

| Frage | Typische Antwort |
|-------|------------------|
| Sammelt ihr Daten? | **Ja** (Spielername in MP, Spielstände auf Server) |
| Mit Konto verknüpft? | **Nein** (kein Login mit E-Mail) |
| Tracking | **Nein** |
| Datenarten | z. B. **Kennung** (Name), **Spielinhalt** (Scores) — je nach Fragenkatalog |
| Zweck | App-Funktionalität |

Kein Werbe-Tracking, keine Analytics-Pixel in der App.

### 2.3 App-Informationen (für Store, schon für TestFlight-Metadaten teilweise)

- **Kategorie:** Spiele  
- **Unterkategorie:** z. B. Brettspiele / Würfelspiele  
- **Altersfreigabe:** Fragebogen ausfüllen (kein Glücksspiel um Geld → meist **4+** oder **9+**)  
- **Beschreibung** (Deutsch): kurz erklären — Yatzy-Variante, Solo/Multi, Strategy/Klassisch  
- **Screenshots:** mindestens **6.7" iPhone** (Simulator `Cmd + S` → Bilder hochladen)  
- **Support-URL:** `https://dicebudget.bottle-trade.de`  
- **Marketing-URL:** optional gleich  

Für **nur TestFlight** reichen zunächst weniger Metadaten; für **öffentlichen Store** müssen Screenshots und Beschreibung vollständig sein.

---

## Phase 3 — Xcode: Version & Signing prüfen

1. `App.xcworkspace` öffnen.  
2. Links **App** → Target **App** → **General**:

| Feld | Release 2.0 / 97 |
|------|------------------|
| Version (Marketing) | `2.0` |
| Build | `97` |

3. **Signing & Capabilities:** Team gewählt, **Automatically manage signing**, Bundle ID `de.bottletrade.dicebudget`.

Bei jedem **neuen Upload** die **Build**-Nummer erhöhen. Version nur bei sichtbaren Releases ändern.

**Stand 2026-09-12:** Release-Ziel **2.0 (97)** — siehe `docs/ios_current.md`. Repo-`project.pbxproj` trägt Marketing 2.0 / Build 97.

### Copy failed beim Upload?

```bash
brew unlink rsync          # which rsync muss /usr/bin/rsync zeigen
# Xcode beenden (⌘Q), dann:
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ~/projects/kniffel/frontend/ios/App/App.xcworkspace
```

---

## Phase 4 — Archive erstellen

1. Oben in Xcode: Ziel **Any iOS Device (arm64)** — **nicht** Simulator.  
2. Menü **Product → Archive**.  
3. Warten (einige Minuten).  
4. **Organizer** öffnet sich mit dem Archiv.

Falls **Archive** ausgegraut: falsches Ziel gewählt oder Build-Fehler — zuerst **Product → Clean Build Folder**, dann erneut bauen.

---

## Phase 5 — Upload zu App Store Connect

Im Organizer:

1. Neuestes Archiv wählen → **Distribute App**.  
2. **App Store Connect** → **Next**.  
3. **Upload** (nicht Export).  
4. Optionen: Häkchen bei **Upload your app’s symbols** (Standard belassen).  
5. **Next** bis **Upload** startet.  
6. Bei Erfolg: grüner Haken / „Upload successful“.

### Nach dem Upload

1. App Store Connect → deine App → **TestFlight**.  
2. Build erscheint nach **5–30 Minuten** mit Status „Verarbeitung“ → dann **Bereit zum Testen“.  
3. Beim **ersten** Build: **Export Compliance** — typisch:

   - „Verwendet die App Verschlüsselung?“ → **Ja** (HTTPS)  
   - „Ist die App nur standardmäßig verschlüsselt?“ → oft **Ja** → keine extra Dokumentation  

---

## Phase 6 — TestFlight auf dem iPhone

### 6.1 Interne Tester (schnell, bis 100)

1. TestFlight → **Interne Tests** → Gruppe anlegen.  
2. Dich selbst (+ Teammitglieder mit App Store Connect-Zugang) hinzufügen.  
3. Build der Gruppe zuweisen.  
4. Auf dem iPhone: App **TestFlight** aus dem App Store installieren.  
5. Einladung per E-Mail / in TestFlight öffnen → **dice.budget** installieren.

### 6.2 Externe Tester (optional, z. B. Freunde)

- **Externe Tests** → Beta-App-Review (kurz, einmalig) → Tester per E-Mail.  
- Dauert etwas länger als interne Tests.

### Test-Checkliste auf dem iPhone

- [ ] App startet, Bento sichtbar  
- [ ] Einzelspiel durchspielen  
- [ ] Multiplayer mit Code (optional)  
- [ ] Statistik lädt  
- [ ] WLAN/Mobilfunk — API erreichbar  

---

## Phase 7 — Öffentlicher App Store (Review)

Wenn TestFlight stabil ist:

1. App Store Connect → **App Store** (Tab) → Version **1.0** vorbereiten.  
2. Build aus TestFlight auswählen.  
3. Screenshots, Beschreibung, Datenschutz, Altersfreigabe vollständig.  
4. **Zur Überprüfung einreichen**.

Review: meist **1–3 Werktage**. Apple kann Rückfragen stellen (Metadaten, Datenschutz, „Mindestfunktionalität“).

---

## Häufige Probleme

| Problem | Lösung |
|---------|--------|
| Bundle-ID nicht in der Liste | In Developer Portal anlegen (Phase 1) |
| Upload schlägt fehl (Signing) | Team in Xcode, gültiges Zertifikat |
| Build bleibt „Processing“ | 30–60 Min warten |
| TestFlight: Build nicht wählbar | Export Compliance ausfüllen |
| `Copy failed` / rsync beim Upload | `brew unlink rsync`; Xcode mit System-PATH öffnen (siehe Phase 3) |
| App lehnt Review ab (4.3 / Web Wrapper) | Beschreibung + Screenshots zeigen echte App; kein reiner Website-Link |

---

## Nach Code-Änderungen

```bash
cd ~/projects/kniffel/frontend
git pull
npm run build:ios
```

Xcode: **Build** erhöhen → **Archive** → **Upload** erneut.

---

*Stand: Mai 2026 — Projekt dice.budget / de.bottletrade.dicebudget*
