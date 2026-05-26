-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_count" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "total_rolls_used" INTEGER NOT NULL DEFAULT 0,
    "rolls_in_pool" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" DATETIME
);
INSERT INTO "new_runs" ("created_at", "finished_at", "game_count", "id", "status", "total_rolls_used", "total_score") SELECT "created_at", "finished_at", "game_count", "id", "status", "total_rolls_used", "total_score" FROM "runs";
DROP TABLE "runs";
ALTER TABLE "new_runs" RENAME TO "runs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
