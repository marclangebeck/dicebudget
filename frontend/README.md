# dice.budget – Frontend

Next.js 15 (App Router), **statischer Export** (`output: "export"` in `next.config.ts`).

## Wichtig

- **Keine dynamischen Routen** für Join-Codes oder Paarungen → Query-Parameter:
  - Gast: `/multi/join?code=ABCD1234`
  - Paarung: `/stats/pairing?key=…`
- **API-Basis** (`NEXT_PUBLIC_API_URL`):
  - Lokal (Dev): `http://127.0.0.1:3020`
  - Produktion: `https://dicebudget.bottle-trade.de/api` in **`.env.production`**
- **Capacitor iOS:** nach jeder UI-Änderung `npm run build:ios` (sync nach `ios/App/App/public/`)
- Paarungslinks auf `/stats` nutzen `<a href>` (voller Seitenload — static export)
- **Vollbild ohne Seiten-Scroll:** `/play` nutzt `PlayScreenShell` + `FitScoreSheet`
- **Legal-Seiten:** `LegalScrollShell` — eigener Scroll-Container + Safe-Area (Capacitor `scrollEnabled: false`)

## Entwicklung

```bash
npm install
npm run dev    # Port 3021
```

Backend parallel in `../backend` starten (`npm run dev`, Port 3020).

## Tests (M27)

**Unit-Tests** (Node test runner, kein Dauerprozess):

```bash
npm run test
```

**E2E Smoke-Tests** (Playwright, nur manuell lokal — startet kurzzeitig `npm run dev`, danach mit Ctrl+C bzw. automatisch beenden):

```bash
npx playwright install chromium   # einmalig pro Maschine
npm run test:e2e
```

Kein CI-Watcher auf dem Produktionsserver (`AGENT_RULES.md`). E2E typischerweise auf dem Mac nach `git pull`.

Abgedeckte Smoke-Szenarien: `/app` (Cinematic/Classic), Solo → Feld → Eintrag-Overlay, `/multi/join` Code-Eingabe.

## Icons (PWA)

```bash
npm run icons   # aus public/logo-source.png
```

## Routen

| Pfad | Shell | Inhalt |
|------|-------|--------|
| `/` | `landing-shell` | `MarketingLanding` |
| `/app` | `HomeScreenShell` | `HomeBentoGrid` (cinematic/classic), Legal-Footer, Intro-Splash |

### Startscreen-Layout

| Modus | Komponente | Umschalten |
|-------|------------|------------|
| `cinematic` (Standard) | `HomeBentoGridCinematic` | gestapelte Multi/Solo-Türen |
| `classic` | `HomeBentoGridClassic` | zwei Arena-Kacheln + Hero |

- **Production:** `NEXT_PUBLIC_HOME_LAYOUT=cinematic|classic` in `.env.production`, danach `npm run build`
- **Ein Befehl:** `bash infra/scripts/set-home-layout.sh classic` (oder `cinematic`)
- **Sofort im Browser (ohne Rebuild):** `localStorage.setItem('dicebudget.homeLayout','classic'); location.reload();` — Override entfernen: `localStorage.removeItem('dicebudget.homeLayout'); location.reload();`
| `/datenschutz` | `LegalScrollShell` | Datenschutzerklärung |
| `/impressum` | `LegalScrollShell` | Impressum |
| `/solo` | `SetupScreenLayout` | `GameSetup`, `AppScreenHeader` |
| `/multi` | `SetupScreenLayout` | Raum erstellen (Host) |
| `/multi/join?code=…` | `SetupScreenLayout` | Lobby, `BackToHome` |
| `/play` | `PlayScreenShell` | `PlayBoard` |
| `/stats` | `SetupScreenLayout` | Paarungen, lokale Aliase |
| `/stats/pairing?key=…` | `SetupScreenLayout` | Paarungsdetail |

## Struktur (Auszug)

| Pfad | Inhalt |
|------|--------|
| `app/app/page.tsx` | iOS-Start, Intro-Splash |
| `app/globals.css` | Dunkler Verlauf, `.app-nav-btn`, Bento/Play/Stats |
| `components/HomeBentoGrid.tsx` | Bento + Legal-Footer |
| `components/AppScreenHeader.tsx` | `← Startseite` auf Unterseiten |
| `components/BackToHome.tsx` | Wiederverwendbarer Nav-Button |
| `components/LegalScrollShell.tsx` | Scroll + Safe-Area Legal |
| `components/SetupScreenLayout.tsx` | Solo/Multi/Stats-Layout |
| `lib/localSoloRun.ts` | Solo lokal (LocalStorage) |
| `lib/playerIdentity.ts` | Lokale `playerId` |
| `lib/branding.ts` | Pfade, URLs |
| `lib/gameScoring.ts` | Scoring (Bonus 63/35) + `upperBonusDelta` (M30) + `upperBonusAchieved` (M31) |
| `components/ScoreSheetTable.tsx` | Zettel; „Ergebnis 1“ zeigt Bonus-Delta (+ grün / − rot / ±0 grau) |
| `components/BonusOverlay.tsx` | Bonus-Einblendung bei erreichtem Oberbonus (M31), Auto-Close 2,5 s |
| `lib/uiPrefs.ts` | Geräte-Einstellung Bonus-Einblendung (LocalStorage, M31) |
| `components/PlayTopBar.tsx` | Topbar: eigener Pool + optionaler Gegner-Pool (M32) |
| `components/PoolEndgamePanel.tsx` | Pool-Endspiel: Sieger verbessert 1 Feld (M33) |
| `components/PlayBoard.tsx` | Spielsteuerung; Würfe-Standard Strategy = 3; Pool-Endspiel-Improver-Phase (M33) |

## iOS (Capacitor)

```bash
npm run build:ios    # Build + cap sync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

Doku: [../GOiOS.md](../GOiOS.md), [../docs/testflight-app-store.md](../docs/testflight-app-store.md)

Gesamtprojekt: [../README.md](../README.md), Übergabe: [../HANDOVER.md](../HANDOVER.md)
