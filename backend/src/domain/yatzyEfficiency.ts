/** Alle-Fünfe-Effizienz: volle 50 bis Wurf 7, danach −5 je 3 Würfe (10 % vom Ausgangswert 50). */

export const YATZY_EFFICIENCY_FULL_SCORE = 50;
export const YATZY_EFFICIENCY_FULL_UNTIL_ROLLS = 7;
export const YATZY_EFFICIENCY_STEP_ROLLS = 3;
export const YATZY_EFFICIENCY_STEP_PENALTY = 5;

/** Treffer-Punkte bei gegebener Wurfzahl (Effizienz an). */
export function yatzyEfficiencyHitScore(rollsUsed: number): number {
  if (!Number.isInteger(rollsUsed) || rollsUsed < 1) return 0;
  const over = Math.max(0, rollsUsed - YATZY_EFFICIENCY_FULL_UNTIL_ROLLS);
  const stage = Math.ceil(over / YATZY_EFFICIENCY_STEP_ROLLS);
  return Math.max(0, YATZY_EFFICIENCY_FULL_SCORE - YATZY_EFFICIENCY_STEP_PENALTY * stage);
}

/** Erlaubte Scores für Alle Fünfe bei Effizienz-Regel (Treffer + 0). */
export function yatzyEfficiencyScoreChoices(rollsUsed: number): readonly number[] {
  const hit = yatzyEfficiencyHitScore(rollsUsed);
  if (hit === 0) return [0];
  return [hit, 0];
}

export function isValidYatzyEfficiencyScore(score: number, rollsUsed: number): boolean {
  if (score === 0) return true;
  return score === yatzyEfficiencyHitScore(rollsUsed);
}
