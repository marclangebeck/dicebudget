# DiceBudget Tournament

**Produktname:** DiceBudget Tournament  
**Stand:** 2026-08-18  
**Status:** T0–T3 + Host-Setup + Host-Cockpit (3 Container); T4+ offen  
**Produktfamilie:** [`products.md`](./products.md) — **drei Apps** (DiceBudget · Tournament · GO)

## Vision (kurz)

Jeder mit **DiceBudget Tournament** kann ein **Event** eröffnen — **Liga** (jeder gegen jeden) oder **Turnier** (Gruppen → K.O.). Der Name kommt **vor** dem Format („Name des Events“).

Teilnehmer scannen den QR. Dafür ist **DiceBudget GO** (kostenlos, nur Scan) oder die **bezahlte DiceBudget-App** (Pro, inkl. Event-Beitritt) vorgesehen. Organisation bleibt in Tournament; die DiceBudget-App **hostet keine** Events.

**Live-Stand** (Rankings, Auslosung, Spielplan) läuft über den Server und ist anzeigetauglich. Geräte sprechen **nicht** direkt miteinander: **Host ↔ Server ↔ Teilnehmer-Geräte**.

Beitritte per QR sind später der **abrechenbare** Pfad (Host zahlt je Teilnehmer). Billing folgt extra.

## Rollen

| Rolle | Gerät / App | Aufgabe |
|-------|-------------|---------|
| Host / Organizer | **DiceBudget Tournament** (0 €, Bundle `de.bottletrade.dicebudget.tournament`) | Event anlegen, Format, Größe, QR, Lobby, Auslosung, Live-Anzeige |
| Teilnehmer (Event) | **DiceBudget GO** (0 €, geplant) **oder** **DiceBudget** (1,49 €, `frontend/`) | QR scannen, Partien spielen; GO = nur dieser Pfad |
| Zuschauer / Wand | Host-Display | Rankings, Pairings — ohne Spieleingabe |

Kommunikation: **Host-App ↔ Server ↔ Teilnehmer-Apps** (kein Peer-to-Peer).

## Beitritt (UI, Ist)

Startscreen DiceBudget (zwischen Multi und Solo): zwei Buttons:

1. **Multi-Spiel / Gegner-Raum beitreten** — QR-Scan (aktiv, privates Multi)
2. **Turnier/Liga beitreten** — QR-Scan → `/tournament/join?code=…` (T3)

Umsetzung: `HomeJoinButtons` in `JoinByQrScan.tsx`; Lobby `frontend/app/tournament/join/page.tsx`.  
**DiceBudget GO** existiert noch nicht; nutzt später denselben Join-Pfad.

## Architektur-Annahme

- Monorepo: `frontend/` = DiceBudget; `apps/tournament/` = Host; GO später (gleicher Kern, eigenes Bundle)
- Drei iOS-Apps / drei TestFlight-Einträge (GO noch ohne Bundle im Repo)
- Event-Modi als Strategie: `league` | `turnier` (weitere später)
- API-Vertrag: [`api-sketch.md`](./api-sketch.md)

Details: [`roadmap.md`](./roadmap.md) · Produkte: [`products.md`](./products.md)

---

## Nicht verhandelbar (harte Nebenbedingungen)

1. **DiceBudget darf seine Funktionalität unter keinen Umständen verlieren.**  
   Solo, Multi (QR), Stats, Labs/Hausregeln, Admin bleiben vollwertig **ohne** Event.
2. **Events nur additiv.** Neue Routen, Flags, APIs, optionale UI. Bestehende Flows nicht umbauen oder als Pflichtpfad umleiten.
3. **Getrennte Produkte.** Host = Tournament. Teilnahme = GO und/oder DiceBudget. Pro-App höchstens optionaler Einstieg „Turnier/Liga beitreten“.
4. **Regression vor Merge.** Bestehende Backend-/Frontend-Tests grün; bei riskanten Änderungen Smoke: Solo, Multi-QR, Stats.
5. **Kein Feature-Tausch.** Event-Milestones ersetzen keine DiceBudget-Roadmap (z. B. M30 App Store).
6. **AGENT_RULES gelten weiter.** Kein Polling-/Abuse-Risiko; Live-Updates nur mit klarem, sparsamen Design und Nutzer-GO.

Bei Konflikt zwischen Event-Komfort und DiceBudget-Stabilität gewinnt **immer** DiceBudget.

## Agent-Lesezeichen

1. `AGENT_RULES.md` → `docs/tournament/`
2. `HANDOVER.md`
3. [`products.md`](./products.md) + dieses README + `roadmap.md`
4. Bei Bedarf: `api-sketch.md`, `docs/decisions.md` (Abschnitt Tournament)
