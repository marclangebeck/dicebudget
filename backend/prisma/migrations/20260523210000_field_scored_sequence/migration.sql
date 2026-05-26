-- AlterTable
ALTER TABLE "runs" ADD COLUMN "next_scored_sequence" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "fields" ADD COLUMN "scored_sequence" INTEGER;
