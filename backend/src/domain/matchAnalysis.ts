import { poolDeltaForComplete } from "./gameRules.js";
import {
  UPPER_BONUS_POINTS,
  type GameBreakdown,
} from "./gameScoring.js";
import { FIELD_TYPES_PER_GAME, type FieldTypeId } from "./fieldTypes.js";
import { buildMatchCoaching, type MatchCoachingReport } from "./matchCoaching.js";

export type AnalysisField = {
  fieldType: string;
  score: number | null;
  rollsUsed: number;
  yatzyDieValue?: number | null;
};

export type AnalysisGame = {
  index: number;
  summary: GameBreakdown;
  fields: AnalysisField[];
};

export type AnalysisRun = {
  gameCount: number;
  useStrategyRules: boolean;
  totalScore: number;
  totalRollsUsed: number;
  rollsInPool: number;
  extraYatzyCount: number;
  games: AnalysisGame[];
};

export type PlayerRunMetrics = {
  totalScore: number;
  gameCount: number;
  useStrategyRules: boolean;
  bonusCount: number;
  upperSumTotal: number;
  lowerSumTotal: number;
  extraYatzyTotal: number;
  rollsInPool: number;
  totalRollsUsed: number;
  poolSpared: number;
  poolSpent: number;
  poolRollPoints: number;
  poolRollCost: number;
  pointsPerPoolRoll: number | null;
  avgRollsPerField: number | null;
  fieldsWithSpareRolls: number;
  fieldsWithPoolCost: number;
  yatzyHits: number;
  yatzyMisses: number;
  yatzyDieValues: number[];
  zeroEntries: number;
  lowerComboHits: Partial<Record<FieldTypeId, number>>;
  gameTotals: number[];
};

export type AttributionRow = {
  key: string;
  label: string;
  viewerValue: number;
  opponentValue: number;
  diff: number;
};

export type HeadToHeadAnalysis = {
  scoreDiff: number;
  winner: "viewer" | "opponent" | "tie";
  attribution: AttributionRow[];
  decisiveGameIndex: number | null;
  decisiveGameDiff: number;
  decisiveFieldType: FieldTypeId | null;
  decisiveFieldDiff: number;
  counterfactual: string | null;
};

export type AnalysisParticipant = {
  playerId: string;
  playerName: string;
  orderIndex: number;
  run: AnalysisRun;
};

export type SessionRankEntry = {
  playerId: string;
  playerName: string;
  orderIndex: number;
  rank: number;
  totalScore: number;
};

export type PlayerComparison = {
  opponentPlayerId: string;
  opponentName: string;
  opponentOrderIndex: number;
  opponent: PlayerRunMetrics;
  headToHead: HeadToHeadAnalysis;
};

export type MatchAnalysisResult = {
  mode: "solo" | "multi";
  ready: boolean;
  unavailableReason: string | null;
  playerCount: number;
  viewerRank: number | null;
  pointsBehindLeader: number | null;
  directWins: number;
  directLosses: number;
  directTies: number;
  viewer: PlayerRunMetrics;
  /** Nur bei genau 2 Spielern (Abwärtskompatibilität). */
  opponent: PlayerRunMetrics | null;
  headToHead: HeadToHeadAnalysis | null;
  ranking: SessionRankEntry[];
  comparisons: PlayerComparison[];
  insights: string[];
  /** Metriken aller Teilnehmer in Session-Reihenfolge. */
  allPlayers: PlayerRunMetrics[];
  coaching: MatchCoachingReport;
};

export type { MatchCoachingReport } from "./matchCoaching.js";

const LOWER_COMBO_TYPES: FieldTypeId[] = [
  "THREE_OF_A_KIND",
  "FOUR_OF_A_KIND",
  "FULL_HOUSE",
  "SMALL_STRAIGHT",
  "LARGE_STRAIGHT",
];

const FIELD_LABELS: Record<FieldTypeId, string> = {
  ONES: "1er",
  TWOS: "2er",
  THREES: "3er",
  FOURS: "4er",
  FIVES: "5er",
  SIXES: "6er",
  THREE_OF_A_KIND: "Dreier Pasch",
  FOUR_OF_A_KIND: "Vierer Pasch",
  FULL_HOUSE: "Full House",
  SMALL_STRAIGHT: "Kl. Straße",
  LARGE_STRAIGHT: "Gr. Straße",
  KNIFFEL: "Alle Fünfe",
  CHANCE: "Chance",
};

export function fieldLabel(fieldType: FieldTypeId): string {
  return FIELD_LABELS[fieldType] ?? fieldType;
}

export function analyzePlayerRun(run: AnalysisRun): PlayerRunMetrics {
  let bonusCount = 0;
  let upperSumTotal = 0;
  let lowerSumTotal = 0;
  let extraYatzyTotal = 0;
  let poolSpared = 0;
  let poolSpent = 0;
  let poolRollPoints = 0;
  let poolRollCost = 0;
  let yatzyHits = 0;
  let yatzyMisses = 0;
  const yatzyDieValues: number[] = [];
  let zeroEntries = 0;
  let fieldsWithSpareRolls = 0;
  let fieldsWithPoolCost = 0;
  let scoredFieldCount = 0;
  let totalRollsOnFields = 0;
  const lowerComboHits: Partial<Record<FieldTypeId, number>> = {};
  const gameTotals: number[] = [];

  for (const game of run.games) {
    gameTotals.push(game.summary.gameTotal);
    if (game.summary.bonus === UPPER_BONUS_POINTS) bonusCount += 1;
    upperSumTotal += game.summary.upperSum;
    lowerSumTotal += game.summary.lowerSum;
    extraYatzyTotal += game.summary.extraYatzyBonus;
    for (const die of game.summary.extraYatzyDieValues ?? []) {
      yatzyDieValues.push(die);
    }

    for (const field of game.fields) {
      if (field.score === null) continue;
      scoredFieldCount += 1;
      totalRollsOnFields += field.rollsUsed;
      if (field.score === 0) zeroEntries += 1;

      if (run.useStrategyRules) {
        const delta = poolDeltaForComplete(field.rollsUsed, true);
        poolSpared += delta.spareToPool;
        poolSpent += delta.poolCost;
        if (delta.poolCost > 0) {
          poolRollCost += delta.poolCost;
          poolRollPoints += field.score;
          fieldsWithPoolCost += 1;
        }
        if (delta.spareToPool > 0) fieldsWithSpareRolls += 1;
      }

      const fieldType = field.fieldType as FieldTypeId;
      if (fieldType === "KNIFFEL") {
        if (field.score >= 50) yatzyHits += 1;
        else if (field.score === 0) yatzyMisses += 1;
        if (field.yatzyDieValue != null) yatzyDieValues.push(field.yatzyDieValue);
      }

      if (LOWER_COMBO_TYPES.includes(fieldType) && field.score > 0) {
        lowerComboHits[fieldType] = (lowerComboHits[fieldType] ?? 0) + 1;
      }
    }
  }

  return {
    totalScore: run.totalScore,
    gameCount: run.gameCount,
    useStrategyRules: run.useStrategyRules,
    bonusCount,
    upperSumTotal,
    lowerSumTotal,
    extraYatzyTotal,
    rollsInPool: run.rollsInPool,
    totalRollsUsed: run.totalRollsUsed,
    poolSpared,
    poolSpent,
    poolRollPoints,
    poolRollCost,
    pointsPerPoolRoll: poolRollCost > 0 ? poolRollPoints / poolRollCost : null,
    avgRollsPerField: scoredFieldCount > 0 ? totalRollsOnFields / scoredFieldCount : null,
    fieldsWithSpareRolls,
    fieldsWithPoolCost,
    yatzyHits,
    yatzyMisses,
    yatzyDieValues,
    zeroEntries,
    lowerComboHits,
    gameTotals,
  };
}

function aggregateFieldScores(run: AnalysisRun): Map<FieldTypeId, number> {
  const totals = new Map<FieldTypeId, number>();
  for (const type of FIELD_TYPES_PER_GAME) {
    totals.set(type, 0);
  }
  for (const game of run.games) {
    for (const field of game.fields) {
      if (field.score === null) continue;
      const type = field.fieldType as FieldTypeId;
      totals.set(type, (totals.get(type) ?? 0) + field.score);
    }
  }
  return totals;
}

function buildHeadToHead(
  viewer: PlayerRunMetrics,
  opponent: PlayerRunMetrics,
  viewerRun: AnalysisRun,
  opponentRun: AnalysisRun,
): HeadToHeadAnalysis {
  const scoreDiff = viewer.totalScore - opponent.totalScore;
  let winner: HeadToHeadAnalysis["winner"] = "tie";
  if (scoreDiff > 0) winner = "viewer";
  else if (scoreDiff < 0) winner = "opponent";

  const bonusDiff = (viewer.bonusCount - opponent.bonusCount) * UPPER_BONUS_POINTS;
  const attribution: AttributionRow[] = [
    {
      key: "bonus",
      label: "Bonus (+35)",
      viewerValue: viewer.bonusCount * UPPER_BONUS_POINTS,
      opponentValue: opponent.bonusCount * UPPER_BONUS_POINTS,
      diff: bonusDiff,
    },
    {
      key: "upper",
      label: "Obere Sektion",
      viewerValue: viewer.upperSumTotal,
      opponentValue: opponent.upperSumTotal,
      diff: viewer.upperSumTotal - opponent.upperSumTotal,
    },
    {
      key: "lower",
      label: "Untere Sektion",
      viewerValue: viewer.lowerSumTotal,
      opponentValue: opponent.lowerSumTotal,
      diff: viewer.lowerSumTotal - opponent.lowerSumTotal,
    },
    {
      key: "extraYatzy",
      label: "Zusatz Alle Fünfe",
      viewerValue: viewer.extraYatzyTotal,
      opponentValue: opponent.extraYatzyTotal,
      diff: viewer.extraYatzyTotal - opponent.extraYatzyTotal,
    },
  ];

  let decisiveGameIndex: number | null = null;
  let decisiveGameDiff = 0;
  for (let i = 0; i < viewer.gameTotals.length; i += 1) {
    const diff = viewer.gameTotals[i]! - (opponent.gameTotals[i] ?? 0);
    if (Math.abs(diff) > Math.abs(decisiveGameDiff)) {
      decisiveGameDiff = diff;
      decisiveGameIndex = i + 1;
    }
  }

  const viewerFields = aggregateFieldScores(viewerRun);
  const opponentFields = aggregateFieldScores(opponentRun);
  let decisiveFieldType: FieldTypeId | null = null;
  let decisiveFieldDiff = 0;
  for (const type of FIELD_TYPES_PER_GAME) {
    const diff = (viewerFields.get(type) ?? 0) - (opponentFields.get(type) ?? 0);
    if (Math.abs(diff) > Math.abs(decisiveFieldDiff)) {
      decisiveFieldDiff = diff;
      decisiveFieldType = type;
    }
  }

  let counterfactual: string | null = null;
  if (bonusDiff !== 0 && Math.abs(bonusDiff) <= Math.abs(scoreDiff)) {
    const withoutBonus = scoreDiff - bonusDiff;
    if (withoutBonus !== scoreDiff) {
      const verb = withoutBonus > 0 ? "hättest gewonnen" : withoutBonus < 0 ? "hättest verloren" : "wäre Remis gewesen";
      counterfactual = `Ohne Bonus-Unterschied (${bonusDiff > 0 ? "+" : ""}${bonusDiff}) ${verb} mit ${withoutBonus > 0 ? "+" : ""}${withoutBonus} Punkten.`;
    }
  }

  return {
    scoreDiff,
    winner,
    attribution,
    decisiveGameIndex,
    decisiveGameDiff,
    decisiveFieldType,
    decisiveFieldDiff,
    counterfactual,
  };
}

function buildSoloInsights(metrics: PlayerRunMetrics): string[] {
  const insights: string[] = [];
  if (metrics.useStrategyRules) {
    if (metrics.rollsInPool > 0) {
      insights.push(`End-Pool: ${metrics.rollsInPool} Würfe gespart.`);
    }
    if (metrics.pointsPerPoolRoll != null && metrics.poolRollCost > 0) {
      insights.push(
        `Pool-Einsatz: ${metrics.poolRollCost} eingekaufte Würfe → ${metrics.pointsPerPoolRoll.toFixed(1)} Pkt/Wurf.`,
      );
    }
    if (metrics.poolSpent > metrics.poolSpared) {
      insights.push("Mehr Pool verbraucht als gespart — prüfe teure Felder.");
    } else if (metrics.poolSpared > metrics.poolSpent) {
      insights.push("Netto mehr Würfe gespart als eingekauft.");
    }
  }
  if (metrics.bonusCount > 0) {
    insights.push(`Bonus in ${metrics.bonusCount}/${metrics.gameCount} Spiel${metrics.gameCount === 1 ? "" : "en"}.`);
  }
  if (metrics.yatzyHits + metrics.yatzyMisses > 0) {
    insights.push(`Alle Fünfe: ${metrics.yatzyHits}× Treffer, ${metrics.yatzyMisses}× gestrichen.`);
  }
  if (metrics.zeroEntries > 0) {
    insights.push(`${metrics.zeroEntries} Null-Einträge.`);
  }
  return insights.slice(0, 5);
}

function buildTwoPlayerInsights(
  viewer: PlayerRunMetrics,
  opponent: PlayerRunMetrics,
  h2h: HeadToHeadAnalysis,
): string[] {
  const insights: string[] = [];
  const sign = h2h.scoreDiff > 0 ? "+" : "";

  if (h2h.decisiveGameIndex != null && h2h.decisiveGameDiff !== 0) {
    insights.push(
      `Sp${h2h.decisiveGameIndex} war am einflussreichsten (${h2h.decisiveGameDiff > 0 ? "+" : ""}${h2h.decisiveGameDiff} vs. Gegner).`,
    );
  }

  if (h2h.decisiveFieldType != null && h2h.decisiveFieldDiff !== 0) {
    insights.push(
      `${fieldLabel(h2h.decisiveFieldType)}: größte Feld-Differenz (${h2h.decisiveFieldDiff > 0 ? "+" : ""}${h2h.decisiveFieldDiff}).`,
    );
  }

  const bonusRow = h2h.attribution.find((a) => a.key === "bonus");
  if (bonusRow && bonusRow.diff !== 0) {
    insights.push(
      `Bonus: ${viewer.bonusCount} vs. ${opponent.bonusCount} (${bonusRow.diff > 0 ? "+" : ""}${bonusRow.diff} Punkte).`,
    );
  }

  if (viewer.useStrategyRules) {
    const poolDiff = viewer.rollsInPool - opponent.rollsInPool;
    if (poolDiff !== 0) {
      insights.push(`End-Pool ${viewer.rollsInPool} vs. ${opponent.rollsInPool} (${poolDiff > 0 ? "+" : ""}${poolDiff}).`);
    }
    const viewerPpr = viewer.pointsPerPoolRoll;
    const oppPpr = opponent.pointsPerPoolRoll;
    if (viewerPpr != null && oppPpr != null && viewer.poolRollCost > 0 && opponent.poolRollCost > 0) {
      if (viewerPpr < oppPpr - 0.3) {
        insights.push(
          `Pool weniger effektiv (${viewerPpr.toFixed(1)} vs. ${oppPpr.toFixed(1)} Pkt/eingekaufter Wurf).`,
        );
      } else if (viewerPpr > oppPpr + 0.3) {
        insights.push(
          `Pool effektiver eingesetzt (${viewerPpr.toFixed(1)} vs. ${oppPpr.toFixed(1)} Pkt/eingekaufter Wurf).`,
        );
      }
    }
  }

  if (viewer.yatzyHits !== opponent.yatzyHits || viewer.yatzyMisses !== opponent.yatzyMisses) {
    insights.push(
      `Alle Fünfe: ${viewer.yatzyHits}/${viewer.yatzyMisses} (Treffer/Null) vs. ${opponent.yatzyHits}/${opponent.yatzyMisses}.`,
    );
  }

  if (h2h.counterfactual) {
    insights.push(h2h.counterfactual);
  } else {
    insights.push(`Ergebnis: ${sign}${h2h.scoreDiff} Punkte.`);
  }

  return insights.slice(0, 6);
}

function buildSessionRanking(
  participants: AnalysisParticipant[],
): SessionRankEntry[] {
  const sorted = [...participants].sort((a, b) => {
    const scoreDiff = b.run.totalScore - a.run.totalScore;
    if (scoreDiff !== 0) return scoreDiff;
    return a.orderIndex - b.orderIndex;
  });

  return sorted.map((entry, index) => ({
    playerId: entry.playerId,
    playerName: entry.playerName,
    orderIndex: entry.orderIndex,
    rank: index + 1,
    totalScore: entry.run.totalScore,
  }));
}

function buildMultiPlayerSessionInsights(
  viewerRank: number,
  playerCount: number,
  pointsBehindLeader: number,
  directWins: number,
  directLosses: number,
  directTies: number,
  viewer: PlayerRunMetrics,
  leaderScore: number,
): string[] {
  const insights: string[] = [];
  insights.push(
    `Platz ${viewerRank} von ${playerCount} · ${viewer.totalScore} Punkte${pointsBehindLeader > 0 ? ` · ${pointsBehindLeader} hinter dem Sieger (${leaderScore})` : " · Spitze"}.`,
  );
  if (playerCount > 2) {
    insights.push(
      `Direktvergleiche: ${directWins} Siege, ${directLosses} Niederlagen${directTies > 0 ? `, ${directTies} Remis` : ""}.`,
    );
  }
  insights.push(...buildSoloInsights(viewer));
  return insights.slice(0, 7);
}

const EMPTY_COACHING: MatchCoachingReport = {
  narrative: "",
  playStyle: null,
  strengths: [],
  weaknesses: [],
  tips: [],
  pool: null,
  fieldComparison: [],
};

function emptyMultiShell(viewer: PlayerRunMetrics, allPlayers: PlayerRunMetrics[]): Omit<
  MatchAnalysisResult,
  "mode" | "ready" | "unavailableReason" | "insights" | "coaching"
> {
  return {
    playerCount: allPlayers.length,
    viewerRank: null,
    pointsBehindLeader: null,
    directWins: 0,
    directLosses: 0,
    directTies: 0,
    viewer,
    opponent: null,
    headToHead: null,
    ranking: [],
    comparisons: [],
    allPlayers,
  };
}

export function buildMatchAnalysis(input: {
  mode: "solo" | "multi";
  ready: boolean;
  unavailableReason?: string | null;
  viewerPlayerId?: string;
  participants?: AnalysisParticipant[];
  viewerRun?: AnalysisRun;
}): MatchAnalysisResult {
  if (input.mode === "solo" && input.viewerRun) {
    const viewer = analyzePlayerRun(input.viewerRun);
    const allPlayers = [viewer];
    if (!input.ready) {
      return {
        mode: "solo",
        ready: false,
        unavailableReason: input.unavailableReason ?? "Analyse noch nicht verfügbar.",
        insights: [],
        coaching: EMPTY_COACHING,
        ...emptyMultiShell(viewer, allPlayers),
        playerCount: 1,
      };
    }
    const viewerRun = input.viewerRun;
    return {
      mode: "solo",
      ready: true,
      unavailableReason: null,
      playerCount: 1,
      viewerRank: 1,
      pointsBehindLeader: 0,
      directWins: 0,
      directLosses: 0,
      directTies: 0,
      viewer,
      opponent: null,
      headToHead: null,
      ranking: [],
      comparisons: [],
      insights: buildSoloInsights(viewer),
      allPlayers,
      coaching: buildMatchCoaching({
        mode: "solo",
        viewer,
        viewerRun,
      }),
    };
  }

  const participants = input.participants ?? [];
  const viewerParticipant = participants.find((p) => p.playerId === input.viewerPlayerId);
  const allPlayers = participants.map((p) => analyzePlayerRun(p.run));
  const viewer = viewerParticipant
    ? analyzePlayerRun(viewerParticipant.run)
    : allPlayers[0] ?? analyzePlayerRun({ gameCount: 0, useStrategyRules: true, totalScore: 0, totalRollsUsed: 0, rollsInPool: 0, extraYatzyCount: 0, games: [] });

  if (!input.ready) {
    return {
      mode: "multi",
      ready: false,
      unavailableReason: input.unavailableReason ?? "Analyse noch nicht verfügbar.",
      insights: [],
      coaching: EMPTY_COACHING,
      ...emptyMultiShell(viewer, allPlayers),
      playerCount: participants.length,
    };
  }

  if (!viewerParticipant || participants.length < 2) {
    const soloRun = viewerParticipant?.run ?? input.viewerRun;
    return {
      mode: "solo",
      ready: true,
      unavailableReason: null,
      playerCount: participants.length || 1,
      viewerRank: participants.length === 1 ? 1 : null,
      pointsBehindLeader: null,
      directWins: 0,
      directLosses: 0,
      directTies: 0,
      viewer,
      opponent: null,
      headToHead: null,
      ranking: [],
      comparisons: [],
      insights: buildSoloInsights(viewer),
      allPlayers,
      coaching: soloRun
        ? buildMatchCoaching({ mode: "solo", viewer, viewerRun: soloRun })
        : EMPTY_COACHING,
    };
  }

  const ranking = buildSessionRanking(participants);
  const viewerRankEntry = ranking.find((r) => r.playerId === viewerParticipant.playerId);
  const leader = ranking[0]!;
  const viewerRank = viewerRankEntry?.rank ?? participants.length;
  const pointsBehindLeader = Math.max(0, leader.totalScore - viewer.totalScore);

  const others = participants.filter((p) => p.playerId !== viewerParticipant.playerId);
  const comparisons: PlayerComparison[] = others.map((other) => {
    const opponent = analyzePlayerRun(other.run);
    const headToHead = buildHeadToHead(
      viewer,
      opponent,
      viewerParticipant.run,
      other.run,
    );
    return {
      opponentPlayerId: other.playerId,
      opponentName: other.playerName,
      opponentOrderIndex: other.orderIndex,
      opponent,
      headToHead,
    };
  });

  let directWins = 0;
  let directLosses = 0;
  let directTies = 0;
  for (const cmp of comparisons) {
    if (cmp.headToHead.winner === "viewer") directWins += 1;
    else if (cmp.headToHead.winner === "opponent") directLosses += 1;
    else directTies += 1;
  }

  const soleComparison = comparisons.length === 1 ? comparisons[0]! : null;
  const leaderParticipant = participants.find((p) => p.playerId === leader.playerId);
  const insights =
    comparisons.length === 1 && soleComparison
      ? buildTwoPlayerInsights(viewer, soleComparison.opponent, soleComparison.headToHead)
      : buildMultiPlayerSessionInsights(
          viewerRank,
          participants.length,
          pointsBehindLeader,
          directWins,
          directLosses,
          directTies,
          viewer,
          leader.totalScore,
        );

  const coaching =
    comparisons.length === 1 && soleComparison
      ? buildMatchCoaching({
          mode: "multi",
          viewer,
          viewerRun: viewerParticipant.run,
          opponent: soleComparison.opponent,
          opponentRun: others[0]!.run,
          headToHead: soleComparison.headToHead,
          opponentName: soleComparison.opponentName,
          playerCount: 2,
          viewerRank,
          pointsBehindLeader,
        })
      : buildMatchCoaching({
          mode: "multi",
          viewer,
          viewerRun: viewerParticipant.run,
          reference: leaderParticipant
            ? analyzePlayerRun(leaderParticipant.run)
            : null,
          referenceRun: leaderParticipant?.run ?? null,
          referenceName: leader.playerName,
          playerCount: participants.length,
          viewerRank,
          pointsBehindLeader,
        });

  return {
    mode: "multi",
    ready: true,
    unavailableReason: null,
    playerCount: participants.length,
    viewerRank,
    pointsBehindLeader,
    directWins,
    directLosses,
    directTies,
    viewer,
    opponent: soleComparison?.opponent ?? null,
    headToHead: soleComparison?.headToHead ?? null,
    ranking,
    comparisons,
    insights,
    allPlayers,
    coaching,
  };
}
