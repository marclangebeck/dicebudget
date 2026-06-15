import { prisma } from "../db/prisma.js";
import { BURN_POOL_COST, hasAnyFullFieldTypeRow, qualifiesYatzyStreakPenalty } from "../domain/houseRules.js";
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

/** Brennt: −5 Pool am Anfang eines Wurfes (Feld gewählt, noch nicht eingetragen). */
export async function applyBurnRoll(
  runId: string,
  fieldId: string,
  playerSecret?: string,
) {
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

  if (run.rollsInPool < BURN_POOL_COST) {
    throw new RollLimitError(
      `Nicht genug Pool für Brennt (benötigt ${BURN_POOL_COST}, vorhanden ${run.rollsInPool})`,
    );
  }

  await prisma.run.update({
    where: { id: runId },
    data: { rollsInPool: { decrement: BURN_POOL_COST } },
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

  await prisma.run.update({
    where: { id: victim.runId },
    data: { rollsInPool: newPool },
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
