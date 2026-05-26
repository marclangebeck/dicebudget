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
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_game_sessions" ("created_at", "game_count", "id", "invite_code", "max_players", "status") SELECT "created_at", "game_count", "id", "invite_code", "max_players", "status" FROM "game_sessions";
DROP TABLE "game_sessions";
ALTER TABLE "new_game_sessions" RENAME TO "game_sessions";
CREATE UNIQUE INDEX "game_sessions_invite_code_key" ON "game_sessions"("invite_code");
CREATE TABLE "new_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_count" INTEGER NOT NULL,
    "use_strategy_rules" BOOLEAN NOT NULL DEFAULT true,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "total_rolls_used" INTEGER NOT NULL DEFAULT 0,
    "rolls_in_pool" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" DATETIME
);
INSERT INTO "new_runs" ("created_at", "finished_at", "game_count", "id", "rolls_in_pool", "status", "total_rolls_used", "total_score") SELECT "created_at", "finished_at", "game_count", "id", "rolls_in_pool", "status", "total_rolls_used", "total_score" FROM "runs";
DROP TABLE "runs";
ALTER TABLE "new_runs" RENAME TO "runs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
