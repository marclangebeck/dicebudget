/**
 * Einmaliges CLI: Run mit game_count anlegen (Milestone 2 – manuell ausführen).
 * Beispiel: npm run db:create-run -- 3
 */
import { createRun, getRunSummary } from "../src/services/createRun.js";

async function main(): Promise<void> {
  const gameCount = Number(process.argv[2]);

  if (!process.argv[2] || Number.isNaN(gameCount)) {
    console.error("Usage: npm run db:create-run -- <game_count 1-6>");
    process.exit(1);
  }

  try {
    const result = await createRun(gameCount);
    const summary = await getRunSummary(result.runId);
    console.log(JSON.stringify({ created: result, summary }, null, 2));
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

void main();
