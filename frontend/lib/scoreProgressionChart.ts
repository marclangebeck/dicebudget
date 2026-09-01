import type {
  ScoreProgressionDto,
  ScoreProgressionPlayerDto,
  ScoreProgressionPointDto,
} from "@/lib/matchAnalysisTypes";

type LegacyScoreProgressionPoint = {
  turn: number;
  playerAScore: number;
  playerBScore: number;
  leader: "a" | "b" | "tie";
};

type LegacyScoreProgression = {
  playerAId: string;
  playerAName: string;
  playerBId: string;
  playerBName: string;
  points: LegacyScoreProgressionPoint[];
  finalLeader: "a" | "b" | "tie";
  leadChanges: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function leadFromScores(scores: number[]): {
  leaderIndex: number | null;
  leadMargin: number;
} {
  if (scores.length === 0) return { leaderIndex: null, leadMargin: 0 };
  let best = -Infinity;
  let second = -Infinity;
  let bestIndex = -1;
  let bestCount = 0;
  for (let i = 0; i < scores.length; i += 1) {
    const score = scores[i]!;
    if (score > best) {
      second = best;
      best = score;
      bestIndex = i;
      bestCount = 1;
    } else if (score === best) {
      bestCount += 1;
    } else if (score > second) {
      second = score;
    }
  }
  if (bestCount !== 1 || bestIndex < 0) {
    return { leaderIndex: null, leadMargin: 0 };
  }
  const runnerUp = second === -Infinity ? best : second;
  return { leaderIndex: bestIndex, leadMargin: Math.max(0, best - runnerUp) };
}

function normalizePoint(
  raw: unknown,
  playerCount: number,
): ScoreProgressionPointDto | null {
  if (!isRecord(raw)) return null;
  const turn = num(raw.turn);

  if (Array.isArray(raw.scores)) {
    const scores = raw.scores.map((score) => num(score));
    while (scores.length < playerCount) scores.push(0);
    const { leaderIndex, leadMargin } = leadFromScores(scores);
    return {
      turn,
      scores: scores.slice(0, playerCount),
      leaderIndex:
        typeof raw.leaderIndex === "number" || raw.leaderIndex === null
          ? raw.leaderIndex
          : leaderIndex,
      leadMargin: num(raw.leadMargin, leadMargin),
    };
  }

  if ("playerAScore" in raw && "playerBScore" in raw) {
    const scores = [num(raw.playerAScore), num(raw.playerBScore)];
    const leader = raw.leader;
    const leaderIndex =
      leader === "a" ? 0 : leader === "b" ? 1 : leadFromScores(scores).leaderIndex;
    const leadMargin =
      leaderIndex === 0
        ? Math.max(0, scores[0]! - scores[1]!)
        : leaderIndex === 1
          ? Math.max(0, scores[1]! - scores[0]!)
          : 0;
    return { turn, scores, leaderIndex, leadMargin };
  }

  return null;
}

function normalizePlayers(raw: unknown): ScoreProgressionPlayerDto[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!isRecord(entry)) return null;
      const id = typeof entry.id === "string" ? entry.id.trim() : "";
      const name = typeof entry.name === "string" ? entry.name.trim() : "";
      if (!id || !name) return null;
      return { id, name };
    })
    .filter((player): player is ScoreProgressionPlayerDto => player != null);
}

function isLegacyProgression(raw: Record<string, unknown>): raw is LegacyScoreProgression {
  return (
    typeof raw.playerAId === "string" &&
    typeof raw.playerAName === "string" &&
    typeof raw.playerBId === "string" &&
    typeof raw.playerBName === "string" &&
    Array.isArray(raw.points)
  );
}

/** Akzeptiert neues N-Spieler-DTO und das ältere Zwei-Spieler-Format aus älteren Backends. */
export function normalizeScoreProgression(raw: unknown): ScoreProgressionDto | null {
  if (!isRecord(raw)) return null;

  if (isLegacyProgression(raw)) {
    const players: ScoreProgressionPlayerDto[] = [
      { id: raw.playerAId, name: raw.playerAName },
      { id: raw.playerBId, name: raw.playerBName },
    ];
    const points = raw.points
      .map((point) => normalizePoint(point, players.length))
      .filter((point): point is ScoreProgressionPointDto => point != null);
    if (players.length < 2 || points.length < 2) return null;
    const finalLeaderIndex =
      raw.finalLeader === "a" ? 0 : raw.finalLeader === "b" ? 1 : null;
    return {
      players,
      points,
      finalLeaderIndex,
      leadChanges: num(raw.leadChanges),
    };
  }

  const players = normalizePlayers(raw.players);
  if (players.length < 2 || !Array.isArray(raw.points)) return null;

  const points = raw.points
    .map((point) => normalizePoint(point, players.length))
    .filter((point): point is ScoreProgressionPointDto => point != null);
  if (points.length < 2) return null;

  const last = points[points.length - 1]!;
  const finalLeaderIndex =
    typeof raw.finalLeaderIndex === "number" || raw.finalLeaderIndex === null
      ? raw.finalLeaderIndex
      : last.leaderIndex;

  return {
    players,
    points,
    finalLeaderIndex,
    leadChanges: num(raw.leadChanges),
  };
}

const SAMPLE_PERCENTS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100] as const;

/** Reduziert den Verlauf auf Vergleichspunkte alle 10 % (0–100). */
export function downsampleScoreProgressionPoints(
  points: ScoreProgressionPointDto[] | null | undefined,
): ScoreProgressionPointDto[] {
  if (!points || points.length === 0) return [];
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
