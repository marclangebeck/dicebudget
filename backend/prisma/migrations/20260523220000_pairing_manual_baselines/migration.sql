-- CreateTable
CREATE TABLE "pairing_manual_baselines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pairing_key" TEXT NOT NULL,
    "extra_wins_a" INTEGER NOT NULL DEFAULT 0,
    "extra_wins_b" INTEGER NOT NULL DEFAULT 0,
    "extra_bonus_a" INTEGER NOT NULL DEFAULT 0,
    "extra_bonus_b" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "pairing_manual_baselines_pairing_key_key" ON "pairing_manual_baselines"("pairing_key");

-- Marc vs. Nicole Langebeck (alphabetisch: Marc = A, Nicole Langebeck = B)
INSERT INTO "pairing_manual_baselines" (
    "id",
    "pairing_key",
    "extra_wins_a",
    "extra_wins_b",
    "extra_bonus_a",
    "extra_bonus_b",
    "note"
) VALUES (
    'baseline-marc-nicole-langebeck',
    'Marc::Nicole Langebeck',
    46,
    58,
    0,
    1972,
    'Spiele vor App-Statistik (mehrere Monate)'
);
