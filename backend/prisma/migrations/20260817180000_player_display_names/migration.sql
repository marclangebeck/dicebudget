-- CreateTable
CREATE TABLE "player_display_names" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "player_id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "name_token" TEXT NOT NULL,
    "updated_at" DATETIME NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "player_display_names_player_id_key" ON "player_display_names"("player_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_display_names_name_token_key" ON "player_display_names"("name_token");
