-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN "rule_yatzy_streak_2" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "game_sessions" ADD COLUMN "rule_yatzy_triple" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "game_sessions" ADD COLUMN "rule_upper_race" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "runs" ADD COLUMN "yatzy_triple_penalty_at_sequence" INTEGER;
