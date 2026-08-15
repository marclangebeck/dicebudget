# Milestones - DiceBudget Strategy Edition

Diese Datei ist ein Kompatibilitaets-Index. Fuer Agent-Uebergaben nicht mehr den langen historischen Stand hier lesen, sondern:

- Aktueller Arbeitsstand: `docs/milestones_active.md`
- Vollstaendige Milestone-Historie: `docs/milestones_archive.md`
- Turnier (Planung): `docs/tournament/` — eigene Host-iPad-App; DiceBudget-Kern unantastbar

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
- `docs/tournament/` (bei Turnier-Themen: README + roadmap; API-Skizze)

## Aktueller Kurzstand

- Branch: `milestone-22-prep`
- Produkt: Multi-QR, M42/M43, 2×/3× Pool 1/n + optionale Gutschrift — siehe `HANDOVER.md` / `git log -1`
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: TestFlight **2.0**, Deployment Target **15.0**
- **Tournament:** nur Doku/Planung unter `docs/tournament/` (kein Produktcode ohne GO)
- Nächstes DiceBudget: **M30** App Store (GO); Turnier-Umsetzung separat nach GO

## Offene Prioritaeten

1. M42/M43 Abnahme / QR-TestFlight; dann **M30**.
2. Optional M38 Stufe A; **M36** nach M30.
3. `milestone-22-prep` → `main` nach Release-Freigabe.
4. **DiceBudget Tournament:** T2/T1 umgesetzt (`apps/tournament`, `/tournaments`); als Nächstes T3 Spieler-Join (GO).
