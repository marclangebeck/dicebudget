import { poolDeltaForComplete } from "./gameRules.js";
import { UPPER_BONUS_POINTS } from "./gameScoring.js";
import { FIELD_TYPES_PER_GAME, type FieldTypeId } from "./fieldTypes.js";
import {
  fieldLabel,
  type AnalysisRun,
  type HeadToHeadAnalysis,
  type PlayerRunMetrics,
} from "./matchAnalysis.js";

export type CoachingTrait = {
  kind: "strength" | "weakness";
  title: string;
  detail: string;
};

export type CoachingTip = {
  title: string;
  body: string;
};

export type PoolPurchaseRow = {
  fieldLabel: string;
  gameIndex: number;
  poolCost: number;
  points: number;
  pointsPerRoll: number;
};

export type PoolCoachingReport = {
  endPool: number;
  poolSpared: number;
  poolSpent: number;
  netBalance: number;
  pointsPerPoolRoll: number | null;
  opponentEndPool: number | null;
  poolLeadVsOpponent: number | null;
  headline: string;
  bestPurchases: PoolPurchaseRow[];
  weakPurchases: PoolPurchaseRow[];
  notes: string[];
};

export type FieldComparisonCell = {
  fieldType: FieldTypeId;
  label: string;
  viewer: number;
  reference: number;
  diff: number;
};

export type MatchCoachingReport = {
  narrative: string;
  playStyle: string | null;
  strengths: CoachingTrait[];
  weaknesses: CoachingTrait[];
  tips: CoachingTip[];
  pool: PoolCoachingReport | null;
  fieldComparison: FieldComparisonCell[];
};

type TraitCandidate = CoachingTrait & { weight: number };

function aggregateFieldScores(run: AnalysisRun): Map<FieldTypeId, number> {
  const totals = new Map<FieldTypeId, number>();
  for (const type of FIELD_TYPES_PER_GAME) totals.set(type, 0);
  for (const game of run.games) {
    for (const field of game.fields) {
      if (field.score === null) continue;
      const type = field.fieldType as FieldTypeId;
      totals.set(type, (totals.get(type) ?? 0) + field.score);
    }
  }
  return totals;
}

function extractPoolPurchases(run: AnalysisRun): PoolPurchaseRow[] {
  if (!run.useStrategyRules) return [];
  const rows: PoolPurchaseRow[] = [];
  for (const game of run.games) {
    for (const field of game.fields) {
      if (field.score === null) continue;
      const delta = poolDeltaForComplete(field.rollsUsed, true);
      if (delta.poolCost <= 0) continue;
      rows.push({
        fieldLabel: fieldLabel(field.fieldType as FieldTypeId),
        gameIndex: game.index,
        poolCost: delta.poolCost,
        points: field.score,
        pointsPerRoll: field.score / delta.poolCost,
      });
    }
  }
  return rows;
}

function bonusRate(metrics: PlayerRunMetrics): number {
  if (metrics.gameCount < 1) return 0;
  return metrics.bonusCount / metrics.gameCount;
}

function yatzyHitRate(metrics: PlayerRunMetrics): number | null {
  const total = metrics.yatzyHits + metrics.yatzyMisses;
  if (total < 1) return null;
  return metrics.yatzyHits / total;
}

function buildFieldComparison(
  viewerRun: AnalysisRun,
  referenceRun: AnalysisRun | null,
): FieldComparisonCell[] {
  const viewerFields = aggregateFieldScores(viewerRun);
  const refFields = referenceRun ? aggregateFieldScores(referenceRun) : viewerFields;
  return FIELD_TYPES_PER_GAME.map((fieldType) => {
    const viewer = viewerFields.get(fieldType) ?? 0;
    const reference = referenceRun ? (refFields.get(fieldType) ?? 0) : 0;
    return {
      fieldType,
      label: fieldLabel(fieldType),
      viewer,
      reference,
      diff: viewer - reference,
    };
  }).filter((cell) => cell.viewer !== 0 || cell.reference !== 0);
}

function inferPlayStyle(viewer: PlayerRunMetrics): string | null {
  if (!viewer.useStrategyRules) return null;
  const styles: string[] = [];
  if (viewer.rollsInPool >= 4 && viewer.poolSpared > viewer.poolSpent) {
    styles.push("Pool-Horter");
  }
  if (bonusRate(viewer) >= 0.5) styles.push("Bonus-Jäger");
  if (viewer.zeroEntries >= 3) styles.push("Risiko-Spieler");
  if (viewer.lowerSumTotal > viewer.upperSumTotal * 1.15) {
    styles.push("Kombinations-Spezialist");
  }
  if (styles.length < 1) return null;
  return styles.slice(0, 2).join(" · ");
}

function pushTrait(
  list: TraitCandidate[],
  kind: "strength" | "weakness",
  title: string,
  detail: string,
  weight: number,
) {
  if (weight < 1) return;
  list.push({ kind, title, detail, weight });
}

function buildTraits(
  viewer: PlayerRunMetrics,
  reference: PlayerRunMetrics | null,
  referenceName: string,
): { strengths: CoachingTrait[]; weaknesses: CoachingTrait[] } {
  const candidates: TraitCandidate[] = [];
  const ref = reference;
  const refLabel = reference ? referenceName : "Soll";

  const bonusDiff = ref ? viewer.bonusCount - ref.bonusCount : viewer.bonusCount;
  if (bonusDiff > 0) {
    pushTrait(
      candidates,
      "strength",
      "Bonus-Stärke",
      `${viewer.bonusCount}× Bonus vs. ${ref?.bonusCount ?? 0}× bei ${refLabel}.`,
      bonusDiff * 20,
    );
  } else if (bonusDiff < 0) {
    pushTrait(
      candidates,
      "weakness",
      "Bonus verpasst",
      `${ref?.bonusCount ?? 0}× Bonus bei ${refLabel}, du ${viewer.bonusCount}×.`,
      Math.abs(bonusDiff) * 20,
    );
  }

  if (ref) {
    const upperDiff = viewer.upperSumTotal - ref.upperSumTotal;
    if (upperDiff >= 12) {
      pushTrait(
        candidates,
        "strength",
        "Starke obere Sektion",
        `+${upperDiff} Punkte oben gegenüber ${refLabel}.`,
        upperDiff,
      );
    } else if (upperDiff <= -12) {
      pushTrait(
        candidates,
        "weakness",
        "Schwache obere Sektion",
        `${upperDiff} Punkte oben gegenüber ${refLabel}.`,
        Math.abs(upperDiff),
      );
    }

    const lowerDiff = viewer.lowerSumTotal - ref.lowerSumTotal;
    if (lowerDiff >= 15) {
      pushTrait(
        candidates,
        "strength",
        "Starke Kombinationen",
        `+${lowerDiff} Punkte unten gegenüber ${refLabel}.`,
        lowerDiff,
      );
    } else if (lowerDiff <= -15) {
      pushTrait(
        candidates,
        "weakness",
        "Schwache Kombinationen",
        `${lowerDiff} Punkte unten gegenüber ${refLabel}.`,
        Math.abs(lowerDiff),
      );
    }
  }

  if (viewer.useStrategyRules && ref?.useStrategyRules) {
    const poolLead = viewer.rollsInPool - ref.rollsInPool;
    if (poolLead >= 2) {
      pushTrait(
        candidates,
        "strength",
        "Pool-Vorsprung",
        `+${poolLead} End-Pool-Würfe gegenüber ${refLabel}.`,
        poolLead * 8,
      );
    } else if (poolLead <= -2) {
      pushTrait(
        candidates,
        "weakness",
        "Pool-Rückstand",
        `${poolLead} End-Pool-Würfe gegenüber ${refLabel}.`,
        Math.abs(poolLead) * 8,
      );
    }

    const viewerPpr = viewer.pointsPerPoolRoll;
    const refPpr = ref.pointsPerPoolRoll;
    if (
      viewerPpr != null &&
      refPpr != null &&
      viewer.poolRollCost >= 2 &&
      ref.poolRollCost >= 2
    ) {
      if (viewerPpr >= refPpr + 1.5) {
        pushTrait(
          candidates,
          "strength",
          "Effizienter Pool",
          `${viewerPpr.toFixed(1)} Pkt./Pool-Wurf vs. ${refPpr.toFixed(1)} bei ${refLabel}.`,
          (viewerPpr - refPpr) * 10,
        );
      } else if (viewerPpr <= refPpr - 1.5) {
        pushTrait(
          candidates,
          "weakness",
          "Teurer Pool",
          `${viewerPpr.toFixed(1)} Pkt./Pool-Wurf vs. ${refPpr.toFixed(1)} bei ${refLabel}.`,
          (refPpr - viewerPpr) * 10,
        );
      }
    }
  }

  const viewerYatzy = yatzyHitRate(viewer);
  const refYatzy = ref ? yatzyHitRate(ref) : null;
  if (viewerYatzy != null) {
    if (viewerYatzy >= 0.66 && (refYatzy == null || viewerYatzy > refYatzy + 0.2)) {
      pushTrait(
        candidates,
        "strength",
        "Sichere Alle Fünfe",
        `${viewer.yatzyHits} Treffer, ${viewer.yatzyMisses} gestrichen.`,
        viewer.yatzyHits * 12,
      );
    } else if (viewer.yatzyMisses >= 1 && viewerYatzy < 0.5) {
      pushTrait(
        candidates,
        "weakness",
        "Alle-Fünfe-Risiko",
        `${viewer.yatzyMisses}× Alle Fünfe gestrichen.`,
        viewer.yatzyMisses * 14,
      );
    }
  }

  if (viewer.zeroEntries >= 2) {
    pushTrait(
      candidates,
      "weakness",
      "Viele Nullen",
      `${viewer.zeroEntries} Null-Einträge — viele Chancen verschenkt.`,
      viewer.zeroEntries * 6,
    );
  } else if (ref && viewer.zeroEntries + 1 <= ref.zeroEntries) {
    pushTrait(
      candidates,
      "strength",
      "Saubere Felder",
      `Nur ${viewer.zeroEntries} Null-Einträge.`,
      8,
    );
  }

  const strengths = candidates
    .filter((c) => c.kind === "strength")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map(({ weight: _w, kind, title, detail }) => ({ kind, title, detail }));
  const weaknesses = candidates
    .filter((c) => c.kind === "weakness")
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .map(({ weight: _w, kind, title, detail }) => ({ kind, title, detail }));

  return { strengths, weaknesses };
}

function buildPoolReport(
  viewer: PlayerRunMetrics,
  viewerRun: AnalysisRun,
  opponent: PlayerRunMetrics | null,
): PoolCoachingReport | null {
  if (!viewer.useStrategyRules) return null;

  const purchases = extractPoolPurchases(viewerRun);
  const sorted = [...purchases].sort((a, b) => b.pointsPerRoll - a.pointsPerRoll);
  const bestPurchases = sorted.filter((p) => p.pointsPerRoll >= 8).slice(0, 3);
  const weakPurchases = [...purchases]
    .filter((p) => p.pointsPerRoll < 8 || p.points <= 10)
    .sort((a, b) => a.pointsPerRoll - b.pointsPerRoll)
    .slice(0, 3);

  const netBalance = viewer.poolSpared - viewer.poolSpent;
  const poolLead = opponent ? viewer.rollsInPool - opponent.rollsInPool : null;

  const notes: string[] = [];
  if (netBalance > 0) notes.push(`Netto ${netBalance} Würfe mehr gespart als eingekauft.`);
  else if (netBalance < 0) notes.push(`Netto ${Math.abs(netBalance)} Würfe mehr eingekauft als gespart.`);
  if (poolLead != null && poolLead !== 0) {
    notes.push(
      poolLead > 0
        ? `End-Pool +${poolLead} gegenüber dem Gegner.`
        : `End-Pool ${poolLead} gegenüber dem Gegner.`,
    );
  }
  if (viewer.pointsPerPoolRoll != null && viewer.poolRollCost > 0) {
    notes.push(
      `Eingekaufte Würfe bringen Ø ${viewer.pointsPerPoolRoll.toFixed(1)} Punkte.`,
    );
  }

  let headline = "Ausgewogene Pool-Nutzung";
  if (viewer.rollsInPool >= 5 && netBalance > 0) headline = "Starker End-Pool durch Sparen";
  else if (viewer.poolSpent > viewer.poolSpared + 2) headline = "Viel Pool verbraucht";
  else if (weakPurchases.length >= 2) headline = "Pool-Käufe oft zu teuer";

  return {
    endPool: viewer.rollsInPool,
    poolSpared: viewer.poolSpared,
    poolSpent: viewer.poolSpent,
    netBalance,
    pointsPerPoolRoll: viewer.pointsPerPoolRoll,
    opponentEndPool: opponent?.rollsInPool ?? null,
    poolLeadVsOpponent: poolLead,
    headline,
    bestPurchases,
    weakPurchases,
    notes,
  };
}

function buildTwoPlayerNarrative(
  h2h: HeadToHeadAnalysis,
  opponentName: string,
): string {
  const diff = h2h.scoreDiff;
  const absDiff = Math.abs(diff);
  const outcome =
    diff > 0
      ? `Du gewinnst mit +${absDiff} Punkten`
      : diff < 0
        ? `Du verlierst mit −${absDiff} Punkten`
        : "Unentschieden";

  const sorted = [...h2h.attribution]
    .filter((row) => row.diff !== 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));

  const parts: string[] = [`${outcome} gegen ${opponentName}.`];

  if (sorted[0]) {
    const row = sorted[0];
    parts.push(
      `Hauptgrund: ${row.label} (${row.diff > 0 ? "+" : ""}${row.diff}).`,
    );
  }
  if (sorted[1] && Math.abs(sorted[1].diff) >= 8) {
    const row = sorted[1];
    parts.push(`Zweitgrößter Faktor: ${row.label} (${row.diff > 0 ? "+" : ""}${row.diff}).`);
  }
  if (h2h.decisiveGameIndex != null && h2h.decisiveGameDiff !== 0) {
    parts.push(
      `Entscheidendster Block: Spiel ${h2h.decisiveGameIndex} (${h2h.decisiveGameDiff > 0 ? "+" : ""}${h2h.decisiveGameDiff}).`,
    );
  }
  if (h2h.counterfactual) parts.push(h2h.counterfactual);

  return parts.join(" ");
}

function buildLeaderNarrative(
  viewerRank: number,
  playerCount: number,
  pointsBehindLeader: number,
  leaderName: string,
  viewer: PlayerRunMetrics,
  leader: PlayerRunMetrics,
): string {
  if (viewerRank === 1) {
    return `Du gewinnst die Runde mit ${viewer.totalScore} Punkten vor ${playerCount - 1} Mitspieler${playerCount === 2 ? "" : "n"}.`;
  }
  const sortedReasons: { label: string; diff: number }[] = [
    {
      label: "Bonus",
      diff: (viewer.bonusCount - leader.bonusCount) * UPPER_BONUS_POINTS,
    },
    { label: "Obere Sektion", diff: viewer.upperSumTotal - leader.upperSumTotal },
    { label: "Untere Sektion", diff: viewer.lowerSumTotal - leader.lowerSumTotal },
    { label: "Zusatz Alle Fünfe", diff: viewer.extraYatzyTotal - leader.extraYatzyTotal },
  ]
    .filter((r) => r.diff !== 0)
    .sort((a, b) => Math.abs(a.diff) - Math.abs(b.diff))
    .reverse();

  let text = `Platz ${viewerRank} von ${playerCount} — ${pointsBehindLeader} Punkte hinter ${leaderName}.`;
  if (sortedReasons[0]) {
    const r = sortedReasons[0];
    text += ` Größter Abstand: ${r.label} (${r.diff > 0 ? "+" : ""}${r.diff}).`;
  }
  return text;
}

function buildSoloNarrative(viewer: PlayerRunMetrics): string {
  const parts: string[] = [`Einzelspiel mit ${viewer.totalScore} Punkten über ${viewer.gameCount} Block${viewer.gameCount === 1 ? "" : "e"}.`];
  if (viewer.bonusCount > 0) {
    parts.push(`Bonus in ${viewer.bonusCount}/${viewer.gameCount} Blöcken.`);
  }
  if (viewer.useStrategyRules && viewer.rollsInPool > 0) {
    parts.push(`End-Pool: ${viewer.rollsInPool} Würfe.`);
  }
  return parts.join(" ");
}

type TipCandidate = CoachingTip & { impact: number };

function buildTips(
  viewer: PlayerRunMetrics,
  reference: PlayerRunMetrics | null,
  h2h: HeadToHeadAnalysis | null,
  pool: PoolCoachingReport | null,
): CoachingTip[] {
  const tips: TipCandidate[] = [];

  if (reference && viewer.bonusCount < reference.bonusCount) {
    tips.push({
      impact: (reference.bonusCount - viewer.bonusCount) * 25,
      title: "Bonus priorisieren",
      body: "Obere Felder früher mit 3 Würfen füllen — der +35-Bonus wiegt oft mehr als ein riskantes Kombinationsfeld.",
    });
  }

  if (
    pool &&
    pool.weakPurchases.length > 0 &&
    viewer.pointsPerPoolRoll != null &&
    viewer.pointsPerPoolRoll < 10
  ) {
    tips.push({
      impact: 30,
      title: "Pool sparsamer einsetzen",
      body: "Kaufe Pool-Würfe vor allem für Felder mit hoher Punktewahrscheinlichkeit (Full House, Straßen, Alle Fünfe) — nicht für kleine obere Felder.",
    });
  }

  if (viewer.yatzyMisses >= 1 && (yatzyHitRate(viewer) ?? 1) < 0.5) {
    tips.push({
      impact: viewer.yatzyMisses * 15,
      title: "Alle-Fünfe-Timing",
      body: "Alle Fünfe erst streichen, wenn du ein anderes Feld mit ähnlicher Erwartung hast — oder bewusst früh riskieren, wenn oben noch Lücken sind.",
    });
  }

  if (viewer.zeroEntries >= 2) {
    tips.push({
      impact: viewer.zeroEntries * 8,
      title: "Nullen reduzieren",
      body: "Lieber ein sicheres unteres Feld mit wenigen Punkten als eine Null — besonders wenn der Bonus noch offen ist.",
    });
  }

  if (h2h?.decisiveFieldType && h2h.decisiveFieldDiff < -10) {
    tips.push({
      impact: Math.abs(h2h.decisiveFieldDiff),
      title: `${fieldLabel(h2h.decisiveFieldType)} verbessern`,
      body: `Hier war die größte Feld-Differenz (${h2h.decisiveFieldDiff}). Beim nächsten Mal dieses Feld früher oder mit mehr Pool-Würfen angehen.`,
    });
  }

  if (reference && viewer.useStrategyRules && viewer.rollsInPool < reference.rollsInPool - 2) {
    tips.push({
      impact: (reference.rollsInPool - viewer.rollsInPool) * 6,
      title: "Mehr Pool aufbauen",
      body: "Mit 2 Würfen auf starke obere Felder sparen, um später teure Kombinationen kaufen zu können.",
    });
  }

  if (tips.length < 1 && viewer.bonusCount === 0 && viewer.gameCount > 0) {
    tips.push({
      impact: 10,
      title: "Obere Sektion stabilisieren",
      body: "Pro Augenzahl im Schnitt 3 Treffer anstreben — das ist die Basis für den Bonus.",
    });
  }

  return tips
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3)
    .map(({ impact: _i, ...tip }) => tip);
}

export function buildMatchCoaching(input: {
  mode: "solo" | "multi";
  viewer: PlayerRunMetrics;
  viewerRun: AnalysisRun;
  opponent?: PlayerRunMetrics | null;
  opponentRun?: AnalysisRun | null;
  headToHead?: HeadToHeadAnalysis | null;
  reference?: PlayerRunMetrics | null;
  referenceRun?: AnalysisRun | null;
  referenceName?: string;
  opponentName?: string;
  playerCount?: number;
  viewerRank?: number | null;
  pointsBehindLeader?: number | null;
}): MatchCoachingReport {
  const {
    mode,
    viewer,
    viewerRun,
    opponent = null,
    opponentRun = null,
    headToHead = null,
    reference = opponent ?? input.reference ?? null,
    referenceRun = opponentRun ?? input.referenceRun ?? null,
    referenceName = input.opponentName ?? input.referenceName ?? "Vergleich",
    opponentName = input.opponentName ?? "Gegner",
  } = input;

  let narrative: string;
  if (mode === "solo") {
    narrative = buildSoloNarrative(viewer);
  } else if (headToHead && input.playerCount === 2) {
    narrative = buildTwoPlayerNarrative(headToHead, opponentName);
  } else if (
    input.viewerRank != null &&
    input.playerCount != null &&
    input.playerCount > 2 &&
    reference
  ) {
    narrative = buildLeaderNarrative(
      input.viewerRank,
      input.playerCount,
      input.pointsBehindLeader ?? 0,
      referenceName,
      viewer,
      reference,
    );
  } else {
    narrative = `Dein Ergebnis: ${viewer.totalScore} Punkte.`;
  }

  const { strengths, weaknesses } = buildTraits(viewer, reference, referenceName);
  const pool = buildPoolReport(viewer, viewerRun, opponent ?? reference);
  const tips = buildTips(viewer, reference, headToHead, pool);
  const fieldComparison = buildFieldComparison(viewerRun, referenceRun);
  const playStyle = inferPlayStyle(viewer);

  return {
    narrative,
    playStyle,
    strengths,
    weaknesses,
    tips,
    pool,
    fieldComparison,
  };
}
