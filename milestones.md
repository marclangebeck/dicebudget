# Milestones - DiceBudget Strategy Edition

Diese Datei ist ein Kompatibilitaets-Index. Fuer Agent-Uebergaben nicht mehr den langen historischen Stand hier lesen, sondern:

- Aktueller Arbeitsstand: `docs/milestones_active.md`
- Vollstaendige Milestone-Historie: `docs/milestones_archive.md`
- Turnier / Events (Produktfamilie): `docs/tournament/` — `products.md` + Host-App; DiceBudget-Kern unantastbar

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
- Release-Ziel: iOS **2.0 (97)** — `docs/ios_current.md` / `HANDOVER.md`
- Produkt: Strategy Edition, werbefrei, keine Kern-IAP; Hausregeln unter Multi; Multi QR/Link + Raumcode
- Web/API live: https://dicebudget.bottle-trade.de
- iOS: Deployment Target **15.0**; Bundle `de.bottletrade.dicebudget`
- **Tournament / GO:** `docs/tournament/products.md`; Host in `apps/tournament`; GO geplant
- Nach TestFlight-Abnahme 97: **M30** Submit nur mit Nutzer-GO

## Offene Prioritaeten

1. TestFlight **2.0 (97)** hochladen und abnehmen; dann **M30** Submit (Nutzer-GO).
2. Optional M38 Stufe A; **M36** nach M30.
3. `milestone-22-prep` → `main` nach Release-Freigabe.
4. **Events:** Tournament-Host weiter; **GO** erst nach Doku/Store-Klarheit.
