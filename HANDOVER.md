# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `d443444` (`Entferne Footer vom Spielzettel`)
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
| Produktcode | HEAD `d443444`; aktueller Arbeitsstand enthält Game-Dashboard-/Footer-/Legal-Finalisierung, 3D-Startscreen-Icons und Spielzettel ohne Footer |
| Backend | Keine neue Backend-Migration für iPad-Tischmodus |
| iOS/TestFlight | Version `2.0`, aktueller Build `2.0 (6)`, nächster Upload `2.0 (7)` |
| Noch nicht in iOS `2.0 (6)` | M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-/Legal-Finalisierung + 3D-Startscreen-Icons |

## Neu Seit Letzter Übergabe

- **Spielzettel-Ergebniszeilen moderater:** Ergebnis-Zeilen weniger hoch; `Ergebnis 1` zeigt Hauptwert und `+/-`-Bonus-Delta deutlicher.
- **iPad-Tischmodus:** Host-Option in `/multi`; erstellt bewusst ein 2-Spieler-Spiel auf einem iPad. `/play?table=1&invite=...` zeigt im Querformat zwei anklickbare Zettel nebeneinander.
- **Tischmodus-Namen:** Host gibt Namen für linken/rechten Spieler ein. Technische Spieler-IDs sind gültige UUIDs; Namen werden lokal als Aliase gespeichert und für Anzeige/Statistik-Zuordnung genutzt.
- **Tischmodus + Strategy-Optionen:** Gegner-Pool sichtbar und Pool-Endspiel bleiben wählbar. Pool-Endspiel ist direkt im Zwei-Zettel-Screen auflösbar.
- **Game-Dashboard-Design:** Startscreen, `/solo`, `/multi`, `/multi/join` und `/settings` wurden optisch auf dunkles Strategiespiel-/Premium-Mobile-Game-Design umgestellt. Aktuelle Startscreen-Hauptkarten: `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`.
- **Startscreen + zentrale Einstellungen:** Startscreen ist jetzt wieder ein fester, nicht scrollbarer Dashboard-Screen mit vier Hauptkarten: `Multiplayer`, `Einzelspiel`, `Statistik`, `Einstellungen`; Footer ist letztes Element. `Raum beitreten` ist in `/multi` integriert. `/settings` verwaltet Solo-/Multiplayer-Defaults, Strategy/Klassisch, Gegner-Pool, Pool-Endspiel, Bonus-Einblendung und iPad-Tischmodus. Farbwelt ist ruhiger: Dunkelblau, Anthrazit, Petrol, dezente Gold-/Kupferakzente.
- **Footer-Finalisierung auf iPhone:** Home-, Setup-, Stats-, Settings- und Legal-Screens nutzen eine feste Footer-Tabbar unten. `/play` ist bewusst footerfrei, damit der Spielzettel volle Screenhoehe bekommt. Der Footer nutzt bewusst kein `safe-area-inset-bottom`, weil iOS dadurch Links nach oben schiebt. App-Hintergrund ist dunkles Grau.
- **Settings-Optik:** `/settings` nutzt kompaktere Karten. Toggles sitzen rechts in der Card und sind gruen fuer `an`, rot fuer `aus`.
- **Startscreen-Statistik:** Header zeigt `Paarungs-Spiele` aus `/stats/pairings` statt globaler App-Runs. Die Bilanz ersetzt den alten Platzhalter-Fortschrittsbalken und nutzt lokal zusammengeführte Paarungsdaten; falls die aktuelle Geräte-ID nicht in historischen Paarungen steckt, wird ein lokal benannter Statistikspieler als Perspektive genutzt (z. B. `Marc Bilanz 48:62`).
- **Multiplayer-Abschluss:** Im normalen Multiplayer wird der Run nach dem letzten Feld automatisch abgeschlossen. Ohne Pool-Endspiel erscheint direkt das Ergebnis mit `Spiel beenden und zur Startseite` + `Zettel ansehen`; in der Zettelansicht bleibt nur der Startseiten-Button. Abschluss-Screens verlinken nicht mehr zur Lobby/Rangliste.
- **Footer-Tabbar:** Home-, Setup-, Stats-, Settings- und Legal-Screens nutzen unten eine dunkle, pillenfoermige Tabbar (`Home`, `Datenschutz`, `Impressum`, `Support`) mit vier gleich breiten Bereichen und SVG-Line-Icons. Kein `safe-area-inset-bottom` verwenden.
- **Spielzettel ohne Footer:** `/play` rendert bewusst keine Footer-Tabbar mehr; Solo-, Multiplayer- und Tischmodus-Zettel sollen den gesamten Screen zum Eintragen nutzen.
- **Legal-Screens:** `/datenschutz` und `/impressum` nutzen dieselbe feste App-Aufteilung wie die anderen Screens: dunkler Hintergrund, `AppScreenHeader`, scrollender Content und Footer-Tabbar.
- **Startscreen-3D-Icons:** Die vier Hauptkarten nutzen PNG-Assets aus `frontend/public/home-icons/` (`multiplayer.png`, `solo.png`, `stats.png`, `settings.png`) statt Inline-SVG-Motiven.
- **iOS-Layout-Hinweis:** Der aktuelle gewünschte Stand ist nicht mehr „Footer mit Safe-Area nach oben ziehen“, sondern eine feste Footer-Tabbar auf App-/Setup-/Legal-Screens und kein Footer auf `/play`. Falls auf iPhone Abstand/Abschneiden sichtbar ist, zuerst `.app-legal-footer`, Shell-Grid und iOS-WebView-/Capacitor-Bundle-Stand pruefen, nicht wieder pauschal `safe-area-inset-bottom` erhoehen.

## Wichtige Dateien

- `frontend/app/multi/page.tsx` - Host-Optionen inkl. iPad-Tischmodus und Spielernamen
- `frontend/app/play/page.tsx` - Routing zu normalem Spiel oder Tischmodus
- `frontend/components/TableModePlayBoard.tsx` - Zwei-Zettel-Screen für iPad-Querformat
- `frontend/components/HomeBentoGrid.tsx` - Game-Dashboard-Startscreen, Paarungs-Spiele und Bilanz
- `frontend/public/home-icons/*.png` - 3D-Icons fuer die vier Startscreen-Hauptkarten
- `frontend/components/HomeScreenShell.tsx` - Home-Shell mit festem Footer
- `frontend/components/FixedScreenShell.tsx` - feste Shell; zeigt Footer nicht auf `play-route`
- `frontend/components/AppLegalFooter.tsx` - dunkle Footer-Tabbar mit Home/Datenschutz/Impressum/Support
- `frontend/components/LegalScrollShell.tsx` - Legal-Shell mit App-Footer und eigenem Scrollbereich
- `frontend/components/AppScreenHeader.tsx` - farbige Unterseiten-Header
- `frontend/app/app/page.tsx` - Startscreen-Main ohne Scroll-Blockade
- `frontend/app/datenschutz/page.tsx`, `frontend/app/impressum/page.tsx` - Legal-Seiten im App-Layout
- `frontend/app/settings/page.tsx` - zentrale App-Einstellungen
- `frontend/lib/uiPrefs.ts` - lokale Geräte- und App-Defaults
- `frontend/app/multi/join/page.tsx` - modernisierte Lobby-/Join-Ansicht
- `frontend/lib/tableMode.ts` - lokaler Tischmodus-Speicher und UUID-Erzeugung
- `frontend/lib/activeGame.ts` - Resume auch für Tischmodus
- `frontend/components/ScoreSheetTable.tsx` - Ergebnis-1-Typografie / Bonus-Delta
- `frontend/app/globals.css` - App-Hintergrund, Footer-Tabbar, Legal-Screens, Settings-Karten, Tischmodus-Layout und Zettel-Höhen
- `CHANGELOG.md`, `docs/milestones_active.md`, `docs/ios_current.md`

## Offene Prioritäten

1. iOS-Build `2.0 (7)` auf dem Mac bauen und hochladen; enthält M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-/Legal-Finalisierung + 3D-Startscreen-Icons.
2. TestFlight auf iPhone und iPad prüfen: normaler iPhone-Flow darf unverändert bleiben; Footer-Tabbar muss auf Start-, Setup-, Settings-, Stats- und Legal-Screens unten sitzen; `/play` darf keinen Footer zeigen und der Zettel muss die volle Screenhoehe nutzen; `Einzelspiel`/`Statistik` dürfen nicht gedrungen wirken; iPad-Tischmodus im Querformat testen.
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
- Produktcode-HEAD: d443444 (Entferne Footer vom Spielzettel)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Version 2.0, TestFlight 2.0 (6), nächster Upload 2.0 (7)
- Noch nicht in TestFlight 2.0 (6): M34 + M35 + UI-Politur + iPad-Tischmodus + Game-Dashboard-/Footer-/Legal-Finalisierung + 3D-Startscreen-Icons
- iPad-Tischmodus: /multi Host-Option, genau 2 Spieler auf einem iPad, Namen links/rechts eingebbar, gültige UUIDs, lokale Aliase für Stats, zwei anklickbare Zettel in /play?table=1 im Querformat.
- Gegner-Pool sichtbar und Pool-Endspiel bleiben im Tischmodus wählbar; Pool-Endspiel wird im Zwei-Zettel-Screen aufgelöst.
- Multiplayer-Abschluss: nach letztem Feld automatischer Run-Abschluss; Ergebnis zeigt nur Startseite/Zettel ansehen; keine Statistik-/Lobby-/Ranglisten-Abzweige vom Abschluss.
- Startscreen: fester Dashboard-Screen mit vier Hauptkarten Multiplayer, Einzelspiel, Statistik, Einstellungen. Raum beitreten ist in /multi integriert. Logo prominent links oben. Hauptkarten nutzen 3D-PNG-Icons aus frontend/public/home-icons/.
- Zentrale Einstellungen: /settings verwaltet Solo-/Multiplayer-Defaults, Strategy/Klassisch, Gegner-Pool, Pool-Endspiel, Bonus-Einblendung und iPad-Tischmodus. Toggles rechts in den Cards, gruen fuer an und rot fuer aus.
- Footer: Home-/Setup-/Stats-/Settings-/Legal-Screens nutzen AppLegalFooter als dunkle Bottom-Tabbar mit Home, Datenschutz, Impressum, Support. Kein safe-area-inset-bottom verwenden; das schiebt auf iPhone Links nach oben.
- Play-Screens: /play zeigt bewusst keinen Footer; Solo-, Multiplayer- und Tischmodus-Zettel sollen volle Screenhoehe nutzen.
- Legal-Screens: /datenschutz und /impressum nutzen AppScreenHeader, dunklen App-Hintergrund, scrollenden Content und Footer-Tabbar.
- Wichtige Dateien fuer Layout/Footer: frontend/components/HomeScreenShell.tsx, frontend/components/FixedScreenShell.tsx, frontend/components/AppLegalFooter.tsx, frontend/components/LegalScrollShell.tsx, frontend/app/globals.css.

Auftrag:
<hier konkrete Aufgabe einfügen>
```
