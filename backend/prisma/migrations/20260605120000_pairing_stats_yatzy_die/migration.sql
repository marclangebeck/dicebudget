-- Session: optional exclusion from pairing stats (default true = backward compatible)
ALTER TABLE "game_sessions" ADD COLUMN "include_in_pairing_stats" BOOLEAN NOT NULL DEFAULT true;

-- Field: which die face was used for a scored Yatzy (50 pts)
ALTER TABLE "fields" ADD COLUMN "yatzy_die_value" INTEGER;
