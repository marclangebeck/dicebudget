# iOS Aktuell - dice.budget

**Stand:** 2026-06-04
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `70ad656`
**Bundle ID:** `de.bottletrade.dicebudget`  

Dieses Dokument enthaelt ausschliesslich den aktuell relevanten iOS-/TestFlight-/App-Store-Stand. Aeltere iOS-Historie steht in `docs/ios_archive.md`.

## Aktueller Stand

- App Store Connect ist bei **Version 2.0**.
- Aktueller TestFlight-Build ist **2.0 (6)**.
- Naechster Upload ist **2.0 (7)**.
- M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-Finalisierung sind **noch nicht** in TestFlight `2.0 (6)`.
- Der Upload `2.0 (7)` muss M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-Finalisierung enthalten.
- Web/API sind live unter https://dicebudget.bottle-trade.de.

## Was In 2.0 (7) Enthalten Sein Muss

- M34 Bugfixes + Stats-Reset:
  - Bonus-Konfetti
  - Support-Link
  - Gegner-Pool-Refresh ohne Polling
  - Pool-Endspiel-Fix
  - Stats-Alias-Merge
  - serverseitiges Stats-Zuruecksetzen
  - Capacitor-Fix fuer Paarungs-Detail
- M35 Paarungen bearbeiten:
  - Siege je Spieler editierbar
  - Netto-Punktedifferenz editierbar
  - `POST /stats/pairings/baseline`
- UI-Politur:
  - Punktwahl gelb gefuellt
  - Spielzettel fuellt volle Bildschirmhoehe
  - Ergebnis-Zeilen moderater; `Ergebnis 1` mit besser lesbarem `+/-`-Delta
- iPad-Tischmodus:
  - Host-Option auf `/multi`
  - genau 2 Spieler auf einem iPad im Querformat
  - Namen fuer linken/rechten Spieler eingebbar
  - technische Spieler-IDs sind gueltige UUIDs
  - lokale Aliase sorgen fuer Anzeige/Statistik-Zuordnung
  - Gegner-Pool sichtbar und Pool-Endspiel bleiben waehlbar
  - Pool-Endspiel im Zwei-Zettel-Screen aufloesbar
- Game-Dashboard-Design:
  - Startscreen mit dunklem Strategiespiel-/Premium-Look
  - Hauptfunktionen: `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`
  - `Raum beitreten` ist in `/multi` integriert
  - `/solo`, `/multi`, `/multi/join` und `/settings` optisch modernisiert
  - Spielzettel zum Eintragen bewusst unveraendert
  - Startscreen zaehlt Paarungs-Spiele aus `/stats/pairings`
  - Startscreen-Bilanz zeigt gewonnen/verloren aus lokal zusammengefuehrten Paarungsdaten
  - App-Hintergrund ist dunkles Grau
  - Datenschutz/Impressum/Support stehen als kompakte feste Footer-Zeile am unteren Viewport-Rand
  - Der Footer nutzt bewusst kein `safe-area-inset-bottom`; aktuelles Padding: 2px oben und 2px unten

## Mac-Workflow Fuer Naechsten Upload

Auf dem Mac:

```bash
cd /Users/marclangebeck/projects/kniffel
git pull origin milestone-22-prep
cd frontend
npm run build:ios
brew unlink rsync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

Falls `git pull` wegen Xcode-Projektdatei blockiert:

```bash
cd /Users/marclangebeck/projects/kniffel
git restore frontend/ios/App/App.xcodeproj/project.pbxproj
git pull origin milestone-22-prep
```

In Xcode:

1. `App.xcworkspace` verwenden, nicht `.xcodeproj`.
2. Signing-Team pruefen.
3. Version `2.0` lassen.
4. Build auf `7` setzen.
5. Ziel `Any iOS Device`.
6. `Product -> Archive`.
7. Upload zu App Store Connect.

## TestFlight-Pruefung Fuer 2.0 (7)

- iPhone: bestehender Solo-/Multiplayer-Flow unveraendert.
- iPhone: Startscreen darf nicht unerwuenscht scrollen; `Einzelspiel`/`Statistik` duerfen nicht gequetscht wirken; `/solo`, `/multi`, `/multi/join` und `/settings` im neuen Design pruefen.
- iPhone: Footer auf Start-, Solo-, Multiplayer-, Settings- und Play-Screen pruefen. Datenschutz/Impressum/Support muessen unten am Viewport sitzen; Content darf nur oberhalb davon scrollen.
- iPad Hochformat: Tischmodus zeigt Dreh-Hinweis.
- iPad Querformat: Tischmodus zeigt zwei anklickbare Zettel nebeneinander.
- Tischmodus: Namen links/rechts eingeben und pruefen, ob Statistik/Paarung diese Aliase nutzt.
- Tischmodus Strategy: Gegner-Pool sichtbar und Pool-Endspiel pruefen.

## App Store Connect Offen

- Paid Applications Agreement abschliessen.
- Bankdaten hinterlegen.
- Steuerdaten hinterlegen.
- Preis auf `1,19 EUR` setzen.
- Screenshots hochladen.
- Beschreibung auf Deutsch eintragen.
- Datenschutzfragebogen ausfuellen.
- Datenschutz-URL: https://dicebudget.bottle-trade.de/datenschutz
- Support-URL: https://dicebudget.bottle-trade.de

## Stolpersteine

- Web-Deploy aktualisiert nicht die iOS-App.
- `frontend/ios/App/App/public/` ist gitignored; `npm run build:ios` auf dem Mac ist Pflicht.
- `DEVELOPMENT_TEAM` wird nicht im Git gepflegt; nach Pull in Xcode pruefen.
- Bei `Copy failed` / `rsync error`: `brew unlink rsync` und Xcode mit System-PATH starten.
- Alten App-Store-Connect-Eintrag `com.mlangebeck.mobileapp` ignorieren.
- App muss `de.bottletrade.dicebudget` verwenden.

## Relevante Dokus

- `docs/ios_archive.md` fuer alte Build-/TestFlight-Historie.
- `docs/testflight-app-store.md` fuer Schritt-fuer-Schritt-App-Store-Connect.
- `docs/ios-xcode-anleitung.md` fuer Xcode-Einsteiger-Anleitung.
