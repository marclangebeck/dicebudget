# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `70ad656` (`Korrigiere iOS-Scrollport am Startscreen`)
**Sprache:** Deutsch

Diese Datei ist die kompakte Startübergabe. Aktiver Arbeitsstand: `docs/milestones_active.md`. iOS/App Store: `docs/ios_current.md`. Dauerhafte Projektentscheidungen nur bei Bedarf: `docs/decisions.md`.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9 ist Pflicht: Nach jeder Code-Änderung GitHub, Server und Mac synchronisieren und nummerierte `[Server]`-/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung.
- Kein `sudo`; sudo-Schritte sind immer Nutzer-Aufgabe.
- Keine Watcher, kein Polling, keine Dauerprozesse, kein Auto-Deploy.
- Agent arbeitet nur auf dem Server unter `/home/bottleadmin/projects/kniffel`.
- Mac-Pfad des Nutzers: `/Users/marclangebeck/projects/kniffel`.
- Reine Frontend-Änderungen: auf dem Server genügt `cd frontend && npm run build`; Nginx liefert `frontend/out/` direkt aus.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` |
| Produktcode | HEAD `70ad656` mit iPad-Tischmodus + Game-Dashboard-Design + bestätigtem iOS-Scrollport-Fix |
| Backend | Keine neue Backend-Migration für iPad-Tischmodus |
| iOS/TestFlight | Version `2.0`, aktueller Build `2.0 (6)`, nächster Upload `2.0 (7)` |
| Noch nicht in iOS `2.0 (6)` | M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-Design |

## Neu Seit Letzter Übergabe

- **Spielzettel-Ergebniszeilen moderater:** Ergebnis-Zeilen weniger hoch; `Ergebnis 1` zeigt Hauptwert und `+/-`-Bonus-Delta deutlicher.
- **iPad-Tischmodus:** Host-Option in `/multi`; erstellt bewusst ein 2-Spieler-Spiel auf einem iPad. `/play?table=1&invite=...` zeigt im Querformat zwei anklickbare Zettel nebeneinander.
- **Tischmodus-Namen:** Host gibt Namen für linken/rechten Spieler ein. Technische Spieler-IDs sind gültige UUIDs; Namen werden lokal als Aliase gespeichert und für Anzeige/Statistik-Zuordnung genutzt.
- **Tischmodus + Strategy-Optionen:** Gegner-Pool sichtbar und Pool-Endspiel bleiben wählbar. Pool-Endspiel ist direkt im Zwei-Zettel-Screen auflösbar.
- **Game-Dashboard-Design:** Startscreen, `/solo`, `/multi` und `/multi/join` wurden optisch auf dunkles Strategiespiel-/Premium-Mobile-Game-Design umgestellt. Hauptfunktionen bleiben erhalten: Raum erstellen, Statistik, Einzelspiel, Raum beitreten.
- **Startscreen + zentrale Einstellungen:** Startscreen ist jetzt wieder ein fester, nicht scrollbarer Dashboard-Screen mit vier Hauptkarten: `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`; Footer ist letztes Element. `Raum beitreten` ist in `/multi` integriert. `/settings` verwaltet Solo-/Multiplayer-Defaults, Strategy/Klassisch, Gegner-Pool, Pool-Endspiel, Bonus-Einblendung und iPad-Tischmodus. Farbwelt ist ruhiger: Dunkelblau, Anthrazit, Petrol, dezente Gold-/Kupferakzente.
- **Startscreen-Statistik:** Header zeigt `Paarungs-Spiele` aus `/stats/pairings` statt globaler App-Runs. Die Bilanz ersetzt den alten Platzhalter-Fortschrittsbalken und nutzt lokal zusammengeführte Paarungsdaten; falls die aktuelle Geräte-ID nicht in historischen Paarungen steckt, wird ein lokal benannter Statistikspieler als Perspektive genutzt (z. B. `Marc Bilanz 48:62`).
- **iOS-Scrollport-Fix bestätigt:** Der Startscreen ist in iOS/Capacitor jetzt zuverlässig scrollbar. Ursache war der alte starre Home-/Bento-Aufbau; finaler Fix: `home-screen` als interner `100dvh`-Scrollport, `html/body` auf `home-route` ohne konkurrierenden Body-Scroll, Home-Main ohne `overflow-hidden`/`flex-1`/`min-h-0`. `Einzelspiel` hat mehr Abstand zwischen Bild und Text. Spielzettel/Play-Screens bleiben starr.

## Wichtige Dateien

- `frontend/app/multi/page.tsx` - Host-Optionen inkl. iPad-Tischmodus und Spielernamen
- `frontend/app/play/page.tsx` - Routing zu normalem Spiel oder Tischmodus
- `frontend/components/TableModePlayBoard.tsx` - Zwei-Zettel-Screen für iPad-Querformat
- `frontend/components/HomeBentoGrid.tsx` - Game-Dashboard-Startscreen, Paarungs-Spiele und Bilanz
- `frontend/components/HomeScreenShell.tsx` - scrollbarer iOS-Startscreen-Container
- `frontend/components/AppScreenHeader.tsx` - farbige Unterseiten-Header
- `frontend/app/app/page.tsx` - Startscreen-Main ohne Scroll-Blockade
- `frontend/app/settings/page.tsx` - zentrale App-Einstellungen
- `frontend/lib/uiPrefs.ts` - lokale Geräte- und App-Defaults
- `frontend/app/multi/join/page.tsx` - modernisierte Lobby-/Join-Ansicht
- `frontend/lib/tableMode.ts` - lokaler Tischmodus-Speicher und UUID-Erzeugung
- `frontend/lib/activeGame.ts` - Resume auch für Tischmodus
- `frontend/components/ScoreSheetTable.tsx` - Ergebnis-1-Typografie / Bonus-Delta
- `frontend/app/globals.css` - Tischmodus-Layout und Zettel-Höhen
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. iOS-Build `2.0 (7)` auf dem Mac bauen und hochladen; enthält M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-Design.
2. TestFlight auf iPhone und iPad prüfen: normaler iPhone-Flow darf unverändert bleiben; Startscreen muss scrollbar sein; `Einzelspiel`/`Statistik` dürfen nicht gedrungen wirken; iPad-Tischmodus im Querformat testen.
3. App Store Connect: Paid Applications Agreement, Bank/Steuer, Preis `1,19 EUR`.
4. Store-Metadaten: Screenshots, Beschreibung DE, Datenschutzfragebogen.
5. Optional später: Stats-Reset-/Baseline-Endpunkte auf eigene Paarungen einschränken.
6. Optional später: `milestone-22-prep` nach Nutzer-Freigabe auf `main` bringen.

## Pflicht-Lesereihenfolge

Bei jeder Übergabe lesen:

1. `AGENT_RULES.md`
2. `HANDOVER.md`
3. `docs/milestones_active.md`

Nur bei Bedarf:

4. `docs/ios_current.md` - iOS/TestFlight/App Store
5. `docs/decisions.md` - dauerhafte Architektur-/Betriebsentscheidungen
6. `docs/milestones_archive.md` - ältere Milestone-Historie
7. `docs/ios_archive.md` - ältere iOS-Historie

## Übergabeprompt Für Neuen Agent

```text
Du arbeitest am Projekt dice.budget weiter (Repo: kniffel).

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
- AGENT_RULES.md Sektion 9 ist verbindlich: Nach jeder Code-Änderung GitHub + Server + Mac synchronisieren und nummerierte [Server]/[Mac]-Befehle ausgeben.
- Keine sudo-Befehle ausführen; sudo ist Nutzer-Aufgabe.
- Keine Watcher, kein Polling, keine Dauerprozesse, kein Auto-Deploy.
- Agent arbeitet direkt auf dem Server unter /home/bottleadmin/projects/kniffel.
- Mac-Pfad des Nutzers: /Users/marclangebeck/projects/kniffel.
- Reine Frontend-Änderungen brauchen auf dem Server nur: cd frontend && npm run build.
- Keine Archivdateien lesen, wenn Pflichtdateien reichen.

Aktueller Kurzstand:
- Branch: milestone-22-prep
- Produktcode-HEAD: 70ad656 (Korrigiere iOS-Scrollport am Startscreen)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (6), nächster Upload 2.0 (7)
- Noch nicht in TestFlight 2.0 (6): M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-Design
- iPad-Tischmodus: /multi Host-Option, genau 2 Spieler auf einem iPad, Namen links/rechts eingebbar, gültige UUIDs, lokale Aliase für Stats, zwei anklickbare Zettel in /play?table=1 im Querformat.
- Gegner-Pool sichtbar und Pool-Endspiel bleiben im Tischmodus wählbar; Pool-Endspiel wird im Zwei-Zettel-Screen aufgelöst.
- Game-Dashboard-Design: Startscreen, /solo, /multi und /multi/join sind optisch modernisiert; Hauptfunktionen bleiben Raum erstellen, Statistik, Einzelspiel, Raum beitreten.
- Startscreen-Statistik: Paarungs-Spiele kommen aus /stats/pairings; Bilanz nutzt lokal zusammengeführte Paarungsdaten und fällt auf lokal benannte Statistikspieler zurück, wenn die aktuelle Geräte-ID nicht in historischen Paarungen steckt.
- iOS-Scrollport-Fix ist bestätigt: Startscreen scrollt in iOS/Capacitor; Spielzettel/Play-Screens bleiben starr. Wichtige Dateien: frontend/components/HomeScreenShell.tsx, frontend/app/app/page.tsx, frontend/app/globals.css.

Auftrag:
<hier konkrete Aufgabe einfügen>
```
