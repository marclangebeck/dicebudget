-- CreateTable
CREATE TABLE "tournament_groups" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_groups_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tournament_group_standings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "rank" INTEGER NOT NULL DEFAULT 0,
    "matches_played" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "draws" REAL NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "points" REAL NOT NULL DEFAULT 0,
    "total_score_diff" INTEGER NOT NULL DEFAULT 0,
    "total_score_for" INTEGER NOT NULL DEFAULT 0,
    "total_score_against" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "tournament_group_standings_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_group_standings_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_group_standings_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "tournament_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tournament_rounds" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "group_id" TEXT,
    "phase" TEXT NOT NULL,
    "round_index" INTEGER NOT NULL,
    "leg_index" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_rounds_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_rounds_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "tournament_matches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "group_id" TEXT,
    "round_id" TEXT,
    "phase" TEXT NOT NULL,
    "bracket_slot" INTEGER,
    "match_index" INTEGER NOT NULL,
    "home_entry_id" TEXT NOT NULL,
    "away_entry_id" TEXT NOT NULL,
    "session_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "home_score" INTEGER,
    "away_score" INTEGER,
    "home_points_awarded" REAL,
    "away_points_awarded" REAL,
    "winner_entry_id" TEXT,
    "tie_break_needed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "tournament_matches_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_matches_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "tournament_groups" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_matches_round_id_fkey" FOREIGN KEY ("round_id") REFERENCES "tournament_rounds" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "tournament_matches_home_entry_id_fkey" FOREIGN KEY ("home_entry_id") REFERENCES "tournament_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_matches_away_entry_id_fkey" FOREIGN KEY ("away_entry_id") REFERENCES "tournament_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "tournament_matches_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tournament_groups_tournament_id_sort_order_key" ON "tournament_groups"("tournament_id", "sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_group_standings_group_id_entry_id_key" ON "tournament_group_standings"("group_id", "entry_id");

-- CreateIndex
CREATE INDEX "tournament_rounds_tournament_id_phase_round_index_idx" ON "tournament_rounds"("tournament_id", "phase", "round_index");

-- CreateIndex
CREATE UNIQUE INDEX "tournament_matches_session_id_key" ON "tournament_matches"("session_id");

-- CreateIndex
CREATE INDEX "tournament_matches_tournament_id_phase_status_idx" ON "tournament_matches"("tournament_id", "phase", "status");

-- CreateIndex
CREATE INDEX "tournament_matches_round_id_match_index_idx" ON "tournament_matches"("round_id", "match_index");
