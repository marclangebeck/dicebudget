-- Optional: Erfolgreicher erhält abgezogene Pools (2× / 3× Alle Fünfe); Default aus = bisheriges Verhalten
ALTER TABLE "game_sessions" ADD COLUMN "rule_yatzy_streak_2_credit" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "game_sessions" ADD COLUMN "rule_yatzy_triple_credit" BOOLEAN NOT NULL DEFAULT false;
