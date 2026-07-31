import { prisma } from "../db/prisma.js";
import {
  burnPoolCost,
  COLUMN_POOL_BONUS,
  countOpenUpperFields,
  hasAnyFullFieldTypeRow,
  isBurnMode,
  isRunUpperComplete,
  newlyAchievedColumnGoal,
  qualifiesYatzyStreakPenalty,
  qualifiesYatzyTriplePenalty,
  runHasAnyColumnFullCombo,
  runHasAnyColumnLowerComplete,
  runHasAnyColumnUpperBonus,
  yatzyStreakPenaltyMarker,
  yatzyTriplePenaltyMarker,
  type BurnMode,
} from "../domain/houseRules.js";
import { RUN_STATUS } from "../domain/fieldTypes.js";
import { getRunById } from "./getRun.js";
import { assertRunPlayerAccess } from "./runPlayerAuth.js";
import {
  FieldNotFoundError,
  RollLimitError,
  RunNotActiveError,
  RunNotFoundError,
} from "./playField.js";

export class HouseRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "HouseRuleError";
  }
}

export class RollSaleNotAvailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RollSaleNotAvailableError";
  }
}

export type HouseRuleAutoEvent =
  | {
      type: "yatzy_streak_penalty";
      poolsLost: number;
      victimPlayerId: string;
      victimPlayerName: string;
    }
  | {
      type: "yatzy_triple_penalty";
      poolsLost: number;
      victimPlayerId: string;
      victimPlayerName: string;
    }
  | {
      type: "upper_race_pool";
      poolsGained: number;
    }
  | {
      type: "column_pool_upper";
      poolsGained: number;
    }
  | {
      type: "column_pool_lower";
      poolsGained: number;
    }
  | {
      type: "column_pool_combo";
      poolsGained: number;
    };

async function loadActiveRun(runId: string) {
  const run = await prisma.run.findUnique({
    where: { id: runId },
    include: {
      games: {
        orderBy: { index: "asc" },
        include: { fields: { orderBy: { fieldType: "asc" } } },
      },
    },
  });
  if (!run) throw new RunNotFoundError();
  if (run.status !== RUN_STATUS.ACTIVE) throw new RunNotActiveError();
  return run;
}

/** Brennt: Pool abziehen am Anfang eines Wurfes (Feld gewählt, noch nicht eingetragen). */
export async function applyBurnRoll(
  runId: string,
  fieldId: string,
  mode: BurnMode = "reroll",
  playerSecret?: string,
) {
  if (!isBurnMode(mode)) {
    throw new HouseRuleError("Ungültige Brennt-Option");
  }
  await assertRunPlayerAccess(runId, playerSecret);
  const run = await loadActiveRun(runId);
  if (!run.useStrategyRules) {
    throw new HouseRuleError("Brennt ist nur im Strategy-Modus verfügbar");
  }

  const field = run.games.flatMap((g) => g.fields).find((f) => f.id === fieldId);
  if (!field) throw new FieldNotFoundError();
  if (field.score !== null) {
    throw new HouseRuleError("Brennt nur am Anfang eines Wurfes (Feld noch leer)");
  }
  if (field.rollsUsed > 0) {
    throw new HouseRuleError("Brennt nur am Anfang eines Wurfes");
  }

  const cost = burnPoolCost(mode);
  if (run.rollsInPool < cost) {
    throw new RollLimitError(
      `Nicht genug Pool für Brennt (benötigt ${cost}, vorhanden ${run.rollsInPool})`,
    );
  }

  await prisma.run.update({
    where: { id: runId },
    data: { rollsInPool: { decrement: cost } },
  });

  return getRunById(runId);
}

/** 2× Alle Fünfe (≤3 Würfe): Gegner verliert die Hälfte des Pools (abrunden). */
export async function applyYatzyStreakPenalty(
  runId: string,
  victimPlayerId: string,
  playerSecret?: string,
) {
  await assertRunPlayerAccess(runId, playerSecret);

  const beneficiary = await prisma.player.findFirst({
    where: { runId },
    include: { session: { include: { players: true } } },
  });
  if (!beneficiary?.session) {
    throw new HouseRuleError("Strafe nur im Multiplayer verfügbar");
  }

  const victim = beneficiary.session.players.find((p) => p.id === victimPlayerId);
  if (!victim) {
    throw new HouseRuleError("Spieler nicht in dieser Session");
  }
  if (victim.id === beneficiary.id) {
    throw new HouseRuleError("Gegner muss ein anderer Spieler sein");
  }

  const beneficiaryRun = await loadActiveRun(runId);
  if (!beneficiaryRun.useStrategyRules) {
    throw new HouseRuleError("Strafe nur im Strategy-Modus verfügbar");
  }

  const allFields = beneficiaryRun.games.flatMap((g) => g.fields);
  if (!qualifiesYatzyStreakPenalty(allFields)) {
    throw new HouseRuleError(
      "Die letzten beiden Einträge müssen Alle Fünfe mit höchstens 3 Würfen sein",
    );
  }

  const victimRun = await loadActiveRun(victim.runId);
  const newPool = Math.floor(victimRun.rollsInPool / 2);
  const marker = yatzyStreakPenaltyMarker(allFields);

  await prisma.$transaction(async (tx) => {
    await tx.run.update({
      where: { id: victim.runId },
      data: { rollsInPool: newPool },
    });
    if (marker != null) {
      await tx.run.update({
        where: { id: runId },
        data: { yatzyStreakPenaltyAtSequence: marker },
      });
    }
  });

  return {
    beneficiaryRun: await getRunById(runId),
    victimRun: await getRunById(victim.runId),
    victimPlayerId: victim.id,
    victimPlayerName: victim.name,
    poolsLost: victimRun.rollsInPool - newPool,
  };
}

/** Wurf verkaufen: Pool-Transfer; Verkäufer erhält Freifeld-Modus. */
export async function applyRollSale(
  inviteCode: string,
  input: {
    sellerPlayerId: string;
    buyerPlayerId: string;
    pools: number;
  },
  initiatorSecret?: string,
) {
  const pools = Number(input.pools);
  if (!Number.isInteger(pools) || pools < 1) {
    throw new HouseRuleError("Pool-Anzahl muss eine positive ganze Zahl sein");
  }

  const session = await prisma.gameSession.findUnique({
    where: { inviteCode },
    include: {
      players: {
        orderBy: { orderIndex: "asc" },
        include: {
          run: {
            include: {
              games: {
                orderBy: { index: "asc" },
                include: { fields: true },
              },
            },
          },
        },
      },
    },
  });
  if (!session) throw new HouseRuleError("Session nicht gefunden");
  if (!session.useStrategyRules) {
    throw new HouseRuleError("Verkauf nur im Strategy-Modus verfügbar");
  }

  const initiator = session.players.find((p) => p.secretToken === initiatorSecret);
  if (!initiatorSecret || !initiator) {
    throw new HouseRuleError("Ungültiger Spieler-Secret");
  }

  const seller = session.players.find((p) => p.id === input.sellerPlayerId);
  const buyer = session.players.find((p) => p.id === input.buyerPlayerId);
  if (!seller || !buyer) {
    throw new HouseRuleError("Verkäufer oder Käufer nicht in dieser Session");
  }
  if (seller.id === buyer.id) {
    throw new HouseRuleError("Verkäufer und Käufer müssen verschieden sein");
  }

  if (seller.run.status !== RUN_STATUS.ACTIVE || buyer.run.status !== RUN_STATUS.ACTIVE) {
    throw new RollSaleNotAvailableError("Beide Runs müssen aktiv sein");
  }
  if (seller.run.rollSaleFreeFillActive) {
    throw new RollSaleNotAvailableError("Verkäufer hat noch ein offenes Verkaufs-Freifeld");
  }
  if (!hasAnyFullFieldTypeRow(seller.run.games)) {
    throw new RollSaleNotAvailableError(
      "Mindestens eine Feldzeile muss voll sein (z. B. alle Gr. Straßen)",
    );
  }
  if (buyer.run.rollsInPool < pools) {
    throw new RollLimitError(
      `Käufer hat nicht genug Pool (benötigt ${pools}, vorhanden ${buyer.run.rollsInPool})`,
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.run.update({
      where: { id: buyer.runId },
      data: { rollsInPool: { decrement: pools } },
    });
    await tx.run.update({
      where: { id: seller.runId },
      data: {
        rollsInPool: { increment: pools },
        rollSaleFreeFillActive: true,
      },
    });
  });

  return {
    sellerRun: await getRunById(seller.runId),
    buyerRun: await getRunById(buyer.runId),
    sellerPlayerId: seller.id,
    buyerPlayerId: buyer.id,
    pools,
  };
}

type RunSnapshotForAuto = {
  id: string;
  useStrategyRules: boolean;
  upperRacePoolCredited: boolean;
  yatzyStreakPenaltyAtSequence: number | null;
  yatzyTriplePenaltyAtSequence: number | null;
  games: { fields: { fieldType: string; score: number | null; rollsUsed: number; scoredSequence: number | null }[] }[];
};

/**
 * Nach Feldeintrag: automatische Hausregeln (Strategy + Session).
 * Duell (2 Spieler): 2×/3× Alle Fünfe, Oberer-Bereich-Race.
 * Beliebige Spielerzahl: Spalten-Pool-Boni (M40), nur Erster in der Session.
 */
export async function applyAutoHouseRulesAfterComplete(
  runId: string,
  before: RunSnapshotForAuto,
): Promise<{ events: HouseRuleAutoEvent[] }> {
  const events: HouseRuleAutoEvent[] = [];
  if (!before.useStrategyRules) return { events };

  const beneficiary = await prisma.player.findFirst({
    where: { runId },
    include: {
      run: {
        include: {
          games: {
            orderBy: { index: "asc" },
            include: { fields: true },
          },
        },
      },
      session: {
        include: {
          players: {
            include: {
              run: {
                include: {
                  games: {
                    orderBy: { index: "asc" },
                    include: { fields: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
  if (!beneficiary?.session) {
    return { events };
  }

  const session = beneficiary.session;
  const afterRun = beneficiary.run;
  const fieldsBefore = before.games.flatMap((g) => g.fields);
  const fieldsAfter = afterRun.games.flatMap((g) => g.fields);

  if (session.players.length === 2) {
    const opponent = session.players.find((p) => p.id !== beneficiary.id);
    if (opponent) {
      let appliedYatzyPenalty = false;

      if (session.ruleYatzyTriple) {
        const tripleMarker = yatzyTriplePenaltyMarker(fieldsAfter);
        const tripleBefore = qualifiesYatzyTriplePenalty(fieldsBefore);
        const tripleAlready =
          tripleMarker != null &&
          before.yatzyTriplePenaltyAtSequence != null &&
          before.yatzyTriplePenaltyAtSequence >= tripleMarker;

        if (!tripleBefore && tripleMarker != null && !tripleAlready) {
          const victimRun = opponent.run;
          const poolsLost = victimRun.rollsInPool;
          await prisma.$transaction(async (tx) => {
            await tx.run.update({
              where: { id: victimRun.id },
              data: { rollsInPool: 0 },
            });
            await tx.run.update({
              where: { id: runId },
              data: { yatzyTriplePenaltyAtSequence: tripleMarker },
            });
          });
          events.push({
            type: "yatzy_triple_penalty",
            poolsLost,
            victimPlayerId: opponent.id,
            victimPlayerName: opponent.name,
          });
          appliedYatzyPenalty = true;
        }
      }

      if (session.ruleYatzyStreak2 && !appliedYatzyPenalty) {
        const markerAfter = yatzyStreakPenaltyMarker(fieldsAfter);
        const qualifiedBefore = qualifiesYatzyStreakPenalty(fieldsBefore);
        const alreadyApplied =
          markerAfter != null &&
          before.yatzyStreakPenaltyAtSequence != null &&
          before.yatzyStreakPenaltyAtSequence >= markerAfter;

        if (!qualifiedBefore && markerAfter != null && !alreadyApplied) {
          const victimRun = opponent.run;
          const oldPool = victimRun.rollsInPool;
          const newPool = Math.floor(oldPool / 2);
          const poolsLost = oldPool - newPool;
          await prisma.$transaction(async (tx) => {
            await tx.run.update({
              where: { id: victimRun.id },
              data: { rollsInPool: newPool },
            });
            await tx.run.update({
              where: { id: runId },
              data: { yatzyStreakPenaltyAtSequence: markerAfter },
            });
          });
          events.push({
            type: "yatzy_streak_penalty",
            poolsLost,
            victimPlayerId: opponent.id,
            victimPlayerName: opponent.name,
          });
        }
      }

      if (session.ruleUpperRace) {
        const upperBefore = isRunUpperComplete(before.games);
        const upperAfter = isRunUpperComplete(afterRun.games);
        if (!upperBefore && upperAfter && !before.upperRacePoolCredited) {
          const openUpper = countOpenUpperFields(opponent.run.games);
          if (openUpper > 0) {
            await prisma.run.update({
              where: { id: runId },
              data: {
                rollsInPool: { increment: openUpper },
                upperRacePoolCredited: true,
              },
            });
            events.push({ type: "upper_race_pool", poolsGained: openUpper });
          } else {
            await prisma.run.update({
              where: { id: runId },
              data: { upperRacePoolCredited: true },
            });
          }
        }
      }
    }
  }

  if (session.ruleColumnPoolBonuses) {
    // Frische Session-Flags lesen (Race: nur Erster gewinnt).
    const sessionFlags = await prisma.gameSession.findUnique({
      where: { id: session.id },
      select: {
        columnPoolUpperCredited: true,
        columnPoolLowerCredited: true,
        columnPoolComboCredited: true,
      },
    });
    if (sessionFlags) {
      const awardUpper =
        !sessionFlags.columnPoolUpperCredited &&
        newlyAchievedColumnGoal(
          before.games,
          afterRun.games,
          runHasAnyColumnUpperBonus,
        );
      const awardLower =
        !sessionFlags.columnPoolLowerCredited &&
        newlyAchievedColumnGoal(
          before.games,
          afterRun.games,
          runHasAnyColumnLowerComplete,
        );
      const awardCombo =
        !sessionFlags.columnPoolComboCredited &&
        newlyAchievedColumnGoal(
          before.games,
          afterRun.games,
          runHasAnyColumnFullCombo,
        );

      if (awardUpper || awardLower || awardCombo) {
        const awarded: HouseRuleAutoEvent[] = [];
        await prisma.$transaction(async (tx) => {
          const fresh = await tx.gameSession.findUnique({
            where: { id: session.id },
            select: {
              columnPoolUpperCredited: true,
              columnPoolLowerCredited: true,
              columnPoolComboCredited: true,
            },
          });
          if (!fresh) return;

          const doUpper = awardUpper && !fresh.columnPoolUpperCredited;
          const doLower = awardLower && !fresh.columnPoolLowerCredited;
          const doCombo = awardCombo && !fresh.columnPoolComboCredited;
          const actualGain =
            (doUpper ? COLUMN_POOL_BONUS : 0) +
            (doLower ? COLUMN_POOL_BONUS : 0) +
            (doCombo ? COLUMN_POOL_BONUS : 0);
          if (actualGain === 0) return;

          await tx.gameSession.update({
            where: { id: session.id },
            data: {
              ...(doUpper ? { columnPoolUpperCredited: true } : {}),
              ...(doLower ? { columnPoolLowerCredited: true } : {}),
              ...(doCombo ? { columnPoolComboCredited: true } : {}),
            },
          });
          await tx.run.update({
            where: { id: runId },
            data: { rollsInPool: { increment: actualGain } },
          });

          if (doUpper) {
            awarded.push({ type: "column_pool_upper", poolsGained: COLUMN_POOL_BONUS });
          }
          if (doLower) {
            awarded.push({ type: "column_pool_lower", poolsGained: COLUMN_POOL_BONUS });
          }
          if (doCombo) {
            awarded.push({ type: "column_pool_combo", poolsGained: COLUMN_POOL_BONUS });
          }
        });
        events.push(...awarded);
      }
    }
  }

  return { events };
}
