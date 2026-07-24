-- AlterTable
ALTER TABLE "runs" ADD COLUMN "upper_race_pool_credited" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "runs" ADD COLUMN "yatzy_streak_penalty_at_sequence" INTEGER;
