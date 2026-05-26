/** Spiegel der Backend-Pool-Logik für Korrektur-Eingaben. */
export function poolDeltaForComplete(
  rollsUsed: number,
  useStrategyRules: boolean,
): { spareToPool: number; poolCost: number } {
  if (!useStrategyRules) {
    return { spareToPool: 0, poolCost: 0 };
  }
  const spareToPool = rollsUsed <= 3 ? 3 - rollsUsed : 0;
  const poolCost = rollsUsed > 3 ? rollsUsed - 3 : 0;
  return { spareToPool, poolCost };
}
