# Milestones - DiceBudget Strategy Edition

Diese Datei ist ein Kompatibilitaets-Index. Fuer Agent-Uebergaben nicht mehr den langen historischen Stand hier lesen, sondern:

- Aktueller Arbeitsstand: `docs/milestones_active.md`
- Vollstaendige Milestone-Historie: `docs/milestones_archive.md`

## Standard Fuer Agents

Bei jeder Uebergabe:

1. `AGENT_RULES.md`
2. `HANDOVER.md`
3. `docs/milestones_active.md`

Nur bei Bedarf:

- `docs/milestones_archive.md`
- `docs/ios_current.md`
- `docs/ios_archive.md`
- `docs/decisions.md`

## Aktueller Kurzstand

- Branch: `milestone-22-prep`
- Produktcode-HEAD: `04ab018` (siehe `git log -1`)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: TestFlight `2.0 (28)`; nächster Upload **`2.0 (29)`** auf HEAD `04ab018`
- Letzte Features: Einstellungen Ein-Screen, Statistik-Hero, Spielanalyse-Kern, Screenshot-Footer, Hausregeln (Labor)

## Offene Prioritaeten

1. iOS Build 29 (`npm run build:ios` + Archive + Upload).
2. M30 TestFlight-Regression (neue UX + Hausregeln/Labor).
3. App Store Connect: Agreement, Bank/Steuer, Preis `1,19 EUR`.
4. `milestone-22-prep` → `main` nach Release-Freigabe.
