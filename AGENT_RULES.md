# AGENT RULES – DICEBUDGET STRATEGY EDITION / SERVER SAFETY

## OBERSTES ZIEL (PRIORITÄT 1)

**Keine Abuse-Sperre durch Netzwerk- oder Hintergrundaktivität.**

Auf dem produktiven Debian-Server (Netcup) laufen mehrere Anwendungen (u. a. bottle-trade.de, skatapp, vanlife). Es gab bereits eine **Abuse-Sperrung** durch den Hoster — sehr wahrscheinlich durch automatische Watcher, Deploy-Loops oder dauerhafte Anfragen.

Diese Regeln haben **immer Vorrang** vor Geschwindigkeit, Komfort und Automatisierung.

Neue Agents lesen standardmäßig nur:

1. **`AGENT_RULES.md`**
2. **`HANDOVER.md`**
3. **`docs/milestones_active.md`**

Nur bei Bedarf zusätzlich:

4. **`docs/ios_current.md`** (iOS/TestFlight/App Store)
5. **`docs/decisions.md`** (dauerhaft gültige Architektur- und Betriebsentscheidungen)
6. **`docs/milestones_archive.md`** (ältere Milestone-Historie)
7. **`docs/ios_archive.md`** (ältere iOS-/TestFlight-Historie)
8. **`docs/tournament/`** (Turnier-Host-App Planung; DiceBudget-Kern bleibt unantastbar)

Frontend-Details: `frontend/README.md`. Fachliche Spezifikation: `projektbeschreibung.md`. Bei Widersprüchen gilt **`AGENT_RULES.md`**.

**Aktiver Git-Branch:** `milestone-22-prep` auf `github.com/marclangebeck/dicebudget`

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
├── frontend/     # Next.js Spieler-App (Dev 3021; Produktion: static export → out/)
├── apps/
│   └── tournament/  # DiceBudget Tournament Host (Dev 3022; eigenes iOS-Bundle)
├── public/       # Legacy-Testseite (nicht Produktions-Frontend)
├── infra/        # Nginx, Deploy-Skripte
├── HANDOVER.md
├── projektbeschreibung.md
├── milestones.md          # Kompatibilitäts-Index
├── CHANGELOG.md
└── docs/
    ├── milestones_active.md
    ├── milestones_archive.md
    ├── ios_current.md
    ├── ios_archive.md
    ├── decisions.md
    └── tournament/          # Turnier-Host Planung (README, roadmap, api-sketch)
```

- Keine Drive-by-Refactors in fremden Ordnern
- Jede Änderung in `CHANGELOG.md` dokumentieren
- Bestehende Dateien nicht blind überschreiben
- UI-Stand (Mai 2026): Bento-Start (`HomeBentoGrid`), Spielzettel ohne Seiten-Scroll (`/play` + `FitScoreSheet`) — aktueller Stand in `docs/milestones_active.md`, Historie in `docs/milestones_archive.md`

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

## 9. ABGLEICH-WORKFLOW: GIT + SERVER + LOKAL (PFLICHT)

Der Nutzer will **nach jeder Code-Änderung**, dass **GitHub, Server und lokaler Mac auf demselben Stand** sind. Der Agent arbeitet **direkt auf dem Server** (`/home/bottleadmin/projects/kniffel`); der Mac ist ein **getrennter Git-Clone**, auf den der Agent **keinen Zugriff** hat.

**Commit + Push automatisch (Pflicht):** Nach jedem abgeschlossenen Auftrag mit Dateiänderungen **sofort** `git commit` + `git push` — **ohne** extra Nutzer-GO für Git. Ausnahme nur bei ausdrücklichem „nicht pushen“ oder reiner Analyse ohne Änderungen. Feature-/Deploy-GO (§6) bleibt für *Start* größerer Arbeiten und sudo-Deploy; der Git-Sync danach ist Standard.

**Regel für die Kommunikation:** Bei jeder Änderung dem Nutzer **immer** eine **nummerierte Reihenfolge mit kopierbaren Befehlen** ausgeben, jeweils markiert mit **[Server]** (macht der Agent) oder **[Mac]** (macht der Nutzer). Schritte mit `sudo` sind **immer Nutzer-Aufgabe** (Agent hat kein sudo). Keine Inline-Kommentare (`#`) in kopierbaren Befehlen (Mac-Shell interpretiert sie sonst falsch).

**Standard-Reihenfolge nach einer Code-Änderung:**

1. **[Server] GitHub aktualisieren** (Agent, automatisch nach Auftrag):

```bash
cd /home/bottleadmin/projects/kniffel
git add -A && git commit -m "..." && git push origin milestone-22-prep
```

2. **[Server] bauen** (Agent) — nur was geändert wurde:

```bash
cd /home/bottleadmin/projects/kniffel/backend && npm run build
cd /home/bottleadmin/projects/kniffel/frontend && npm run build
```

Frontend-`out/` wird von Nginx direkt ausgeliefert → **kein sudo, sofort live**.

3. **[Server] Backend deployen / neu starten** (Nutzer per SSH auf dem Server, sudo):

```bash
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
```

Nicht auf dem Mac ausführen (Pfad `/home/bottleadmin/…` existiert dort nicht). Reine Frontend-Änderungen brauchen **keinen** Backend-Neustart. Prüfen: neuer Endpunkt liefert nach Neustart z. B. `404` mit JSON statt Route-Fehler.

4. **[Mac] lokal nachziehen** (Nutzer):

```bash
cd /Users/marclangebeck/projects/kniffel
git pull origin milestone-22-prep
```

Bei Pull-Konflikt durch Xcode-Änderung an der Projektdatei vorher:

```bash
git restore frontend/ios/App/App.xcodeproj/project.pbxproj
git pull origin milestone-22-prep
```

5. **[Mac] iOS-Build (nur wenn ein App-Build gewünscht ist)** (Nutzer):

```bash
cd /Users/marclangebeck/projects/kniffel/frontend
npm run build:ios
brew unlink rsync
```

`build:ios` öffnet auf dem Mac danach automatisch Xcode (`npm run open:ios`).

Xcode manuell öffnen (aus `frontend/`):

```bash
npm run open:ios
```

Entspricht:

```bash
env PATH="/usr/bin:/bin:/usr/sbin:/sbin:/usr/local/bin" open ios/App/App.xcworkspace
```

Danach in Xcode: Team prüfen, Build-Nummer erhöhen, **Any iOS Device** → **Product → Archive** → Upload.

**Wichtig:** Der Agent darf `sudo` **nicht** ausführen (Passwortabfrage scheitert) und hat **keinen** Zugriff auf den Mac. Daher Schritte 3–5 immer klar als Nutzer-Aufgabe ausweisen und **nicht** behaupten, sie seien erledigt, ohne es per Beleg (Zeitstempel/HTTP-Status) zu verifizieren.

---

## 10. ZUSAMMENFASSUNG FÜR AGENTS

| Verboten | Erlaubt |
|----------|---------|
| Polling, Loops, Dauer-HTTP | Einzelne, begründete Requests |
| Watcher / dev dauerhaft auf Server | Manueller dev, dann stoppen |
| systemd/cron ohne GO | Statischer Export + Nginx |
| Änderungen außerhalb `kniffel/` | Kleine Inkremente + CHANGELOG |

**Bei Unsicherheit: stoppen und den Nutzer fragen — nicht automatisch weiterdrehen.**
