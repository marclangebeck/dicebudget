-- Milestone 22 (Tag 2): personenbezogene Multiplayer-Altdaten bereinigen.
-- Ziel: keine Klarname-Baselines/Aliase und keine Legacy-MP-Historie mit Namen.

DELETE FROM "pairing_manual_baselines";
DELETE FROM "player_name_aliases";

CREATE TEMP TABLE "_m22_legacy_run_ids" AS
SELECT DISTINCT "run_id"
FROM "players"
WHERE "name" NOT LIKE 'pid:%';

CREATE TEMP TABLE "_m22_legacy_session_ids" AS
SELECT DISTINCT "session_id"
FROM "players"
WHERE "name" NOT LIKE 'pid:%';

-- Entfernt Sessions mit Legacy-Namensdaten (Players werden per FK-Cascade mitgeloescht).
DELETE FROM "game_sessions"
WHERE "id" IN (SELECT "session_id" FROM "_m22_legacy_session_ids");

-- Entfernt verwaiste Legacy-Runs nach Session-Loeschung.
DELETE FROM "runs"
WHERE "id" IN (SELECT "run_id" FROM "_m22_legacy_run_ids");

DROP TABLE "_m22_legacy_run_ids";
DROP TABLE "_m22_legacy_session_ids";

-- Alte Klarname-League-Standings entfernen.
DELETE FROM "league_standings"
WHERE "player_name" NOT LIKE 'pid:%';

