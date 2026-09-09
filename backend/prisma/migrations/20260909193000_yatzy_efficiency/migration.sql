-- Alle-Fünfe-Effizienz (Session-Toggle, Default aus)
ALTER TABLE "game_sessions" ADD COLUMN "rule_yatzy_efficiency" BOOLEAN NOT NULL DEFAULT false;
