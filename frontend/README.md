# dice.budget – Frontend

Next.js 15 (App Router), **statischer Export** (`output: "export"` in `next.config.ts`).

## Wichtig

- **Keine dynamischen Routen** für Join-Codes oder Paarungen → Query-Parameter:
  - Gast: `/multi/join?code=ABCD1234`
  - Paarung: `/stats/pairing?key=Marc%3A%3ANicole%20Langebeck`
- **API-Basis** (`NEXT_PUBLIC_API_URL`):
  - Lokal (Dev): `http://127.0.0.1:3020` (Default in `lib/api.ts`)
  - Produktion: `https://dicebudget.bottle-trade.de/api` in **`.env.production`**
- Produktion: `npm run build` → Ausgabe in `out/`
- Paarungslinks auf `/stats` nutzen `<a href>` (voller Seitenload — zuverlässig beim static export)
- **Vollbild ohne Seiten-Scroll:** `/play` nutzt `PlayScreenShell` + `FitScoreSheet`; Eintrags-Panel fix unten (Panel scrollt intern nur bei vielen Punkte-Buttons)

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
| `/` | — | Landingpage `MarketingLanding` |
| `/app` | `HomeScreenShell` | `HomeBentoGrid`, `ResumeActiveGame` |
| `/datenschutz` | — | Datenschutzerklärung (App Store) |
| `/solo` | `SetupScreenLayout` | `GameSetup`, Modus-Toggle |
| `/multi` | `SetupScreenLayout` | Raum erstellen (Host) |
| `/multi/join?code=…` | — | Lobby, Liga-Rangliste |
| `/play` | `PlayScreenShell` | `PlayBoard`, skalierter Zettel |
| `/stats` | — | Paarungen, `NameMergePanel` |
| `/stats/pairing?key=…` | — | Paarungsdetail |

## Struktur (Auszug)

| Pfad | Inhalt |
|------|--------|
| `app/(home)/page.tsx` | Bento-Startscreen |
| `app/solo/page.tsx` | Solo-Setup |
| `app/play/page.tsx` | Spiel (Vollbild, `play-screen-inner`) |
| `app/multi/page.tsx` | Raum erstellen |
| `app/multi/join/page.tsx` | Lobby, Liga, neue Runde |
| `app/stats/page.tsx` | Paarungen, Namen zusammenführen |
| `app/stats/pairing/page.tsx` | Paarungsdetail |
| `app/stats/pairing/error.tsx` | Fehler-Fallback |
| `app/globals.css` | Glass-UI: `.home-bento-*`, `.stats-*`, `.setup-host-*`, `.play-*` |
| `components/HomeBentoGrid.tsx` | Start: Bento-Kacheln + Code-Zeile |
| `components/AppScreenHeader.tsx` | Kopf für Setup & Statistik |
| `components/SetupScreenLayout.tsx` | Layout Solo/Multi-Setup |
| `components/HomeScreenShell.tsx` | Start-Vollbild-Shell |
| `components/PlayScreenShell.tsx` | Spiel-Vollbild (`play-route`) |
| `components/FixedScreenShell.tsx` | Basis: kein Dokument-Scroll |
| `components/PlayBoard.tsx` | Spielkern, Overlay, Abandon |
| `components/PlayTopBar.tsx` | Zurück, Pool/Rest-Chips |
| `components/FitScoreSheet.tsx` | Zettel-Skalierung auf Screen-Höhe |
| `components/ScoreSheetTable.tsx` | Zettel, Zusatz-Yatzy |
| `components/ScoreEntryPanel.tsx` | Fixiertes Eintrags-Panel unten |
| `components/RunCompleteOverlay.tsx` | Nach letztem Feld |
| `components/RunFinishScreen.tsx` | Ergebnis nach `finish` |
| `components/StrategyModeToggle.tsx` | Strategy / Klassisch |
| `components/GameSetup.tsx` | Solo-Start |
| `components/PairingSummaryCard.tsx` | Paarungskarte |
| `components/NameMergePanel.tsx` | Namens-Aliase |
| `components/JoinByCodeForm.tsx` | (Legacy; Code primär in Bento) |
| `lib/api.ts` | API-Client |
| `lib/normalizePairing.ts` | Defensive DTO-Normalisierung |
| `lib/activeGame.ts` | Resume in `sessionStorage` |

Entfernt: `HomeModeButtons.tsx` (ersetzt durch `HomeBentoGrid`).

## iOS (Capacitor)

```bash
npm run build:ios    # Build + cap sync
npx cap open ios     # Xcode (nur auf macOS)
```

Anleitung App Store: [../docs/ios-app-store.md](../docs/ios-app-store.md)

Dokumentation Gesamtprojekt: [../README.md](../README.md)
