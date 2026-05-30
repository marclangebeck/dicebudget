-- AlterTable
ALTER TABLE "game_sessions" ADD COLUMN "pool_endgame_enabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "game_sessions" ADD COLUMN "pool_endgame_improver_id" TEXT;
ALTER TABLE "game_sessions" ADD COLUMN "pool_endgame_resolved" BOOLEAN NOT NULL DEFAULT false;
