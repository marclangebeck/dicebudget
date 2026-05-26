-- CreateTable
CREATE TABLE "player_name_aliases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "alias_name" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "player_name_aliases_alias_name_key" ON "player_name_aliases"("alias_name");
