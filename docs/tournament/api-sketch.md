# Tournament API-Skizze (Entwurf)

**Stand:** 2026-08-15  
**Status:** T1 API umgesetzt (`/tournaments`); Host-UI in `apps/tournament`. Skizze bleibt Referenz für T3+.

Ziel: Vertrag zwischen **DiceBudget Tournament** (Host) und **Teilnehmer-Apps** (**DiceBudget** Pro und später **DiceBudget GO**).  
Bestehende Multi-Session-API (`/sessions`, Invite-QR) bleibt für Partien; das Event **orchestriert** darüber. Produktrollen: [`products.md`](./products.md).

## Begriffe

| Begriff | Bedeutung |
|---------|-----------|
| Tournament | Container: Spieler, Status, gewählter Modus + Parameter |
| Entry | Angemeldeter Spieler (Display-Name, Gerät/Player-Id) |
| Round | Runde im Turnier (nicht identisch mit einer DiceBudget-Session) |
| Pairing / Table | Geplante Begegnung an einem Tisch |
| Match | Konkrete DiceBudget-Multi-Session, verknüpft mit einem Pairing |
| Standing / Bracket | Modus-Ausgabe (Tabelle oder KO-Baum) |

## Grobe Ressourcen (Namen vorläufig)

```
POST   /tournaments                     # Host: anlegen (Modus-Key + Config)
GET    /tournaments/:id                 # Stand + Meta
POST   /tournaments/:id/join            # Spieler: Join per Code/Token aus QR
GET    /tournaments/:id/entries
POST   /tournaments/:id/rounds          # nächste Runde / Auslosung anstoßen
GET    /tournaments/:id/pairings
POST   /tournaments/:id/pairings/:pid/start-match   # → erzeugt/verknüpft Session-Invite
POST   /tournaments/:id/pairings/:pid/result        # Ergebnis übernehmen (oder aus Session lesen)
GET    /tournaments/:id/standings       # oder /bracket — modusabhängig
GET    /tournaments/:id/display         # Beamer-freundliches Snapshot
```

QR-Payload (Idee): URL auf DiceBudget-Domain, z. B.  
`https://dicebudget.bottle-trade.de/tournament/join?code=…`  
(analog zu Multi-Join; **neue Route**, bestehendes `/multi/join` unangetastet).

## Modus als Strategie

```
modeKey: "league" | "turnier" | …   // erweiterbar (UI: Liga / Turnier)
config:  { … }                        // modus-spezifisch, validiert serverseitig
```

Kern-API liefert Pairings und Standings; Modus-Plugins berechnen Auslosung und Ranking.

## Live-Updates (Prinzip)

- Kein aggressives Polling (AGENT_RULES).  
- Skizze: Host/Display und Spieler holen Snapshot bei Ereignis (Runde gestartet, Ergebnis gemeldet) oder sehr sparsames Intervall nur mit ausdrücklichem GO.  
- Optional später: Server-Sent Events — nur nach Freigabe.

## Abgrenzung DiceBudget

| Bleibt wie bisher | Neu / optional |
|-------------------|----------------|
| `/multi`, Solo, Stats, Labs in **DiceBudget** | `/tournament/…` Join nur nach QR-Scan |
| Multi-Invite-QR | Event-QR (Liga/Turnier) |
| Session-Finalize / Pairing-Stats | Event-Standing separat |
| — | später: Join als Abrechnungs-Hook; **GO** nur Event-Join |

## Offene Fragen (später)

- Auth Organizer (Gerät-PIN vs. Account)  
- Ob Ergebnis nur aus Session gelesen oder Host manuell korrigieren darf  
- Mehrere Partien parallel vs. ein Tisch nach dem anderen  
- Abrechnung am Join (Host zahlt je Eintrag)  
- Gleiche Join-API für DiceBudget und GO

Nächste Schärfung: ein Mini-Szenario „8 Spieler, 4 Tische, 3 Liga-Runden“ durch diese Ressourcen spielen.
