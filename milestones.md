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
- Produktcode-HEAD: Commit-Batch 2026-06-10 auf `milestone-22-prep` (Parent `b17b9f5`)
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: TestFlight `2.0 (25)`, naechster Upload `2.0 (26)`
- Letzte Features (`f29cf7d` … `b17b9f5` + ausstehend): Code nur teilen, Vollbild-Erfolge, DiceBudget-Branding, Card-Dashboards, Footer-Menü/Screenshot, Startscreen-Arena, nginx Cache.

## Offene Prioritaeten

1. Commit/Push ausstehender Aenderungen; Frontend-Build auf dem Server.
2. nginx reload (Cache-Header).
3. Backend deployen (Coaching-API + `scoreProgression` + Migration `extra_yatzy_die_values`).
4. iOS-Build `2.0 (26)` auf dem Mac bauen und hochladen (Mac-Befehle in `HANDOVER.md` und `docs/ios_current.md`).
5. App Store Connect: Paid Agreement, Bank/Steuer, Preis `1,19 EUR`.
6. TestFlight auf iPhone und iPad pruefen (Arena-Startscreen, Footer/Menü).
7. Optional: Stats-Reset-/Baseline-Endpunkte absichern.
8. Optional: `milestone-22-prep` nach Nutzer-Freigabe auf `main`.
