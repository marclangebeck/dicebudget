# GOiOS - dice.budget

Diese Datei ist ein Kompatibilitaets-Index. Fuer aktuellen iOS-/TestFlight-/App-Store-Stand bitte `docs/ios_current.md` lesen.

## Aktuell

- Aktueller iOS-Stand: `docs/ios_current.md`
- Aeltere iOS-/TestFlight-Historie: `docs/ios_archive.md`
- Xcode-Einsteiger-Anleitung: `docs/ios-xcode-anleitung.md`
- App-Store-Connect-Schrittfolge: `docs/testflight-app-store.md`

## Kurzstand

- Bundle ID: `de.bottletrade.dicebudget`
- Version in App Store Connect: `2.0`
- Aktueller TestFlight-Build: `2.0 (28)` (Stand `d8b5952`: Cinematic Editorial Startscreen)
- Zuvor: `2.0 (27)` mit `66e8487` (Arena Classic)
- Details und Checkliste: `docs/ios_current.md`

## Wichtig

- Web-Deploy und iOS-Release sind getrennt; `ios/App/App/public/` ist gitignored.
- Nach UI-Aenderungen: Mac `git pull` auf `d8b5952`, `npm run build:ios`, Bundle-Check (`grep home-cinematic-door`), dann Xcode Archive/Upload.
- Bei `git pull`-Fehler: `git restore frontend/package-lock.json` vor Pull.
- Alter App-Store-Connect-Eintrag `com.mlangebeck.mobileapp` wird ignoriert.
- Der verbindliche Sync-Workflow steht in `AGENT_RULES.md` Sektion 9.
