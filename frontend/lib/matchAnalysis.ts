import { poolDeltaForComplete } from "@/lib/gameRules";
import {
  UPPER_BONUS_POINTS,
} from "@/lib/gameScoring";
import { FIELD_LABELS, LOWER_FIELD_TYPES } from "@/lib/labels";
import type {
  MatchAnalysisDto,
  PlayerRunMetricsDto,
} from "@/lib/matchAnalysisTypes";
import type { FieldTypeId, RunDto } from "@/lib/types";

const LOWER_COMBO_TYPES: FieldTypeId[] = LOWER_FIELD_TYPES.filter(
  (t) => t !== "KNIFFEL" && t !== "CHANCE",
);

export function analyzeRunDto(run: RunDto): PlayerRunMetricsDto {
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
  const lowerComboHits: Record<string, number> = {};
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

      if (field.fieldType === "KNIFFEL") {
        if (field.score >= 50) yatzyHits += 1;
        else if (field.score === 0) yatzyMisses += 1;
        if (field.yatzyDieValue != null) yatzyDieValues.push(field.yatzyDieValue);
      }

      if (LOWER_COMBO_TYPES.includes(field.fieldType) && field.score > 0) {
        lowerComboHits[field.fieldType] = (lowerComboHits[field.fieldType] ?? 0) + 1;
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

function buildSoloInsights(metrics: PlayerRunMetricsDto): string[] {
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
    insights.push(
      `Bonus in ${metrics.bonusCount}/${metrics.gameCount} Spiel${metrics.gameCount === 1 ? "" : "en"}.`,
    );
  }
  if (metrics.yatzyHits + metrics.yatzyMisses > 0) {
    insights.push(`Yatzy: ${metrics.yatzyHits}× Treffer, ${metrics.yatzyMisses}× gestrichen.`);
  }
  if (metrics.zeroEntries > 0) {
    insights.push(`${metrics.zeroEntries} Null-Einträge.`);
  }
  return insights.slice(0, 5);
}

export function buildSoloMatchAnalysis(run: RunDto): MatchAnalysisDto {
  const viewer = analyzeRunDto(run);
  const finished = run.status === "FINISHED";
  return {
    mode: "solo",
    ready: finished,
    unavailableReason: finished ? null : "Analyse erst nach Run-Abschluss verfügbar.",
    playerCount: 1,
    viewerRank: finished ? 1 : null,
    pointsBehindLeader: finished ? 0 : null,
    directWins: 0,
    directLosses: 0,
    directTies: 0,
    viewer,
    opponent: null,
    headToHead: null,
    ranking: [],
    comparisons: [],
    insights: finished ? buildSoloInsights(viewer) : [],
    allPlayers: [viewer],
  };
}

export function fieldLabelForAnalysis(fieldType: string): string {
  return FIELD_LABELS[fieldType as FieldTypeId] ?? fieldType;
}
