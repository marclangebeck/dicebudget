/** Spiegel der Backend-Pool-Logik für Korrektur-Eingaben. */
export const ROLLS_PER_FIELD = 3;

export function poolDeltaForComplete(
  rollsUsed: number,
  useStrategyRules: boolean,
): { spareToPool: number; poolCost: number } {
  if (!useStrategyRules) {
    return { spareToPool: 0, poolCost: 0 };
  }
  const spareToPool = rollsUsed <= ROLLS_PER_FIELD ? ROLLS_PER_FIELD - rollsUsed : 0;
  const poolCost = rollsUsed > ROLLS_PER_FIELD ? rollsUsed - ROLLS_PER_FIELD : 0;
  return { spareToPool, poolCost };
}

/**
 * Wurf-Chips fürs Eintrag-Panel (Strategy): 1 … (3 + Pool).
 * Limit kommt nur aus dem Pool — kein globales Restbudget-Cap.
 */
export function strategyRollChipOptions(
  rollsInPool: number,
  maxRollsAllowed?: number,
): number[] {
  const poolCap = ROLLS_PER_FIELD + Math.max(0, rollsInPool);
  const maxRoll =
    maxRollsAllowed != null ? Math.min(poolCap, Math.max(0, maxRollsAllowed)) : poolCap;
  if (maxRoll < 1) return [];
  return Array.from({ length: maxRoll }, (_, i) => i + 1);
}
