-- M40: Spalten-Pool-Boni (Session-Flag + einmalige Credits für Ersten)
ALTER TABLE "game_sessions" ADD COLUMN "rule_column_pool_bonuses" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "game_sessions" ADD COLUMN "column_pool_upper_credited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "game_sessions" ADD COLUMN "column_pool_lower_credited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "game_sessions" ADD COLUMN "column_pool_combo_credited" BOOLEAN NOT NULL DEFAULT false;
