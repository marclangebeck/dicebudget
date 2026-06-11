-- API-Singleplayer: geheimer Token pro Run (Schutz gegen runId-Enumeration)
ALTER TABLE "runs" ADD COLUMN "solo_secret_token" TEXT;

CREATE UNIQUE INDEX "runs_solo_secret_token_key" ON "runs"("solo_secret_token");
