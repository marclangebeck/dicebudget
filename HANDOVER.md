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
| Produktcode | HEAD `70ad656`; aktueller Arbeitsstand enthält zusätzlich Game-Dashboard-/Footer-Finalisierung und dunkles Grau |
| Backend | Keine neue Backend-Migration für iPad-Tischmodus |
| iOS/TestFlight | Version `2.0`, aktueller Build `2.0 (6)`, nächster Upload `2.0 (7)` |
| Noch nicht in iOS `2.0 (6)` | M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-Finalisierung |

## Neu Seit Letzter Übergabe

- **Spielzettel-Ergebniszeilen moderater:** Ergebnis-Zeilen weniger hoch; `Ergebnis 1` zeigt Hauptwert und `+/-`-Bonus-Delta deutlicher.
- **iPad-Tischmodus:** Host-Option in `/multi`; erstellt bewusst ein 2-Spieler-Spiel auf einem iPad. `/play?table=1&invite=...` zeigt im Querformat zwei anklickbare Zettel nebeneinander.
- **Tischmodus-Namen:** Host gibt Namen für linken/rechten Spieler ein. Technische Spieler-IDs sind gültige UUIDs; Namen werden lokal als Aliase gespeichert und für Anzeige/Statistik-Zuordnung genutzt.
- **Tischmodus + Strategy-Optionen:** Gegner-Pool sichtbar und Pool-Endspiel bleiben wählbar. Pool-Endspiel ist direkt im Zwei-Zettel-Screen auflösbar.
- **Game-Dashboard-Design:** Startscreen, `/solo`, `/multi`, `/multi/join` und `/settings` wurden optisch auf dunkles Strategiespiel-/Premium-Mobile-Game-Design umgestellt. Aktuelle Startscreen-Hauptkarten: `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`.
- **Startscreen + zentrale Einstellungen:** Startscreen ist jetzt wieder ein fester, nicht scrollbarer Dashboard-Screen mit vier Hauptkarten: `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`; Footer ist letztes Element. `Raum beitreten` ist in `/multi` integriert. `/settings` verwaltet Solo-/Multiplayer-Defaults, Strategy/Klassisch, Gegner-Pool, Pool-Endspiel, Bonus-Einblendung und iPad-Tischmodus. Farbwelt ist ruhiger: Dunkelblau, Anthrazit, Petrol, dezente Gold-/Kupferakzente.
- **Footer-Finalisierung auf iPhone:** Home-, Setup- und Play-Shells nutzen ein zweizeiliges Grid aus `Content` + fester Footer-Zeile. Datenschutz/Impressum/Support sind zentral in `AppLegalFooter`. Der Footer nutzt bewusst kein `safe-area-inset-bottom`, weil iOS dadurch die Links nach oben schiebt; aktueller kompakter Stand: 2px Padding oben und unten, kleinere Mindesthoehe. App-Hintergrund ist dunkles Grau.
- **Settings-Optik:** `/settings` nutzt kompaktere Karten. Toggles sitzen rechts in der Card und sind gruen fuer `an`, rot fuer `aus`.
- **Startscreen-Statistik:** Header zeigt `Paarungs-Spiele` aus `/stats/pairings` statt globaler App-Runs. Die Bilanz ersetzt den alten Platzhalter-Fortschrittsbalken und nutzt lokal zusammengeführte Paarungsdaten; falls die aktuelle Geräte-ID nicht in historischen Paarungen steckt, wird ein lokal benannter Statistikspieler als Perspektive genutzt (z. B. `Marc Bilanz 48:62`).
- **iOS-Layout-Hinweis:** Der aktuelle gewünschte Stand ist nicht mehr „Footer mit Safe-Area nach oben ziehen“, sondern eine feste Footer-Zeile unten. Falls auf iPhone noch Abstand sichtbar ist, zuerst `.app-legal-footer`, Shell-Grid und iOS-WebView-/Capacitor-Bundle-Stand pruefen, nicht wieder pauschal `safe-area-inset-bottom` erhoehen.

## Wichtige Dateien

- `frontend/app/multi/page.tsx` - Host-Optionen inkl. iPad-Tischmodus und Spielernamen
- `frontend/app/play/page.tsx` - Routing zu normalem Spiel oder Tischmodus
- `frontend/components/TableModePlayBoard.tsx` - Zwei-Zettel-Screen für iPad-Querformat
- `frontend/components/HomeBentoGrid.tsx` - Game-Dashboard-Startscreen, Paarungs-Spiele und Bilanz
- `frontend/components/HomeScreenShell.tsx` - Home-Shell mit festem Footer
- `frontend/components/FixedScreenShell.tsx` - Setup-/Play-Shell mit festem Footer
- `frontend/components/AppLegalFooter.tsx` - gemeinsame Datenschutz/Impressum/Support-Zeile
- `frontend/components/AppScreenHeader.tsx` - farbige Unterseiten-Header
- `frontend/app/app/page.tsx` - Startscreen-Main ohne Scroll-Blockade
- `frontend/app/settings/page.tsx` - zentrale App-Einstellungen
- `frontend/lib/uiPrefs.ts` - lokale Geräte- und App-Defaults
- `frontend/app/multi/join/page.tsx` - modernisierte Lobby-/Join-Ansicht
- `frontend/lib/tableMode.ts` - lokaler Tischmodus-Speicher und UUID-Erzeugung
- `frontend/lib/activeGame.ts` - Resume auch für Tischmodus
- `frontend/components/ScoreSheetTable.tsx` - Ergebnis-1-Typografie / Bonus-Delta
- `frontend/app/globals.css` - App-Hintergrund, Footer, Settings-Karten, Tischmodus-Layout und Zettel-Höhen
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. iOS-Build `2.0 (7)` auf dem Mac bauen und hochladen; enthält M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-Finalisierung.
2. TestFlight auf iPhone und iPad prüfen: normaler iPhone-Flow darf unverändert bleiben; Footer muss auf Start-, Setup-, Settings- und Play-Screens am unteren Viewport-Rand sitzen; `Einzelspiel`/`Statistik` dürfen nicht gedrungen wirken; iPad-Tischmodus im Querformat testen.
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
- Produktcode-HEAD: 70ad656; aktueller Arbeitsstand enthält danach noch Game-Dashboard-/Footer-Finalisierung und Dokumentationsupdates.
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (6), nächster Upload 2.0 (7)
- Noch nicht in TestFlight 2.0 (6): M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-Finalisierung
- iPad-Tischmodus: /multi Host-Option, genau 2 Spieler auf einem iPad, Namen links/rechts eingebbar, gültige UUIDs, lokale Aliase für Stats, zwei anklickbare Zettel in /play?table=1 im Querformat.
- Gegner-Pool sichtbar und Pool-Endspiel bleiben im Tischmodus wählbar; Pool-Endspiel wird im Zwei-Zettel-Screen aufgelöst.
- Startscreen: fester Dashboard-Screen mit vier Hauptkarten Multiplayer, Einzelspiel, Statistik, Einstellungen. Raum beitreten ist in /multi integriert. Logo prominent links oben.
- Zentrale Einstellungen: /settings verwaltet Solo-/Multiplayer-Defaults, Strategy/Klassisch, Gegner-Pool, Pool-Endspiel, Bonus-Einblendung und iPad-Tischmodus. Toggles rechts in den Cards, gruen fuer an und rot fuer aus.
- Footer: Datenschutz/Impressum/Support kommen aus AppLegalFooter und sind in Home-/Setup-/Play-Shells als feste untere Grid-Zeile eingebunden. Kein safe-area-inset-bottom im Footer verwenden; das schiebt auf iPhone die Links nach oben. Aktueller Stand: app-legal-footer mit 2px Padding oben/unten und dunklem grauem Hintergrund.
- Wichtige Dateien fuer Layout/Footer: frontend/components/HomeScreenShell.tsx, frontend/components/FixedScreenShell.tsx, frontend/components/AppLegalFooter.tsx, frontend/app/globals.css.

Auftrag:
<hier konkrete Aufgabe einfügen>
```
