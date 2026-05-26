import { ROLLS_PER_FIELD } from "../config.js";

export type RunRules = {
  useStrategyRules: boolean;
};

export function assertRollsUsedForMode(rollsUsed: number, useStrategyRules: boolean): void {
  const max = useStrategyRules ? 20 : ROLLS_PER_FIELD;
  if (!Number.isInteger(rollsUsed) || rollsUsed < 1 || rollsUsed > max) {
    const msg = useStrategyRules
      ? "rollsUsed must be an integer from 1 to 20"
      : `rollsUsed must be an integer from 1 to ${ROLLS_PER_FIELD}`;
    throw new Error(msg);
  }
}

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
