-- CreateTable
CREATE TABLE "game_sessions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invite_code" TEXT NOT NULL,
    "game_count" INTEGER NOT NULL,
    "max_players" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "players" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "session_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "secret_token" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    CONSTRAINT "players_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "game_sessions" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "players_run_id_fkey" FOREIGN KEY ("run_id") REFERENCES "runs" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "game_sessions_invite_code_key" ON "game_sessions"("invite_code");

-- CreateIndex
CREATE UNIQUE INDEX "players_secret_token_key" ON "players"("secret_token");

-- CreateIndex
CREATE UNIQUE INDEX "players_run_id_key" ON "players"("run_id");

-- CreateIndex
CREATE UNIQUE INDEX "players_session_id_order_index_key" ON "players"("session_id", "order_index");
