# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**HEAD:** `faf721b` (Host-Einladung nur QR + Lobby)  
**Sprache:** Deutsch  
**Stand Doku:** 2026-08-15

Kompakte Startübergabe. **Roadmap:** `docs/milestone-roadmap-analysis.md`. Aktiver Stand: `docs/milestones_active.md`. iOS/TestFlight: `docs/ios_current.md`. Architektur/Betrieb: `docs/decisions.md` nur bei Bedarf.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9: Nach Code-Änderungen nummerierte `[Server]`/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung (**GO**), außer der Nutzer erwartet den Standard-Sync inkl. Push (bei Unklarheit fragen).
- Kein `sudo` durch den Agent; Backend-Deploy per Nutzer auf dem Server.
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet nur unter `/home/bottleadmin/projects/kniffel`.
- Mac-Clone: `/Users/marclangebeck/projects/kniffel` (auch `~/projects/kniffel`).
- Reine Frontend-Änderungen: `cd frontend && npm run build` auf dem Server; Nginx liefert `frontend/out/` aus.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` @ Tip `faf721b` |
| Frontend-Tests | **105** grün |
| Roadmap | **M42/M43** + **Multi-QR** umgesetzt; **M30** danach |
| Entwickler-Vorschau | **InApp-Käufe (Features)** = Labs-PIN (`NEXT_PUBLIC_LABS_PIN`) — getrennt von Admin |
| iOS/TestFlight | Version `2.0`; Deployment Target **15.0**; frischer Archive-Build 2026-08-15 (QR-Scan + Host-QR) |
| Backend Prod | Migrationen inkl. Absolute-Baseline — Deploy nur bei Backend-Änderungen |

## Multi-Beitritt (QR only) — Stand 2026-08-15

- **Kein Code-Eingabe-Feld** mehr (Startscreen / Multi / Join ohne `?code=`).
- Startscreen-Mitte: Button **QR-Code scannen** → In-App-Kamera (`JoinByQrScan`, `jsqr`); `NSCameraUsageDescription` in Info.plist.
- Host nach „Raum anlegen“: Overlay nur **„Spiel beitreten“** + QR + **„Zur Lobby (auch als Host)“** — kein Raum-ID-/Link-Teilen.
- Join-URL / Universal Link: `https://dicebudget.bottle-trade.de/multi/join?code=…`
- AASA + Associated Domains (`applinks:dicebudget.bottle-trade.de`); `DeepLinkRouter`.
- System-Kamera + Universal Link bleibt paralleler Weg; In-App-Scanner ist der Startscreen-Weg.

## Wichtig: Admin (ein Build, M43)

- **Ein App-Build:** `NEXT_PUBLIC_ADMIN_PIN` setzen (alphanumerisch; volle Tastatur); `NEXT_PUBLIC_ADMIN_API_KEY` im Bundle **leer**.
- Nach PIN: Menü/Einstellungen → **Admin** → Server-`ADMIN_API_KEY` lokal speichern.
- Backend `requireAdminKey` bleibt Pflicht (`X-Admin-Key`).
- Labs-PIN und Admin-PIN sind **unabhängig**.

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle und öffnet Xcode.
- Vor Archive: `git log -1`; Env: `NEXT_PUBLIC_LABS_PIN`, **`NEXT_PUBLIC_ADMIN_PIN`**, `NEXT_PUBLIC_APP_VERSION=2.0`; Admin-API-Key leer. Menü-Build iOS = Xcode (`App.getInfo`).
- Bei Pull-Konflikt oft: `git restore` auf `project.pbxproj` / `Podfile` / `package-lock.json`, dann erneut pullen (siehe `docs/ios_current.md`).
- Nach Pull mit neuen npm-Deps: `npm install` vor `build:ios`.

## Letzte Produktänderungen

### Multi-QR + Scan — 2026-08-15 (`9bbd3b3` … `faf721b`)

- Host-QR + Universal Links / AASA / DeepLinkRouter.
- Gast: In-App QR-Scan; Code-Eingabe entfernt (`JoinByCodeForm` gelöscht).
- iOS Deployment Target **15.0**.
- Host-Erfolg-UI auf QR + Lobby reduziert.

### M42 / M43 — 2026-08-12

- **M42:** Rivalen-Bilder nur lokal (IndexedDB).
- **M43:** Admin-Shell `/settings/admin`, PIN + lokaler API-Key.
- Heller Spielzettel + Rivalen-Share-Karte.

## Prod-Verifikation & Deploy

```bash
bash /home/bottleadmin/projects/kniffel/infra/scripts/verify-prod-api.sh
```

```bash
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
```

Frontend: `cd frontend && npm run build`.

## Wichtige Dateien

- QR-Scan: `JoinByQrScan.tsx`, `inviteJoinUrl.ts`, `InviteQrCode.tsx`, `DeepLinkRouter.tsx`
- Host Multi: `app/multi/page.tsx`
- Admin: `adminAccess.ts`, `settings/admin/page.tsx`, `AdminUnlockDialog.tsx`
- Rival-Avatare: `rivalAvatarStore.ts`, `RivalAvatar.tsx`, `RivalManagePanel.tsx`
- iOS: `docs/ios_current.md`, `GOiOS.md`, `docs/testflight-app-store.md`

## Offene Prioritäten

1. TestFlight-Abnahme des aktuellen QR-Builds; dann **M30** App Store.
2. Optional **Stufe A** Stats nur bei Drift.
3. **M36** nach M30.
4. `milestone-22-prep` → `main` nach Release-Freigabe.

## Agent-Start (Übergabeprompt)

```text
Du arbeitest an dice.budget (kniffel). Lies zuerst AGENT_RULES.md und HANDOVER.md, dann docs/milestones_active.md und docs/ios_current.md.

Workspace: /home/bottleadmin/projects/kniffel
Branch: milestone-22-prep
HEAD: faf721b
Live: https://dicebudget.bottle-trade.de
Sprache: Deutsch

Regeln: Keine Commits ohne ausdrückliches GO (bei Unklarheit fragen). Kein sudo. Keine Watcher/Polling/Dauerprozesse. Nach Code-Änderungen nummerierte [Server]/[Mac]-Befehle (AGENT_RULES §9). Frontend-Build: cd frontend && npm run build. Backend-Deploy nur Nutzer: sudo bash infra/scripts/deploy-backend-prod.sh. iOS nur Mac: npm run build:ios.

Stand 2026-08-15: Multi-Beitritt nur noch per QR (In-App-Scan + Universal Links); Code-Eingabe entfernt; Host-Overlay = „Spiel beitreten“ + QR + „Zur Lobby“. iOS Deployment Target 15.0. M42/M43 erledigt. Tests 105. Nächstes großes Thema typischerweise M30 (App Store) — GO vom Nutzer abwarten.

Antworten auf Deutsch. Kleine Inkremente, vor größeren Features GO einholen.
```
