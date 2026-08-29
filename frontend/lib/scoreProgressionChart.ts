import type { ScoreProgressionPointDto } from "@/lib/matchAnalysisTypes";

const SAMPLE_PERCENTS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

/** Reduziert den Verlauf auf Vergleichspunkte alle 10 % (0–100). */
export function downsampleScoreProgressionPoints(
  points: ScoreProgressionPointDto[],
): ScoreProgressionPointDto[] {
  if (points.length === 0) return [];
  const maxTurn = Math.max(...points.map((point) => point.turn), 1);

  return SAMPLE_PERCENTS.map((percent) => {
    const targetTurn = (percent / 100) * maxTurn;
    let chosen = points[0]!;
    for (const point of points) {
      if (point.turn <= targetTurn) chosen = point;
      else break;
    }
    return {
      ...chosen,
      turn: percent,
    };
  });
}

export const SCORE_PROGRESSION_COLORS = [
  "#34d399",
  "#fbbf24",
  "#60a5fa",
  "#f472b6",
  "#a78bfa",
  "#fb923c",
] as const;

export function scoreProgressionColor(index: number): string {
  return SCORE_PROGRESSION_COLORS[index % SCORE_PROGRESSION_COLORS.length]!;
}
