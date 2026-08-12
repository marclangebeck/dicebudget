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
- TestFlight: Builds bis **~51+** (Stand 2026-08-12); Release-Kandidat = HEAD `b8a9d79` / Produkt `3e9d9a8` (M42/M43) + `build:ios`
- Details und Checkliste: `docs/ios_current.md`
- Nächster Schritt: M42/M43 Abnahme, danach **M30** Store-Submit

## Wichtig

- Web-Deploy und iOS-Release sind getrennt; `ios/App/App/public/` ist gitignored.
- Nach UI-Aenderungen: Mac `git reset --hard origin/milestone-22-prep`, Env setzen, `npm run build:ios`, Archive/Upload.
- **Menü-Version:** iOS = Xcode Build zur Laufzeit (`App.getInfo`); Web = `NEXT_PUBLIC_APP_VERSION` + `NEXT_PUBLIC_APP_BUILD` (typisch `web`).
- **Admin (M43):** `NEXT_PUBLIC_ADMIN_PIN` (alphanumerisch) vor `build:ios`; `NEXT_PUBLIC_ADMIN_API_KEY` leer — Key nach PIN lokal.
- Bei `git pull`-Fehler: `git restore frontend/package-lock.json` vor Pull (vom Projektroot).
- Der verbindliche Sync-Workflow steht in `AGENT_RULES.md` Sektion 9.
