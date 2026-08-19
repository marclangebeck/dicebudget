-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_game_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invite_code" TEXT NOT NULL,
    "game_count" INTEGER NOT NULL,
    "max_players" INTEGER NOT NULL,
    "use_strategy_rules" BOOLEAN NOT NULL DEFAULT true,
    "show_opponent_pool" BOOLEAN NOT NULL DEFAULT false,
    "pool_endgame_enabled" BOOLEAN NOT NULL DEFAULT false,
    "pool_endgame_improver_id" TEXT,
    "pool_endgame_resolved" BOOLEAN NOT NULL DEFAULT false,
    "rule_yatzy_streak_2" BOOLEAN NOT NULL DEFAULT true,
    "rule_yatzy_triple" BOOLEAN NOT NULL DEFAULT true,
    "rule_upper_race" BOOLEAN NOT NULL DEFAULT true,
    "rule_yatzy_streak_2_credit" BOOLEAN NOT NULL DEFAULT false,
    "rule_yatzy_triple_credit" BOOLEAN NOT NULL DEFAULT false,
    "rule_column_pool_bonuses" BOOLEAN NOT NULL DEFAULT true,
    "column_pool_upper_credited" BOOLEAN NOT NULL DEFAULT false,
    "column_pool_lower_credited" BOOLEAN NOT NULL DEFAULT false,
    "column_pool_combo_credited" BOOLEAN NOT NULL DEFAULT false,
    "ko_tie_break_enabled" BOOLEAN NOT NULL DEFAULT false,
    "ko_tie_break_pending" BOOLEAN NOT NULL DEFAULT false,
    "ko_tie_break_player_a_id" TEXT,
    "ko_tie_break_player_a_rolls" TEXT,
    "ko_tie_break_player_b_id" TEXT,
    "ko_tie_break_player_b_rolls" TEXT,
    "ko_tie_break_winner_player_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "league_id" TEXT NOT NULL,
    "round_number" INTEGER NOT NULL DEFAULT 1,
    "points_awarded" BOOLEAN NOT NULL DEFAULT false,
    "include_in_pairing_stats" BOOLEAN NOT NULL DEFAULT true,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "game_sessions_league_id_fkey" FOREIGN KEY ("league_id") REFERENCES "leagues" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_game_sessions" ("column_pool_combo_credited", "column_pool_lower_credited", "column_pool_upper_credited", "created_at", "game_count", "id", "include_in_pairing_stats", "invite_code", "league_id", "max_players", "points_awarded", "pool_endgame_enabled", "pool_endgame_improver_id", "pool_endgame_resolved", "round_number", "rule_column_pool_bonuses", "rule_upper_race", "rule_yatzy_streak_2", "rule_yatzy_streak_2_credit", "rule_yatzy_triple", "rule_yatzy_triple_credit", "show_opponent_pool", "status", "use_strategy_rules") SELECT "column_pool_combo_credited", "column_pool_lower_credited", "column_pool_upper_credited", "created_at", "game_count", "id", "include_in_pairing_stats", "invite_code", "league_id", "max_players", "points_awarded", "pool_endgame_enabled", "pool_endgame_improver_id", "pool_endgame_resolved", "round_number", "rule_column_pool_bonuses", "rule_upper_race", "rule_yatzy_streak_2", "rule_yatzy_streak_2_credit", "rule_yatzy_triple", "rule_yatzy_triple_credit", "show_opponent_pool", "status", "use_strategy_rules" FROM "game_sessions";
DROP TABLE "game_sessions";
ALTER TABLE "new_game_sessions" RENAME TO "game_sessions";
CREATE UNIQUE INDEX "game_sessions_invite_code_key" ON "game_sessions"("invite_code");
CREATE INDEX "game_sessions_points_awarded_idx" ON "game_sessions"("points_awarded");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
