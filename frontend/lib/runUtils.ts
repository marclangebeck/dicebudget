import type { RunDto } from "./types";

export function getLastScoredFieldId(run: RunDto): string | null {
  if (run.lastScoredFieldId) return run.lastScoredFieldId;

  const scored = run.games.flatMap((game) => game.fields).filter((field) => field.score !== null);
  if (scored.length === 1) return scored[0]!.id;

  return null;
}

/** Run beendet (normal oder vorzeitig). */
export function isRunEnded(run: RunDto): boolean {
  return run.status === "FINISHED" || run.status === "ABANDONED";
}

export function runHasOpenFields(run: RunDto): boolean {
  return run.games.some((g) => g.fields.some((f) => f.score === null));
}

export function allFieldsScored(run: RunDto): boolean {
  return run.games.every((g) => g.fields.every((f) => f.score !== null));
}

export const ABANDON_RUN_CONFIRM =
  "Dein Zettel wird beendet. Offene Felder bleiben leer – das gilt nur für dich, nicht für andere Mitspieler. Fortfahren?";
