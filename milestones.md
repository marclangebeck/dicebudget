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
- Produktcode-HEAD: `3e9d9a8` (M42/M43) · Tip `b8a9d79`
- Web/API live: https://dicebudget.bottle-trade.de
- Frontend-Tests: **98** grün
- iOS: TestFlight **2.0** (Builds ~51+); Admin = PIN + lokaler Key (ein Build)
- Letzte Features: M42 Rival-Avatare; M43 Admin-PIN; heller Spielzettel; Rivalen-Share; Gold-Aufleuchten; M37–M41
- Nächstes: M42/M43 Abnahme / iOS-Build, dann **M30** App Store Release

## Offene Prioritaeten

1. M42/M43 Abnahme; frischer `build:ios` mit `NEXT_PUBLIC_ADMIN_PIN`.
2. **M30** TestFlight-Regression + App Store Connect (Agreement, 1,19 €, Submit).
3. Optional M38 Stufe A nur bei Drift; **M36** nach M30.
4. `milestone-22-prep` → `main` nach Release-Freigabe.
