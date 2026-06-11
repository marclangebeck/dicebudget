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
- Produktcode-HEAD: `d8b5952` (2026-06-11)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: TestFlight `2.0 (28)` aktuell (Stand `d8b5952`); zuvor `2.0 (27)` mit `66e8487`
- Letzte Features: Cinematic Editorial Startscreen, Classic-Rollback, Footer Glas-Morph, Card-Dashboards, Code nur teilen.

## Offene Prioritaeten

1. TestFlight-Regression (Cinematic-Startscreen, Footer/Menü/Glas).
2. Backend deployen; nginx reload (Cache-Header).
3. App Store Connect: Paid Agreement, Bank/Steuer, Preis `1,19 EUR`.
4. Optional: Stats-Reset-/Baseline-Endpunkte absichern.
5. Optional: `milestone-22-prep` nach Nutzer-Freigabe auf `main`.
