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

## Icons (PWA)

```bash
npm run icons   # aus public/logo-source.png
```

## Routen

| Pfad | Shell | Inhalt |
|------|-------|--------|
| `/` | `landing-shell` | `MarketingLanding` |
| `/app` | `HomeScreenShell` | `HomeBentoGrid`, Legal-Footer, Intro-Splash |
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

## iOS (Capacitor)

```bash
npm run build:ios    # Build + cap sync
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

Doku: [../GOiOS.md](../GOiOS.md), [../docs/testflight-app-store.md](../docs/testflight-app-store.md)

Gesamtprojekt: [../README.md](../README.md), Übergabe: [../HANDOVER.md](../HANDOVER.md)
