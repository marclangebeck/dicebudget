# iOS Aktuell - dice.budget

**Stand:** 2026-08-07  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD (Web):** `f3a1ed0`  
**Bundle ID:** `de.bottletrade.dicebudget`  

Aktueller iOS-/TestFlight-/App-Store-Stand. Historie: `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- TestFlight: Builds bis **2.0 (45+)** wurden hochgeladen (Stand Nutzer 2026-08-07); Installationen können hinterherhinken — immer **Menü → Version 2.0 (xx)** prüfen.
- **Release-Kandidat für M30:** aktueller HEAD mit frischem `npm run build:ios`.
- Web/API live: https://dicebudget.bottle-trade.de
- **Web öffentlich:** ohne eingebetteten Admin-Key (keine Admin-Buttons im Browser).
- **Admin nur Mac-Build:** `NEXT_PUBLIC_ADMIN_API_KEY` in Mac-`.env.production` vor `build:ios`.

### Mac `.env.production` (kritisch)

| Variable | Zweck |
|----------|--------|
| `NEXT_PUBLIC_LABS_PIN` | InApp-Käufe (Features) freischalten |
| `NEXT_PUBLIC_ADMIN_API_KEY` | Stats-Admin-UI (**Löschen · Server**, Siege/Diff) — muss Backend `ADMIN_API_KEY` entsprechen; **nur auf Admin-Gerät**; Spieler-Builds ohne Key |
| `NEXT_PUBLIC_APP_VERSION` | z. B. `2.0` |
| `NEXT_PUBLIC_APP_BUILD` | muss **Xcode Build** entsprechen (z. B. `46`) |
| `NEXT_PUBLIC_SITE_URL` | empfohlen `https://dicebudget.bottle-trade.de` |

Server-`frontend/.env.production` für den öffentlichen Web-Build: Admin-Key **leer**. Backend `ADMIN_API_KEY` unverändert.

## iOS-Bundle (kritisch)

| Schritt | Reicht für neue UI in TestFlight? |
|---------|-----------------------------------|
| `git pull` | Nein (nur Quellcode) |
| `npm run build` auf Server | Nein (nur Web unter `frontend/out/`) |
| **`npm run build:ios` auf Mac** | **Ja** (`cap sync` → `ios/App/App/public/`) |
| Xcode Archive ohne `build:ios` | Nein |

`frontend/ios/App/App/public/` ist in `.gitignore`. Befehle nur auf dem **Mac**, nicht auf dem Linux-Server.

## Mac-Workflow (TestFlight / App Store Connect)

```bash
cd ~/projects/kniffel
git restore frontend/package-lock.json
git fetch origin
git reset --hard origin/milestone-22-prep
git log -1 --oneline
```

```bash
cd ~/projects/kniffel/frontend
grep -E 'NEXT_PUBLIC_LABS_PIN|NEXT_PUBLIC_ADMIN_API_KEY|NEXT_PUBLIC_APP_VERSION|NEXT_PUBLIC_APP_BUILD' .env.production
```

Admin-Gerät: Key gesetzt. Spieler-Gerät: Key-Zeile leer.

```bash
npm install
npm run build:ios
```

`build:ios` öffnet Xcode. `brew unlink rsync` nur bei Upload-Problemen mit Homebrew-rsync.

### In Xcode (Archive → App Store Connect)

1. **Product → Clean Build Folder** (⇧⌘K)
2. Target **App** → **General** → **Build** = Wert aus `NEXT_PUBLIC_APP_BUILD`
3. Scheme **App**, Ziel **Any iOS Device (arm64)**
4. **Product → Archive**
5. Organizer → **Distribute App** → **App Store Connect** → **Upload**
6. TestFlight: Verarbeitung abwarten; Gruppe **Freunde** zuweisen falls nötig; **Intern** oft automatisch für Entwickler-Accounts

Ausführlich: `docs/testflight-app-store.md`, Einsteiger: `docs/ios-xcode-anleitung.md`. **M30 Store-Submit:** Phase 7 in `docs/testflight-app-store.md`.

## TestFlight-Checkliste (aktueller HEAD+)

- **Menü:** Version 2.0 (Build-Nr.); aktiver Footer-Tab sichtbar
- **Spielregeln:** Bereich **InApp-Käufe (Features)** nach Labs-Code
- **Brennt:** zwei Optionen (−1 / −2 Pool)
- **Statistik:** **Verwalten**-Menü; Admin: Löschen · Server / Siege-Diff; absolute Diff nach Speichern gerätegleich; **danach** neue Partie erhöht Siege/Diff
- **Neue Runde:** Pool / Pool-Endspiel / House-Rules bleiben
- **Zoom:** Fokus in Namens-/Siege-Feldern darf die Seite nicht dauerhaft vergrößern
- Fortschritt 25/50/75 %, Multi, Solo, Screenshot „Bild“
- Spalten-Pool-Boni / Auto-Alle-Fünfe nur mit Labs + Strategy-Duell

## Typische Fehler

- **UI alt trotz Pull** → `npm run build:ios` fehlte vor Archive
- **Kein Admin in TestFlight** → `NEXT_PUBLIC_ADMIN_API_KEY` fehlte in Mac-`.env.production` vor dem Build
- **Admin im öffentlichen Web** → darf nicht vorkommen (Server-Env ohne Key)
- **Labor-Code ungültig** → PIN fehlt oder Build nach PIN-Änderung nicht wiederholt
- **Build-Nummer nicht erhöht** → Upload abgelehnt / alte Version bleibt aktiv
- **Intern nicht sichtbar** → Build neu hochladen oder **Freunde** zuweisen; TestFlight aktualisieren
