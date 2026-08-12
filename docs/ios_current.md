# iOS Aktuell - dice.budget

**Stand:** 2026-08-12  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD (Web):** `75f5228` · Tip `2140090`  
**Bundle ID:** `de.bottletrade.dicebudget`  

Aktueller iOS-/TestFlight-/App-Store-Stand. Historie: `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect: **Version 2.0**.
- TestFlight: Builds bis **~51+** (Nutzer-Stand 2026-08-12); Installationen können hinterherhinken — immer **Menü → Version 2.0 (xx)** prüfen (native Bundle-Build).
- **Release-Kandidat für M30:** aktueller HEAD mit frischem `npm run build:ios`.
- Web/API live: https://dicebudget.bottle-trade.de
- **Web/iOS ein Build (M43):** Admin per `NEXT_PUBLIC_ADMIN_PIN`; API-Key lokal nach Freischaltung (nicht im Bundle).
- Öffentliches Bundle: `NEXT_PUBLIC_ADMIN_API_KEY` leer lassen.

### Mac `.env.production` (kritisch)

| Variable | Zweck |
|----------|--------|
| `NEXT_PUBLIC_LABS_PIN` | InApp-Käufe (Features) freischalten |
| `NEXT_PUBLIC_ADMIN_PIN` | Admin-Oberfläche freischalten (ein Build; Key danach lokal) |
| `NEXT_PUBLIC_ADMIN_API_KEY` | Optional/Legacy — lieber leer; Key lokal unter Einstellungen → Admin |
| `NEXT_PUBLIC_APP_VERSION` | z. B. `2.0` (Web-Fallback; iOS-Menü liest native Version) |
| `NEXT_PUBLIC_APP_BUILD` | Web: typisch `web`. iOS-Menü zeigt **Xcode Build** zur Laufzeit (`App.getInfo`) — Env muss nicht mehr bei jedem Archive mitgezählt werden |
| `NEXT_PUBLIC_SITE_URL` | empfohlen `https://dicebudget.bottle-trade.de` |

Server-`frontend/.env.production`: Admin-API-Key **leer**, Admin-PIN gesetzt. Backend `ADMIN_API_KEY` unverändert.

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
grep -E 'NEXT_PUBLIC_LABS_PIN|NEXT_PUBLIC_ADMIN_PIN|NEXT_PUBLIC_ADMIN_API_KEY|NEXT_PUBLIC_APP_VERSION|NEXT_PUBLIC_APP_BUILD' .env.production
```

Ein Build: `NEXT_PUBLIC_ADMIN_PIN` gesetzt, `NEXT_PUBLIC_ADMIN_API_KEY` leer; Key nach PIN lokal hinterlegen.

```bash
npm install
npm run build:ios
```

`build:ios` öffnet Xcode. `brew unlink rsync` nur bei Upload-Problemen mit Homebrew-rsync.

### In Xcode (Archive → App Store Connect)

1. **Product → Clean Build Folder** (⇧⌘K)
2. Target **App** → **General** → **Build** erhöhen (Menü zeigt diese Nummer automatisch nach `build:ios`)
3. Scheme **App**, Ziel **Any iOS Device (arm64)**
4. **Product → Archive**
5. Organizer → **Distribute App** → **App Store Connect** → **Upload**
6. TestFlight: Verarbeitung abwarten; Gruppe **Freunde** zuweisen falls nötig; **Intern** oft automatisch für Entwickler-Accounts

Ausführlich: `docs/testflight-app-store.md`, Einsteiger: `docs/ios-xcode-anleitung.md`. **M30 Store-Submit:** Phase 7 in `docs/testflight-app-store.md`.

## TestFlight-Checkliste (aktueller HEAD+)

- **Menü:** Version 2.0 (Build-Nr. = Xcode); aktiver Footer-Tab sichtbar
- **Spielregeln:** Visuelle Einblendungen inkl. Toggle **Gold-Aufleuchten**; Bereich **InApp-Käufe (Features)** nach Labs-Code
- Fortschritt 25/50/75 %, Multi, Solo, Screenshot „Bild“
- Gold-Aufleuchten bei fertiger Zeile/Spalte (3× gold + Fanfare bei Sounds an)
- Achievement-Sounds zuverlässig (Gr. Straße, Alle Fünfe, Bonus, unten voll, Einswurf)
- Statistik / Paarungen / Admin nur mit Key-Build

## Bekannte Hinweise

- Web-Menü zeigt `Version 2.0 (web)` — das ist Absicht.
- `package-lock.json`-Konflikt beim Pull: `git restore frontend/package-lock.json` dann erneut pullen.
