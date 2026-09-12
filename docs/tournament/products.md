# Produktfamilie — drei Apps

**Stand:** 2026-08-17  
**Status:** Produktentscheidung (Doku); **DiceBudget GO** ist noch nicht im Code  
**Schreibweise:** **Tournament** (nicht „Tournement“). **DiceBudget GO** = App-Name; nicht verwechseln mit Nutzer-**GO** (Freigabe in `AGENT_RULES`).

Es gibt **drei** Produkte. Events (Liga oder Turnier) werden in der **Organisations-App** eingerichtet; Mitspielen geht über **GO** oder die **bezahlte DiceBudget-App**.

## Die drei Apps

| App | Preis (Ziel) | Rolle | Bundle (Ist / Vorschlag) | Code |
|-----|----------------|-------|--------------------------|------|
| **DiceBudget** | App-Kauf (Store-Preis) | Pro: Solo, Multi, Stats, Strategy/Hausregeln — **und** Teilnahme an Liga/Turnier; werbefrei, keine Kern-IAP | `de.bottletrade.dicebudget` | `frontend/` |
| **DiceBudget Tournament** | 0 € | Organisation: Event anlegen, QR, Lobby, Auslosung, Live-Anzeige | `de.bottletrade.dicebudget.tournament` | `apps/tournament/` |
| **DiceBudget GO** | 0 € | Nur Teilnahme an Liga/Turnier (QR-Scan). Kein Komfort, restliche Features gesperrt | Vorschlag: `de.bottletrade.dicebudget.go` | **geplant** (eigene App, möglichst gleicher Kern wie DiceBudget) |

## Wer macht was

1. **Host** nutzt **DiceBudget Tournament** (Kneipe, Club, privat, Verein, …). Nach dem Event-Namen entscheidet sich das Format: **Liga** (jeder gegen jeden) oder **Turnier** (Gruppen-Vorrunde → Qualifikation → K.O.).
2. **Teilnehmer** scannen den QR. Dafür brauchen sie **DiceBudget GO** oder die **bezahlte DiceBudget-App**. In der Pro-App ist Event-Beitritt ein Feature neben Solo/Multi; in GO ist es **das einzige** offene Feature.
3. **Kommunikation** läuft **Gerät ↔ Server ↔ Host**, nicht Peer-to-Peer.

## Geschäftsmodell (Absicht)

- **Tournament** wird in Kneipen, Spieleclubs usw. gezeigt — Einstieg ohne App-Kauf für den Organizer.
- **Beitritte** (QR-Scan) sind der geldrelevante Pfad: z. B. 30 Teilnehmer → Host zahlt entsprechend. Billing ist **noch nicht** implementiert; Join muss später abrechenbar sein.
- **GO** senkt die Hürde beim Event. Wer privat weiterspielen will, kauft **DiceBudget** (Upsell / Umwandlung GO → Pro).

## GO vs. DiceBudget (Teilnahme)

- **GO** sieht aus wie DiceBudget, aber **alle Komfort-Features sind gesperrt** außer Scan für Turnier/Liga.
- **Umwandlung:** GO soll **kostenpflichtig** in die volle DiceBudget-App überführt werden können (Store-Kauf oder In-App — technisch noch offen).
- **Pro** darf Events ebenfalls beitreten (Liga- und Turnier-Modus in der bezahlten App). Pro **hostet nicht** — Host bleibt Tournament.

## Was schon da ist / was fehlt

| Thema | Stand |
|-------|--------|
| Tournament-Host (Setup, Anlegen, Lobby/QR) | Wizard; nach Anlegen 3-Container-Cockpit (`apps/tournament`) |
| Backend `/tournaments` | da (Join-API + Spieler-UI in Pro) |
| DiceBudget Startscreen „Turnier/Liga beitreten“ | **aktiv** (T3 → `/tournament/join`) |
| DiceBudget GO | **nicht** angelegt |
| Abrechnung je Beitritt | **nicht** angelegt |
| Upgrade GO → DiceBudget | **nicht** angelegt |

## Harte Regeln

1. **DiceBudget-Kern unantastbar.** Solo, Multi, Stats, Strategy/Hausregeln, Admin bleiben voll nutzbar **ohne** Event.
2. Events nur **additiv**. Keine Pflichtumleitung bestehender Flows.
3. Drei getrennte Store-Produkte; Builds nicht vermischen. `npm run build:ios` in `frontend/` erzeugt **nicht** Tournament und **nicht** GO.
4. GO möglichst **derselbe Kern** wie DiceBudget (Flags / locked Shell), keine dritte Spiel-Engine.
5. Bei Konflikt Event-Komfort vs. DiceBudget-Stabilität gewinnt **DiceBudget**.

Offene Store-/Upgrade-Details: später in `docs/decisions.md`. Roadmap: [`roadmap.md`](./roadmap.md).
