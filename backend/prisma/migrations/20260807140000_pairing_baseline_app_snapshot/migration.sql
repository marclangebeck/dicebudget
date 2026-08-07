-- Snapshot der App-Siege/Diff zum Absolut-Korrekturzeitpunkt:
-- danach fortschreiben als absolute + (aktuellApp - Snapshot), ohne Additiv-Drift.
ALTER TABLE "pairing_manual_baselines" ADD COLUMN "app_wins_a_snap" INTEGER;
ALTER TABLE "pairing_manual_baselines" ADD COLUMN "app_wins_b_snap" INTEGER;
ALTER TABLE "pairing_manual_baselines" ADD COLUMN "app_bonus_a_snap" INTEGER;
ALTER TABLE "pairing_manual_baselines" ADD COLUMN "app_bonus_b_snap" INTEGER;
