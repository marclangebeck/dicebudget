# Tournament API — Vertrag & Ist-Stand

**Stand:** 2026-08-19  
**Status:** T1–T6 **umgesetzt**. Diese Datei dokumentiert die **laufende API**; ältere Skizzen-Ressourcen sind durch die Ist-Routen ersetzt.

Ziel: Vertrag zwischen **DiceBudget Tournament** (Host) und **Teilnehmer-Apps** (DiceBudget Pro, später GO). Partien laufen über **`/sessions`** (Multi); das Event **orchestriert** Matches und Tabellen.

## Begriffe

| Begriff | Bedeutung |
|---------|-----------|
| Tournament | Container: Spieler, Status, Modus + Config |
| Entry | Angemeldeter Spieler (`displayName`, `playerId`) |
| Round | Spielplan-Runde (DB: `tournament_rounds`) |
| Match | Paarung + optional verknüpfte `GameSession` |
| Group / Standing | Gruppe + Tabelle (Liga oder Turnier-Gruppenphase) |
| Release-Welle | Schrittweise Freigabe des Spielplans (`_schedulePlan` in Config) |

## Implementierte Routen

Basis: **`/tournaments`** (Prod: `https://dicebudget.bottle-trade.de/api/tournaments`)

| Methode | Pfad | Auth | Beschreibung |
|---------|------|------|--------------|
| POST | `/tournaments` | — | Event anlegen → `{ tournament, hostToken }` |
| GET | `/tournaments/invite/:inviteCode` | optional `X-Host-Token` | Snapshot; Host sieht `drawPreview` (OPEN), alle sehen `scheduleMeta` |
| POST | `/tournaments/invite/:code/join` | — | Teilnehmer beitreten |
| POST | `/tournaments/:id/start` | `X-Host-Token` | Start: Gruppen + Welle 1 |
| POST | `/tournaments/:id/draw` | `X-Host-Token` | Body `{ action: "prepare" \| "shuffle" }` |
| PATCH | `/tournaments/:id/draw` | `X-Host-Token` | `swapSides`, `homeEntryId`/`awayEntryId`, oder `assignPlayer` |
| POST | `/tournaments/:id/rounds` | `X-Host-Token` | Nächste Spielplan-Welle freigeben |
| POST | `/tournaments/:id/matches/:matchId/session` | `X-Host-Token` | Multi-Session erzeugen → `{ sessionInviteCode, joinPath }` |

**Ergebnisübernahme:** kein separates `POST …/result` — Session-Finalize schreibt in `tournamentMatch` (LEAGUE/GROUP/KO).

**Rate-Limits:** nur auf POST (Anlegen/Join), nicht auf GET-Lesen.

## QR & Join-URLs

| Ziel | URL |
|------|-----|
| Event beitreten (Teilnehmer) | `https://dicebudget.bottle-trade.de/tournament/join?code=EVENTCODE` |
| Partie spielen (Multi) | `https://dicebudget.bottle-trade.de/multi/join?code=SESSIONCODE` |

Host-QR im Cockpit zeigt die **Event-Join-URL**.

## Config & Spielplan

`POST /tournaments` Body (Auszug):

```json
{
  "name": "Freitag in der Kneipe",
  "modeKey": "league",
  "maxEntries": 16,
  "config": {
    "rounds": 3,
    "gameCount": 1,
    "useStrategyRules": true,
    "houseRules": { }
  }
}
```

Turnier (`modeKey: "turnier"`): `groupSize`, `qualifyPerGroup` (1|2), `knockout: "single"`.

Intern: vollständiger Spielplan in `config._schedulePlan` (Gruppen, Runden, Paarungen, `releasedWave`). Nicht über `normalizeTournamentConfig` — nur Persistenz.

## Modus-Verhalten

| Modus | Phasen | Abschluss |
|-------|--------|-----------|
| **league** | `LEAGUE`, Round-Robin × `config.rounds` | `FINISHED` wenn alle Liga-Matches fertig |
| **turnier** | `GROUP` → auto **KO** (+ optional Platz 3) | KO-Finale → `FINISHED` |

KO-Bracket wird erzeugt, wenn **alle Gruppen-Matches** `FINISHED` sind.

## Live-Updates

- GET `/tournaments/invite/:code` — kein Rate-Limit; Client-Refresh sparsam (45 s / 20 s).
- `scheduleMeta`: `{ releasedWave, totalWaves, hasMoreRounds }` für Beamer/Host.
- Auto-Freigabe nächste Welle, wenn alle Matches der aktuellen Welle `FINISHED`.

## Abgrenzung DiceBudget

| Unverändert | Event (additiv) |
|-------------|-----------------|
| `/runs`, `/sessions`, Solo, Multi-QR, Stats | `/tournaments/*` |
| Session-Finalize, Pairing-Stats | Event-Standing + Match-Verknüpfung |
| PlayBoard ohne Polling | `/tournament/join` mit sanftem Refresh |

## Bewusst offen (T9+)

- Organizer-Accounts (PIN vs. Login)
- Host manuelles Ergebnis-Korrigieren
- SSE / Push statt Refresh
- Abrechnung pro Join
- DiceBudget GO als dritte App
