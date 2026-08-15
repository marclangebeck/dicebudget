# DiceBudget Tournament — Roadmap

**Produktname:** DiceBudget Tournament  
**Stand:** 2026-08-15  
**Produktprinzipien:** [`README.md`](./README.md) (inkl. harter Nebenbedingungen)

DiceBudget-Spieler-App bleibt unangetastet in der Kernfunktion; **DiceBudget Tournament** (Host-iPad) wird **daneben** aufgebaut.

## Modi (breit, später konkret)

Der Kern soll **viele Turnierformate** tragen können (Liga, KO, später z. B. Schweizer System, Gruppen+KO, feste Tische, …).  
Konkrete Modus-Liste und Regeldetails kommen **pro Milestone**, nicht als Startblocker. Architektur: Turnier-Container + austauschbare Modus-Strategie.

## Milestones

| ID | Milestone | Ziel | Hinweis |
|----|-----------|------|---------|
| **T0** | Vision & Vertrag | Docs, Rollen, API-Skizze, Name **DiceBudget Tournament** | erledigt |
| **T1** | Backend Turnier-Kern | Turnier anlegen, Join-Code/QR-Payload, Spieler-Liste, Status | **umgesetzt** (`/tournaments`) |
| **T2** | Host-App Skelett | `apps/tournament`, Capacitor Bundle `de.bottletrade.dicebudget.tournament`, Start/Host-Lobby | **umgesetzt** (iOS `cap add` auf Mac) |
| **T3** | Spieler-Anbindung | Optional: Turnier per QR in DiceBudget; Anzeige Tisch/Runde | **additiv**; Startscreen-Button aktivieren |
| **T4** | Spielplan & Auslosung | Tische/Paarungen, manuell + einfache Auto-Auslosung | Modus-agnostische Pairing-API |
| **T5** | Partie-Link | Host startet Tisch → bestehende Multi-Session; Ergebnis zurück ins Turnier | Multi-Kern wiederverwenden, nicht forken |
| **T6** | Live & Beamer | Ranking/Spielplan-Ansicht; sparsame Updates | kein Polling-Spam (AGENT_RULES) |
| **T7** | Erster Tabellen-Modus | z. B. Liga über mehrere Runden | erster Modus-Plugin-Beweis |
| **T8** | Erster KO-Modus | Bracket, Weiterkommen, Freilose | zweiter Modus-Beweis |
| **T9** | iOS Host Release | Eigenes TestFlight, Checkliste, getrennt von DiceBudget | zwei Uploads / zwei Apps |
| **T10** | Feld-Pilot | Echtes Turnier (beliebiger Host), Feedback, Härten | danach weitere Modi |

## Reihenfolge

`T0 → T1 → T2 → T3 → T4 → T5 → T6 → (T7 ∥ T8) → T9 → T10`

T7/T8 können nach dem Kern parallel oder nacheinander kommen; weitere Modi danach als Tn+.

## Abnahme je Milestone (Minimum)

- [ ] DiceBudget ohne Turnier: Smoke Solo + Multi-QR + Stats (wo relevant)
- [ ] Bestehende Unit-Tests grün
- [ ] CHANGELOG-Eintrag
- [ ] Keine neuen Dauer-Polling-Schleifen

## Bewusst später

- finales Host-Branding / Pixel-Design  
- volle Modus-Bibliothek  
- Organizer-Accounts (PIN vs. Login)  
- Zuschauer-Web ohne App  

## Nächster Schritt

**Host-Setup-Wizard** (schrittweise): Start = Name → Turniereinstellungen; weitere Schritte folgen einzeln.  
**T3** (wenn an der Reihe): Spieler-App „Turnier beitreten“ an Join-API.  
iOS Host: auf dem Mac `cd apps/tournament && npm run build:ios`.
