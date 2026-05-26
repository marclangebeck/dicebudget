-- CreateTable
CREATE TABLE "leagues" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "league_code" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "leagues_league_code_key" ON "leagues"("league_code");

INSERT INTO "leagues" ("id", "league_code", "created_at")
VALUES ('legacy-league', '__legacy__', CURRENT_TIMESTAMP);

-- CreateTable
CREATE TABLE "league_standings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "league_id" TEXT NOT NULL,
    "player_name" TEXT NOT NULL,
    "win_points" INTEGER NOT NULL DEFAULT 0,
    "bonus_points" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "league_standings_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "league_standings_league_id_player_name_key" ON "league_standings"("league_id", "player_name");

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_game_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invite_code" TEXT NOT NULL,
    "game_count" INTEGER NOT NULL,
    "max_players" INTEGER NOT NULL,
    "use_strategy_rules" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "league_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL DEFAULT 1,
    "points_awarded" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_sessions_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_game_sessions" ("id", "invite_code", "game_count", "max_players", "use_strategy_rules", "status", "created_at", "league_id", "round_number", "points_awarded")
SELECT
    gs."id",
    gs."invite_code",
    gs."game_count",
    gs."max_players",
    gs."use_strategy_rules",
    gs."status",
    gs."created_at",
    'legacy-league',
    1,
    false
FROM "game_sessions" gs;
DROP TABLE "game_sessions";
ALTER TABLE "new_game_sessions" RENAME TO "game_sessions";
CREATE UNIQUE INDEX "game_sessions_invite_code_key" ON "game_sessions"("invite_code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
