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
- Aktueller TestFlight-Build: `2.0 (6)`
- Naechster Upload: `2.0 (7)`
- M34 + M35 + UI-Politur sind noch nicht im aktuellen TestFlight-Build.

## Wichtig

- Web-Deploy und iOS-Release sind getrennt.
- Nach UI-Aenderungen braucht iOS auf dem Mac `npm run build:ios` und danach Xcode Archive/Upload.
- Alter App-Store-Connect-Eintrag `com.mlangebeck.mobileapp` wird ignoriert.
- Der verbindliche Sync-Workflow steht in `AGENT_RULES.md` Sektion 9.
