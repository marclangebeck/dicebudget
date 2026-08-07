-- Absolute Baselines: extra_* speichern bei is_absolute=1 den Ziel-Gesamtstand (nicht Additiv).
ALTER TABLE "pairing_manual_baselines" ADD COLUMN "is_absolute" BOOLEAN NOT NULL DEFAULT false;
