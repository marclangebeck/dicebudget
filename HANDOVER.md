# Übergabe - dice.budget

**Workspace:** `/home/bottleadmin/projects/kniffel`  
**Repository:** `marclangebeck/dicebudget`  
**Branch:** `milestone-22-prep`  
**Produktcode-HEAD:** `3e9d9a8` (M42/M43) · Tip `b8a9d79` (Admin-PIN volle Tastatur)  
**Sprache:** Deutsch  
**Stand Doku:** 2026-08-12

Kompakte Startübergabe. **Roadmap:** `docs/milestone-roadmap-analysis.md`. Aktiver Stand: `docs/milestones_active.md` (**M42/M43** vor **M30**). iOS/TestFlight: `docs/ios_current.md`. Architektur/Betrieb: `docs/decisions.md` nur bei Bedarf.

## Verbindliche Regeln

- `AGENT_RULES.md` hat Vorrang vor allen anderen Dokumenten.
- `AGENT_RULES.md` Sektion 9: Nach Code-Änderungen nummerierte `[Server]`/`[Mac]`-Befehle ausgeben.
- Keine Commits ohne ausdrückliche Nutzer-Anweisung (**GO**).
- Kein `sudo` durch den Agent; Backend-Deploy per Nutzer auf dem Server.
- Keine Watcher, kein Polling, keine Dauerprozesse.
- Agent arbeitet nur unter `/home/bottleadmin/projects/kniffel`.
- Mac-Clone: `/Users/marclangebeck/projects/kniffel` (auch `~/projects/kniffel`).
- Reine Frontend-Änderungen: `cd frontend && npm run build` auf dem Server; Nginx liefert `frontend/out/` aus.

## Aktueller Stand

| Bereich | Status |
|---------|--------|
| Web/API | Live: https://dicebudget.bottle-trade.de |
| Branch | `milestone-22-prep` @ Tip `b8a9d79` |
| Frontend-Tests | **98** grün |
| Roadmap | **M42/M43** umgesetzt; **M30** danach |
| Entwickler-Vorschau | **InApp-Käufe (Features)** = Labs-PIN (`NEXT_PUBLIC_LABS_PIN`) — getrennt von Admin |
| iOS/TestFlight | Version `2.0`; Builds bis **~51+**; Admin per **PIN** + lokalem Key (M43) |
| Backend Prod | Migrationen inkl. Absolute-Baseline — Deploy prüfen nach Stabilitäts-Batch |

## Wichtig: Admin (ein Build, M43)

- **Ein App-Build:** `NEXT_PUBLIC_ADMIN_PIN` setzen (alphanumerisch; volle Tastatur); `NEXT_PUBLIC_ADMIN_API_KEY` im Bundle **leer**.
- Nach PIN: Menü/Einstellungen → **Admin** → Server-`ADMIN_API_KEY` lokal speichern.
- Backend `requireAdminKey` bleibt Pflicht (`X-Admin-Key`).
- Labs-PIN und Admin-PIN sind **unabhängig**.

## Wichtig: iOS-Bundle ≠ Web-Deploy

- UI in der App aus `frontend/ios/App/App/public/` (gitignored).
- Nur **`npm run build:ios`** auf dem Mac befüllt das Bundle und öffnet Xcode.
- Vor Archive: `git log -1`; Env: `NEXT_PUBLIC_LABS_PIN`, **`NEXT_PUBLIC_ADMIN_PIN`**, `NEXT_PUBLIC_APP_VERSION=2.0`; Admin-API-Key leer. Menü-Build iOS = Xcode (`App.getInfo`).
- Bei Pull-Konflikt oft: `git restore frontend/package-lock.json` vor `git pull`.

## Letzte Produktänderungen

### M42 / M43 — 2026-08-12

- **M42:** Rivalen-Bilder nur lokal (IndexedDB); Rivalen verwalten + Anzeige in Paarungen.
- **M43:** Admin-Shell `/settings/admin`, PIN-Freischaltung, lokaler API-Key; Stats-Admin danach.
- **Fix:** Admin-PIN-Feld ohne `inputMode=numeric` (Buchstaben möglich) — Tip `b8a9d79`.
- Heller Spielzettel + Rivalen-Share-Karte (Duell/Form) ebenfalls in HEAD.

### UX 2026-08-12 — Gold-Aufleuchten + Menü-Version

- Gold-Aufleuchten bei fertiger Zeile/Spalte; Fanfare; eigener Toggle.
- Menü-Version iOS native; Achievement-Sounds mit AudioContext-Resume.

### Statistik / Sync (M38 Stufe 0)

- Admin: **Verwalten** → Löschen · Server / Siege/Diff (nach M43-PIN + Key).
- Absolute Baseline + App-Snapshot; Spieler lokal ausblenden / Rivalen / „Das bin ich“.

## Prod-Verifikation & Deploy

```bash
bash /home/bottleadmin/projects/kniffel/infra/scripts/verify-prod-api.sh
```

```bash
sudo bash /home/bottleadmin/projects/kniffel/infra/scripts/deploy-backend-prod.sh
```

Frontend: `cd frontend && npm run build`.

## Wichtige Dateien

- Admin: `adminAccess.ts`, `settings/admin/page.tsx`, `AdminUnlockDialog.tsx`
- Rival-Avatare: `rivalAvatarStore.ts`, `RivalAvatar.tsx`, `RivalManagePanel.tsx`
- Features/Labs: `featureFlags.ts`, `labsAccess.ts`
- Statistik: `app/stats/page.tsx`, `pairingMerge.ts`
- iOS: `docs/ios_current.md`, `GOiOS.md`, `docs/testflight-app-store.md`

## Offene Prioritäten

1. M42/M43 Abnahme / frischer iOS-Build mit Admin-PIN; dann **M30**.
2. Optional **Stufe A** Stats nur bei Drift.
3. **M36** nach M30.
4. `milestone-22-prep` → `main` nach Release-Freigabe.

## Agent-Start (Übergabeprompt)

```text
Du arbeitest an dice.budget (kniffel). Lies zuerst AGENT_RULES.md und HANDOVER.md, dann docs/milestones_active.md.

Workspace: /home/bottleadmin/projects/kniffel
Branch: milestone-22-prep
HEAD: b8a9d79 / Produkt 3e9d9a8 (M42/M43; Admin-PIN volle Tastatur)
Live: https://dicebudget.bottle-trade.de
Sprache: Deutsch

Regeln: Keine Commits ohne ausdrückliches GO. Kein sudo. Keine Watcher/Polling/Dauerprozesse. Nach Code-Änderungen nummerierte [Server]/[Mac]-Befehle (AGENT_RULES §9). Frontend-Build: cd frontend && npm run build. Backend-Deploy nur Nutzer: sudo bash infra/scripts/deploy-backend-prod.sh.

Stand: M42 Rival-Avatare + M43 Admin-PIN (ein Build, alphanumerisch); Tests 98; M30 bewusst danach.

Antworte auf Deutsch. Kleine Inkremente, vor größeren Features GO einholen.
```
