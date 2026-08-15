# DiceBudget Tournament

**Produktname:** DiceBudget Tournament  
**Stand:** 2026-08-15  
**Status:** T0–T2 umgesetzt (API + Host-Skelett); weitere Milestones offen  
**Bezug:** Spieler-App = dieses Repo (`frontend/`, Bundle `de.bottletrade.dicebudget`)

## Vision (kurz)

Jeder mit **DiceBudget Tournament** kann ein Turnier eröffnen — privat, Verein, Event, Betrieb, Freundeskreis. Spieler nutzen die **DiceBudget**-App, melden sich per **QR** an und spielen z. B. Liga- oder KO-Runden. **Live-Stand** (Rankings, Auslosung, Spielplan, Ergebnisse) läuft in der App und ist **anzeigetauglich** (Tablet, TV, Beamer). Alles konfigurierbar.

## Rollen

| Rolle | Gerät / App | Aufgabe |
|-------|-------------|---------|
| Host / Organizer | **DiceBudget Tournament** (eigene App, getrenntes Bundle / TestFlight) | Turnier anlegen, Modi/Parameter, Auslosung, Spielplan, Live-Anzeige, Steuerung |
| Spieler | **DiceBudget** (bestehende App) | per QR beitreten, Partien spielen, eigenen Kontext sehen |
| Zuschauer / Wand | Host-Display oder Anzeige-Ansicht | Rankings, Pairings, nächste Runde — ohne Spieleingabe |

Kommunikation: **iPad-Host ↔ Server ↔ Spieler-Apps** (kein Peer-to-Peer).

## Beitritt in der Spieler-App (UI)

Startscreen-Mitte (zwischen Multi und Solo): **zwei Halbbreiten-Buttons** nebeneinander, jeweils gesamter Container = Aktion:

1. **Multi-Spiel / Gegner-Raum beitreten** — QR-Scan (bestehend, aktiv)
2. **Turnier beitreten** — QR-Scan (Platzhalter `disabled` / „Demnächst“, Funktion folgt mit T3)

Umsetzung: `HomeJoinButtons` in `JoinByQrScan.tsx`.

## Architektur-Annahme (Start)

- **Monorepo-Light** in diesem Repo: Doku jetzt; später z. B. `apps/tournament` (Host) neben `frontend/` (Spieler)
- **Zwei iOS-Apps / zwei Builds / zwei TestFlight-Einträge**
  - Spieler: `de.bottletrade.dicebudget`
  - Host (Vorschlag): `de.bottletrade.dicebudget.tournament`
- Turnier-Modi **breit** gedacht (Plugin/Strategie); konkrete Modi Milestone für Milestone
- API-Vertrag zwischen Host und Spieler-App dokumentieren, bevor große UI entsteht

Details: [`roadmap.md`](./roadmap.md) · API-Skizze: [`api-sketch.md`](./api-sketch.md)

---

## Nicht verhandelbar (harte Nebenbedingungen)

1. **DiceBudget darf seine Funktionalität unter keinen Umständen verlieren.**  
   Solo, Multi (QR), Stats, Labs/Hausregeln, Admin, iOS-Spieler-App bleiben vollwertig und nutzbar **ohne** Turnier.
2. **Turnier nur additiv.** Neue Routen, Flags, APIs, optionale UI. Bestehende Flows nicht umbauen oder als Pflichtpfad umleiten.
3. **Getrennte Produkte auf dem Gerät.** Host = **DiceBudget Tournament**; Spieler-App erhält höchstens einen optionalen Einstieg („Turnier beitreten“).
4. **Regression vor Merge.** Bestehende Backend-/Frontend-Tests grün; bei riskanten Änderungen Smoke: Solo, Multi-QR, Stats.
5. **Kein Feature-Tausch.** Turnier-Milestones ersetzen keine DiceBudget-Roadmap (z. B. M30 App Store).
6. **AGENT_RULES gelten weiter.** Kein Polling-/Abuse-Risiko; Live-Updates nur mit klarem, sparsamen Design und GO.

Bei Konflikt zwischen Turnier-Komfort und DiceBudget-Stabilität gewinnt **immer** DiceBudget.

## Agent-Lesezeichen

Neue Agents bei Turnier-Themen:

1. `AGENT_RULES.md` → Punkt `docs/tournament/`
2. `HANDOVER.md` (Regeln + Übergabe-Prompt)
3. Dieses README + `roadmap.md`
4. Bei Bedarf: `api-sketch.md`, `docs/decisions.md` (Abschnitt Tournament)
