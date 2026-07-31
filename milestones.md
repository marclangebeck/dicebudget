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
- Produktcode-HEAD: `f5a2665`
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: TestFlight `2.0 (28)`; nächster Upload **`2.0 (29)`** auf HEAD `f5a2665`
- Letzte Features: Auto-Hausregeln (2×/3× / Oberer Bereich), Statistik lokal löschen, Feldeintrag-Perf
- Spezifiziert (kein Code ohne GO): **M37–M41** (Delta, Paarungen, Version, Spalten-Pool, Alle-Fünfe-50); **M36** nach M30

## Offene Prioritaeten

1. Nutzer-Prio M37–M41 (GO je Milestone) — siehe `docs/milestones_active.md`.
2. iOS Build 29 (`npm run build:ios` + Archive + Upload).
3. M30 TestFlight-Regression / App Store Connect.
4. `milestone-22-prep` → `main` nach Release-Freigabe.
