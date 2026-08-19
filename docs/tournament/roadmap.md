# DiceBudget Tournament — Roadmap

**Produktname:** DiceBudget Tournament  
**Stand:** 2026-08-19  
**Produktprinzipien:** [`README.md`](./README.md) · Produktfamilie: [`products.md`](./products.md)

**DiceBudget** (Pro) bleibt in der Kernfunktion unantastbar. **Tournament** (Host) und später **DiceBudget GO** (nur Event-Teilnahme) stehen **daneben**. Hosten nur Tournament; Mitspielen GO oder Pro.

## Modi (breit, später konkret)

Der Kern soll **viele Formate** tragen können (**Liga**, **Turnier**, später z. B. Schweizer System, Gruppen+Finale, feste Tische, …).  
Konkrete Modus-Liste und Regeldetails kommen **pro Milestone**, nicht als Startblocker. Architektur: Turnier-Container + austauschbare Modus-Strategie.

## Milestones

| ID | Milestone | Ziel | Hinweis |
|----|-----------|------|---------|
| **T0** | Vision & Vertrag | Docs, Rollen, API-Skizze, Name **DiceBudget Tournament** | erledigt |
| **T1** | Backend Turnier-Kern | Turnier anlegen, Join-Code/QR-Payload, Spieler-Liste, Status | **umgesetzt** (`/tournaments`) |
| **T2** | Host-App Skelett | `apps/tournament`, Capacitor Bundle `de.bottletrade.dicebudget.tournament`, Start/Host-Lobby | **umgesetzt** (iOS `cap add` auf Mac) |
| **T3** | Teilnehmer-Join | QR in **DiceBudget** (Pro-Button aktivieren); später gleiches in **GO** | **umgesetzt** (Pro); GO-App extra Track |
| **T4** | Spielplan & Auslosung | Tische/Paarungen, manuell + einfache Auto-Auslosung | **umgesetzt** (Vorschau, Shuffle, Spielertausch, Wellen) |
| **T5** | Partie-Link | Host startet Tisch → bestehende Multi-Session; Ergebnis zurück ins Turnier | **umgesetzt** |
| **T6** | Live & Beamer | Ranking/Spielplan-Ansicht; sparsame Updates | **umgesetzt** (45s/20s Refresh) |
| **T7** | Erster Tabellen-Modus | z. B. Liga über mehrere Runden | **Backend + Host** (Feinschliff offen) |
| **T8** | Erster Turnier-Modus | Bracket, Weiterkommen, Freilose | **Backend KO** (UI-Feinschliff offen) |
| **T9** | iOS Host Release | Eigenes TestFlight, getrennt von DiceBudget | Host-Upload; GO separat |
| **T10** | Feld-Pilot | Echtes Turnier (beliebiger Host), Feedback, Härten | danach weitere Modi |

## Reihenfolge

`T0 → T1 → T2 → T3 → T4 → T5 → T6 → (T7 ∥ T8) → T9 → T10`

T7/T8 können nach dem Kern parallel oder nacheinander kommen; weitere Modi danach als Tn+.

## Abnahme je Milestone (Minimum)

- [x] DiceBudget ohne Turnier: Smoke Solo + Multi-QR + Stats (wo relevant)
- [x] Bestehende Unit-Tests grün (Backend Tournament-Tests)
- [x] CHANGELOG-Eintrag ([Unreleased])
- [x] Kein aggressives Polling (45 s / 20 s mit Nutzer-GO dokumentiert)

## Bewusst später

- finales Host-Branding / Pixel-Design  
- volle Modus-Bibliothek  
- Organizer-Accounts (PIN vs. Login)  
- Zuschauer-Web ohne App  
- **DiceBudget GO** als dritte App (Bundle, Store, Upgrade → Pro)  
- Abrechnung je QR-Beitritt  

## Nächster Schritt

**T9** iOS Host Release (TestFlight) und **T10** Feld-Pilot mit echten Teilnehmern.  
Vorher einmal Deploy + Smoke (Backend `deploy-backend-prod.sh`, Frontend-Build).  
**DiceBudget GO** erst nach stabilem Feld-Pilot.  
iOS Host: `cd apps/tournament && npm run build:ios` (Mac).  
Pro: `cd frontend && npm run build:ios` (Mac) für Event-Join Universal Links.
