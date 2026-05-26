-- CreateTable
CREATE TABLE "runs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_count" INTEGER NOT NULL,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "total_rolls_used" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" DATETIME
);

-- CreateTable
CREATE TABLE "games" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "run_id" TEXT NOT NULL,
    "index" INTEGER NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "games_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "fields" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "game_id" TEXT NOT NULL,
    "field_type" TEXT NOT NULL,
    "score" INTEGER,
    "rolls_used" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "fields_game_id_fkey" FOREIGN KEY ("game_id") REFERENCES "games" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "rolls" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "field_id" TEXT NOT NULL,
    "roll_number" INTEGER NOT NULL,
    "dice_values" TEXT NOT NULL,
    CONSTRAINT "rolls_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "fields" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "games_run_id_index_key" ON "games"("run_id", "index");

-- CreateIndex
CREATE UNIQUE INDEX "fields_game_id_field_type_key" ON "fields"("game_id", "field_type");

-- CreateIndex
CREATE UNIQUE INDEX "rolls_field_id_roll_number_key" ON "rolls"("field_id", "roll_number");
