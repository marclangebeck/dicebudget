/**
 * Einmaliges CLI: fehlende scoredSequence-Werte für Legacy-Runs nachziehen (M25).
 * Beispiel: npm run db:backfill-scored-sequences
 */
import { backfillAllScoredSequences } from "../src/services/scoredSequence.js";

async function main(): Promise<void> {
  const result = await backfillAllScoredSequences();
  console.log(JSON.stringify({ ok: true, ...result }, null, 2));
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
