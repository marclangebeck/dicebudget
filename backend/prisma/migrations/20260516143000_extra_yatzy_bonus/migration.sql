-- AlterTable
ALTER TABLE "games" ADD COLUMN "extra_yatzy_bonus" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "runs" ADD COLUMN "extra_yatzy_count" INTEGER NOT NULL DEFAULT 0;
