export function parseExtraYatzyDieValues(raw: string | null | undefined): number[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (n): n is number => Number.isInteger(n) && n >= 1 && n <= 6,
    );
  } catch {
    return [];
  }
}

export function appendExtraYatzyDieValue(
  raw: string | null | undefined,
  yatzyDieValue: number,
): string {
  const next = [...parseExtraYatzyDieValues(raw), yatzyDieValue];
  return JSON.stringify(next);
}

export function assertExtraYatzyDieValue(yatzyDieValue: number): void {
  if (
    !Number.isInteger(yatzyDieValue) ||
    yatzyDieValue < 1 ||
    yatzyDieValue > 6
  ) {
    throw new Error("yatzyDieValue must be an integer from 1 to 6 for Alle Fünfe");
  }
}
