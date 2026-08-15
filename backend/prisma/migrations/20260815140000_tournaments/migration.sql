-- CreateTable
CREATE TABLE "tournaments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invite_code" TEXT NOT NULL,
    "name" TEXT,
    "mode_key" TEXT NOT NULL DEFAULT 'league',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "host_token" TEXT NOT NULL,
    "max_entries" INTEGER NOT NULL DEFAULT 32,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "tournament_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tournament_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "player_id" TEXT,
    "order_index" INTEGER NOT NULL,
    "joined_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tournament_entries_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "tournaments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "tournaments_invite_code_key" ON "tournaments"("invite_code");

-- CreateIndex
CREATE INDEX "tournament_entries_tournament_id_idx" ON "tournament_entries"("tournament_id");
