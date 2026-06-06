import { poolDeltaForComplete } from "./gameRules.js";
import {
  UPPER_BONUS_POINTS,
  type GameBreakdown,
} from "./gameScoring.js";
import { FIELD_TYPES_PER_GAME, type FieldTypeId } from "./fieldTypes.js";

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

export type MatchAnalysisResult = {
  mode: "solo" | "multi";
  ready: boolean;
  unavailableReason: string | null;
  viewer: PlayerRunMetrics;
  opponent: PlayerRunMetrics | null;
  headToHead: HeadToHeadAnalysis | null;
  insights: string[];
  /** Vorbereitet für x-Spieler: alle Teilnehmer-Metriken in Session-Reihenfolge. */
  allPlayers: PlayerRunMetrics[];
};

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
  KNIFFEL: "Yatzy",
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
      label: "Zusatz-Yatzy",
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
    insights.push(`Yatzy: ${metrics.yatzyHits}× Treffer, ${metrics.yatzyMisses}× gestrichen.`);
  }
  if (metrics.zeroEntries > 0) {
    insights.push(`${metrics.zeroEntries} Null-Einträge.`);
  }
  return insights.slice(0, 5);
}

function buildMultiInsights(
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
      `Yatzy: ${viewer.yatzyHits}/${viewer.yatzyMisses} (Treffer/Null) vs. ${opponent.yatzyHits}/${opponent.yatzyMisses}.`,
    );
  }

  if (h2h.counterfactual) {
    insights.push(h2h.counterfactual);
  } else {
    insights.push(`Ergebnis: ${sign}${h2h.scoreDiff} Punkte.`);
  }

  return insights.slice(0, 6);
}

export function buildMatchAnalysis(input: {
  mode: "solo" | "multi";
  ready: boolean;
  unavailableReason?: string | null;
  viewerRun: AnalysisRun;
  opponentRun?: AnalysisRun | null;
  allRuns?: AnalysisRun[];
}): MatchAnalysisResult {
  const viewer = analyzePlayerRun(input.viewerRun);
  const allPlayers = (input.allRuns ?? [input.viewerRun]).map(analyzePlayerRun);
  const opponent = input.opponentRun ? analyzePlayerRun(input.opponentRun) : null;

  if (!input.ready) {
    return {
      mode: input.mode,
      ready: false,
      unavailableReason: input.unavailableReason ?? "Analyse noch nicht verfügbar.",
      viewer,
      opponent,
      headToHead: null,
      insights: [],
      allPlayers,
    };
  }

  if (input.mode === "solo" || !opponent || !input.opponentRun) {
    return {
      mode: "solo",
      ready: true,
      unavailableReason: null,
      viewer,
      opponent: null,
      headToHead: null,
      insights: buildSoloInsights(viewer),
      allPlayers,
    };
  }

  const headToHead = buildHeadToHead(viewer, opponent, input.viewerRun, input.opponentRun);
  return {
    mode: "multi",
    ready: true,
    unavailableReason: null,
    viewer,
    opponent,
    headToHead,
    insights: buildMultiInsights(viewer, opponent, headToHead),
    allPlayers,
  };
}
