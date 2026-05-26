# AGENT RULES – DICEBUDGET STRATEGY EDITION / SERVER SAFETY

## OBERSTES ZIEL (PRIORITÄT 1)

**Keine Abuse-Sperre durch Netzwerk- oder Hintergrundaktivität.**

Auf dem produktiven Debian-Server (Netcup) laufen mehrere Anwendungen (u. a. bottle-trade.de, skatapp, vanlife). Es gab bereits eine **Abuse-Sperrung** durch den Hoster — sehr wahrscheinlich durch automatische Watcher, Deploy-Loops oder dauerhafte Anfragen.

Diese Regeln haben **immer Vorrang** vor Geschwindigkeit, Komfort und Automatisierung.

Neue Agents lesen zuerst diese Datei, dann **`HANDOVER.md`** (aktueller Stand), danach `projektbeschreibung.md` und `milestones.md`.  
Frontend-Details: `frontend/README.md`. Bei Widersprüchen gilt **`AGENT_RULES.md`**.

---

## 1. KEINE AUTOMATISCHEN SYSTEMÄNDERUNGEN

Ohne **ausdrückliche Freigabe** des Nutzers niemals erstellen, ändern oder starten:

- systemd services / path units
- cronjobs
- pm2 / forever / nohup / Hintergrund-Dauerprozesse
- Docker Autostarts
- Watcher mit Dauerbetrieb (`--watch`, `tsx watch` auf dem Server dauerhaft, `next dev`, `--turbo`)
- Auto-Deploy-Systeme oder Deploy-Schleifen
- Skripte, die in Intervallen gegen localhost oder externe URLs feuern

**Produktion bevorzugen:** statischer Next.js-Export (`frontend/out/`) + Nginx — **kein** Node-Dauerprozess, sofern nicht ausdrücklich freigegeben.

---

## 2. KEINE NETZWERK-SCHLEIFEN ODER SPAM-ANFRAGEN

Niemals starten oder einbauen:

- Endlosschleifen (`while (true)`, rekursive Retries ohne Limit)
- `setInterval` / Polling gegen API oder Domain
- aggressive `curl`/`wget`-Loops oder Health-Check-Hammering
- nmap, masscan, Port-Scans, Lasttests
- automatisierte API-Polling-Schleifen (Multiplayer-Sync nur mit Freigabe und klarem Design)
- Peer-Discovery / P2P

**Erlaubt:** einzelne, gezielte Requests zum manuellen Prüfen (z. B. ein `curl` nach Deploy) — sparsam und nachvollziehbar.

---

## 3. ARBEITSBEREICH (STRICT)

Nur arbeiten innerhalb:

`/home/bottleadmin/projects/kniffel`

**Keine Änderungen** an (ohne Freigabe):

- skatapp, bottle-trade, vanlife-all-in-one und andere Projekte
- globalen nginx-Konfigurationen anderer Sites
- systemweiten Einstellungen
- fremden systemd-Units

**Infra in kniffel** (`infra/nginx`, `infra/scripts`): nur mit Freigabe und minimal; Nginx/Systemd auf dem Server nur nach dokumentiertem Deploy und mit `sudo` durch den Nutzer, wenn der Agent kein sudo hat.

---

## 4. PROJEKTSTRUKTUR

```
kniffel/
├── backend/      # Express API (Port 3020, nur bei Bedarf starten)
├── frontend/     # Next.js (Dev 3021; Produktion: static export → out/)
├── public/       # Legacy-Testseite (nicht Produktions-Frontend)
├── infra/        # Nginx, Deploy-Skripte
├── HANDOVER.md
├── projektbeschreibung.md
├── milestones.md
└── CHANGELOG.md
```

- Keine Drive-by-Refactors in fremden Ordnern
- Jede Änderung in `CHANGELOG.md` dokumentieren
- Bestehende Dateien nicht blind überschreiben
- UI-Stand (Mai 2026): Bento-Start (`HomeBentoGrid`), Spielzettel ohne Seiten-Scroll (`/play` + `FitScoreSheet`) — siehe Milestone 20 in `milestones.md`

---

## 5. KEINE DAUERPROZESSE / WATCHER AUF DEM SERVER

Niemals im Agent-Betrieb auf dem Server ausführen oder laufen lassen:

- `npm run dev` / `tsx watch` als Dauerbetrieb
- `next dev` mit Hot Reload dauerhaft
- File-Watcher, turbo watch, Auto-Rebuild-Loops
- Hintergrund-`curl`-Jobs zur „Überwachung“ der Domain

**Entwicklung:** nur manuell durch den Nutzer, danach mit `Ctrl+C` beenden.

**Deploy:** `infra/scripts/deploy-prod.sh` (Frontend + Backend + Nginx) — manuell, nicht in Schleifen.  
Alternativ: `deploy-backend-prod.sh` / `deploy-frontend-prod.sh` getrennt.  
Frontend-Build braucht `frontend/.env.production` (`NEXT_PUBLIC_API_URL`).  
Backend-Produktion: `kniffel-backend.service` mit `Restart=on-failure` (nur nach ausdrücklichem Deploy-GO).

---

## 6. STANDARDVORGEHEN

1. Problem analysieren  
2. Ursache kurz erklären  
3. Lösung vorschlagen (kleine Inkremente, 1–5 Teilschritte)  
4. Betroffene Dateien exakt benennen  
5. **GO** des Nutzers einholen — dann umsetzen  

Keine waghalsigen Massenänderungen. Milestones in kleinen Batches, dann Pause auf GO.

---

## 7. BUILD / RUN (MANUELL)

```bash
# Backend (nur wenn nötig, danach beenden)
cd backend && npm install && npm run dev

# Frontend lokal testen (danach beenden)
cd frontend && npm install && npm run dev

# Produktion Domain (einmalig, mit sudo durch Nutzer)
sudo bash infra/scripts/deploy-frontend-prod.sh
```

Kein `npm run dev` als Server-Dauerbetrieb. Kein `Restart=always` ohne ausdrückliche Freigabe.

---

## 8. DOMAIN & PORTS

| Dienst | Port | Produktion |
|--------|------|------------|
| Backend API | 3020 | nur bei Bedarf, nicht dauerhaft exponieren ohne Konzept |
| Frontend Dev | 3021 | nur Entwicklung |
| https://dicebudget.bottle-trade.de | 443 | Nginx → `frontend/out/` (statisch) |

Nginx- oder Certbot-Änderungen: minimal, andere VHosts nicht anfassen.

---

## 9. ZUSAMMENFASSUNG FÜR AGENTS

| Verboten | Erlaubt |
|----------|---------|
| Polling, Loops, Dauer-HTTP | Einzelne, begründete Requests |
| Watcher / dev dauerhaft auf Server | Manueller dev, dann stoppen |
| systemd/cron ohne GO | Statischer Export + Nginx |
| Änderungen außerhalb `kniffel/` | Kleine Inkremente + CHANGELOG |

**Bei Unsicherheit: stoppen und den Nutzer fragen — nicht automatisch weiterdrehen.**
