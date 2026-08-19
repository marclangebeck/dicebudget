import type { Prisma } from "@prisma/client";
import type { TournamentConfig } from "./tournamentConfig.js";

export type SchedulePairPlan = {
  homeEntryId: string;
  awayEntryId: string;
};

export type ScheduleGroupPlan = {
  name: string;
  sortOrder: number;
  entryIds: string[];
};

export type ScheduleRoundPlan = {
  phase: string;
  groupSortOrder: number;
  roundIndex: number;
  legIndex: number;
  releaseWave: number;
  title: string;
  pairs: SchedulePairPlan[];
};

export type TournamentSchedulePlan = {
  groups: ScheduleGroupPlan[];
  rounds: ScheduleRoundPlan[];
  releasedWave: number;
};

const SCHEDULE_PLAN_KEY = "_schedulePlan";

function shuffleArray<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function buildRoundRobin(entryIds: readonly string[]) {
  if (entryIds.length < 2) return [] as { roundIndex: number; pairs: [string, string][] }[];
  const ids = [...entryIds];
  const isOdd = ids.length % 2 === 1;
  if (isOdd) ids.push("__BYE__");
  const rounds: { roundIndex: number; pairs: [string, string][] }[] = [];
  const slots = [...ids];
  const totalRounds = slots.length - 1;
  const half = slots.length / 2;

  for (let roundIndex = 0; roundIndex < totalRounds; roundIndex += 1) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < half; i += 1) {
      const a = slots[i]!;
      const b = slots[slots.length - 1 - i]!;
      if (a !== "__BYE__" && b !== "__BYE__") {
        pairs.push(roundIndex % 2 === 0 ? [a, b] : [b, a]);
      }
    }
    rounds.push({ roundIndex: roundIndex + 1, pairs });

    const fixed = slots[0]!;
    const rotating = slots.slice(1);
    rotating.unshift(rotating.pop()!);
    slots.splice(0, slots.length, fixed, ...rotating);
  }
  return rounds;
}

function distributeIntoGroups<T>(entries: readonly T[], groupSize: number): T[][] {
  const groupCount = Math.max(1, Math.ceil(entries.length / groupSize));
  const groups = Array.from({ length: groupCount }, () => [] as T[]);
  entries.forEach((entry, index) => {
    groups[index % groupCount]!.push(entry);
  });
  return groups;
}

const GROUP_LABELS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function groupNameForIndex(index: number): string {
  const label = GROUP_LABELS[index] ?? String(index + 1);
  return `Gruppe ${label}`;
}

export function parseStoredConfig(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export function readSchedulePlan(raw: string | null): TournamentSchedulePlan | null {
  const obj = parseStoredConfig(raw);
  const plan = obj[SCHEDULE_PLAN_KEY];
  if (!plan || typeof plan !== "object" || Array.isArray(plan)) return null;
  const typed = plan as TournamentSchedulePlan;
  if (!Array.isArray(typed.groups) || !Array.isArray(typed.rounds)) return null;
  return {
    groups: typed.groups,
    rounds: typed.rounds,
    releasedWave: Number.isInteger(typed.releasedWave) ? typed.releasedWave : 0,
  };
}

export function mergeSchedulePlanIntoConfig(
  raw: string | null,
  plan: TournamentSchedulePlan | null,
): string {
  const obj = parseStoredConfig(raw);
  if (plan) {
    obj[SCHEDULE_PLAN_KEY] = plan;
  } else {
    delete obj[SCHEDULE_PLAN_KEY];
  }
  return JSON.stringify(obj);
}

export function buildLeagueSchedulePlan(
  entryIds: readonly string[],
  config: Extract<TournamentConfig, { rounds: number }>,
): TournamentSchedulePlan {
  const shuffled = shuffleArray(entryIds);
  const groups: ScheduleGroupPlan[] = [
    {
      name: "Liga",
      sortOrder: 0,
      entryIds: [...shuffled],
    },
  ];

  const baseSchedule = buildRoundRobin(shuffled);
  const rounds: ScheduleRoundPlan[] = [];
  for (let legIndex = 1; legIndex <= config.rounds; legIndex += 1) {
    for (const round of baseSchedule) {
      rounds.push({
        phase: "LEAGUE",
        groupSortOrder: 0,
        roundIndex: round.roundIndex,
        legIndex,
        releaseWave: (legIndex - 1) * baseSchedule.length + round.roundIndex,
        title:
          config.rounds > 1
            ? `Spieltag ${round.roundIndex} · Runde ${legIndex}`
            : `Spieltag ${round.roundIndex}`,
        pairs: round.pairs.map(([homeEntryId, awayEntryId]) => ({
          homeEntryId,
          awayEntryId,
        })),
      });
    }
  }

  return { groups, rounds, releasedWave: 0 };
}

export function buildTurnierSchedulePlan(
  entryIds: readonly string[],
  config: Extract<TournamentConfig, { groupSize: number }>,
): TournamentSchedulePlan {
  const shuffled = shuffleArray(entryIds);
  const grouped = distributeIntoGroups(shuffled, config.groupSize);
  const groups: ScheduleGroupPlan[] = grouped.map((ids, index) => ({
    name: groupNameForIndex(index),
    sortOrder: index,
    entryIds: ids.map((id) => id),
  }));

  const rounds: ScheduleRoundPlan[] = [];
  for (const group of groups) {
    const schedule = buildRoundRobin(group.entryIds);
    for (const round of schedule) {
      rounds.push({
        phase: "GROUP",
        groupSortOrder: group.sortOrder,
        roundIndex: round.roundIndex,
        legIndex: 1,
        releaseWave: round.roundIndex,
        title: `${group.name} · Runde ${round.roundIndex}`,
        pairs: round.pairs.map(([homeEntryId, awayEntryId]) => ({
          homeEntryId,
          awayEntryId,
        })),
      });
    }
  }

  rounds.sort(
    (a, b) =>
      a.releaseWave - b.releaseWave ||
      a.groupSortOrder - b.groupSortOrder ||
      a.roundIndex - b.roundIndex,
  );

  return { groups, rounds, releasedWave: 0 };
}

export function buildSchedulePlan(
  modeKey: string,
  entryIds: readonly string[],
  config: TournamentConfig,
): TournamentSchedulePlan {
  if (modeKey === "turnier" && "groupSize" in config) {
    return buildTurnierSchedulePlan(entryIds, config);
  }
  if ("rounds" in config) {
    return buildLeagueSchedulePlan(entryIds, config);
  }
  throw new Error("Turnier-Konfiguration fehlt");
}

export function shuffleSchedulePlan(plan: TournamentSchedulePlan): TournamentSchedulePlan {
  const shuffledGroups = plan.groups.map((group) => ({
    ...group,
    entryIds: shuffleArray(group.entryIds),
  }));

  const entryIdsByGroup = new Map(
    shuffledGroups.map((group) => [group.sortOrder, group.entryIds] as const),
  );

  const rounds = plan.rounds.map((round) => {
    const entryIds = entryIdsByGroup.get(round.groupSortOrder) ?? [];
    const schedule = buildRoundRobin(entryIds);
    const matchRound = schedule.find((item) => item.roundIndex === round.roundIndex);
    return {
      ...round,
      pairs: (matchRound?.pairs ?? []).map(([homeEntryId, awayEntryId]) => ({
        homeEntryId,
        awayEntryId,
      })),
    };
  });

  return {
    groups: shuffledGroups,
    rounds,
    releasedWave: 0,
  };
}

export function swapSchedulePairSides(
  plan: TournamentSchedulePlan,
  planRoundIndex: number,
  matchIndex: number,
): TournamentSchedulePlan {
  const round = plan.rounds[planRoundIndex];
  if (!round) throw new Error("Runde nicht gefunden");
  const pair = round.pairs[matchIndex - 1];
  if (!pair) throw new Error("Paarung nicht gefunden");

  const rounds = plan.rounds.map((item, index) => {
    if (index !== planRoundIndex) return item;
    return {
      ...item,
      pairs: item.pairs.map((current, pairIndex) =>
        pairIndex === matchIndex - 1
          ? {
              homeEntryId: current.awayEntryId,
              awayEntryId: current.homeEntryId,
            }
          : current,
      ),
    };
  });

  return { ...plan, rounds };
}

export function updateSchedulePair(
  plan: TournamentSchedulePlan,
  planRoundIndex: number,
  matchIndex: number,
  homeEntryId: string,
  awayEntryId: string,
): TournamentSchedulePlan {
  const round = plan.rounds[planRoundIndex];
  if (!round) throw new Error("Runde nicht gefunden");
  if (!round.pairs[matchIndex - 1]) throw new Error("Paarung nicht gefunden");

  const group = plan.groups.find((item) => item.sortOrder === round.groupSortOrder);
  if (!group) throw new Error("Gruppe nicht gefunden");
  if (!group.entryIds.includes(homeEntryId) || !group.entryIds.includes(awayEntryId)) {
    throw new Error("Spieler gehört nicht zur Gruppe");
  }
  if (homeEntryId === awayEntryId) {
    throw new Error("Heim- und Auswärtsspieler müssen unterschiedlich sein");
  }

  const rounds = plan.rounds.map((item, index) => {
    if (index !== planRoundIndex) return item;
    return {
      ...item,
      pairs: item.pairs.map((current, pairIndex) =>
        pairIndex === matchIndex - 1
          ? { homeEntryId, awayEntryId }
          : current,
      ),
    };
  });

  return { ...plan, rounds };
}

export function assignPlayerToRoundSlot(
  plan: TournamentSchedulePlan,
  planRoundIndex: number,
  matchIndex: number,
  side: "home" | "away",
  entryId: string,
): TournamentSchedulePlan {
  const round = plan.rounds[planRoundIndex];
  if (!round) throw new Error("Runde nicht gefunden");
  const pair = round.pairs[matchIndex - 1];
  if (!pair) throw new Error("Paarung nicht gefunden");

  const group = plan.groups.find((item) => item.sortOrder === round.groupSortOrder);
  if (!group) throw new Error("Gruppe nicht gefunden");
  if (!group.entryIds.includes(entryId)) {
    throw new Error("Spieler gehört nicht zur Gruppe");
  }

  let fromMatchIndex = -1;
  let fromSide: "home" | "away" | null = null;
  round.pairs.forEach((current, pairIndex) => {
    if (current.homeEntryId === entryId) {
      fromMatchIndex = pairIndex + 1;
      fromSide = "home";
    }
    if (current.awayEntryId === entryId) {
      fromMatchIndex = pairIndex + 1;
      fromSide = "away";
    }
  });

  const displacedEntryId = side === "home" ? pair.homeEntryId : pair.awayEntryId;
  if (fromMatchIndex === matchIndex && fromSide === side) {
    return plan;
  }

  const rounds = plan.rounds.map((item, roundIndex) => {
    if (roundIndex !== planRoundIndex) return item;
    return {
      ...item,
      pairs: item.pairs.map((current, pairIndex) => {
        const currentMatchIndex = pairIndex + 1;
        let homeEntryId = current.homeEntryId;
        let awayEntryId = current.awayEntryId;

        if (currentMatchIndex === matchIndex && side === "home") {
          homeEntryId = entryId;
        }
        if (currentMatchIndex === matchIndex && side === "away") {
          awayEntryId = entryId;
        }

        if (
          fromMatchIndex > 0 &&
          fromSide &&
          currentMatchIndex === fromMatchIndex &&
          fromSide === "home"
        ) {
          homeEntryId = displacedEntryId;
        }
        if (
          fromMatchIndex > 0 &&
          fromSide &&
          currentMatchIndex === fromMatchIndex &&
          fromSide === "away"
        ) {
          awayEntryId = displacedEntryId;
        }

        return { homeEntryId, awayEntryId };
      }),
    };
  });

  return { ...plan, rounds };
}

export function releaseWaveForRoundPlan(
  plan: TournamentSchedulePlan,
  groupSortOrder: number,
  phase: string,
  roundIndex: number,
  legIndex: number,
): number | null {
  const match = plan.rounds.find(
    (round) =>
      round.groupSortOrder === groupSortOrder &&
      round.phase === phase &&
      round.roundIndex === roundIndex &&
      round.legIndex === legIndex,
  );
  return match?.releaseWave ?? null;
}

export function nextReleaseWave(plan: TournamentSchedulePlan): number | null {
  const waves = [...new Set(plan.rounds.map((round) => round.releaseWave))].sort(
    (a, b) => a - b,
  );
  return waves.find((wave) => wave > plan.releasedWave) ?? null;
}

export function roundsForReleaseWave(
  plan: TournamentSchedulePlan,
  wave: number,
): ScheduleRoundPlan[] {
  return plan.rounds.filter((round) => round.releaseWave === wave);
}

export async function persistScheduleGroups(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  plan: TournamentSchedulePlan,
): Promise<Map<number, string>> {
  const groupIdBySortOrder = new Map<number, string>();

  for (const groupPlan of plan.groups) {
    const group = await tx.tournamentGroup.create({
      data: {
        tournamentId,
        name: groupPlan.name,
        sortOrder: groupPlan.sortOrder,
      },
    });
    groupIdBySortOrder.set(groupPlan.sortOrder, group.id);

    await tx.tournamentGroupStanding.createMany({
      data: groupPlan.entryIds.map((entryId) => ({
        tournamentId,
        groupId: group.id,
        entryId,
      })),
    });
  }

  return groupIdBySortOrder;
}

export async function persistScheduleRoundWave(
  tx: Prisma.TransactionClient,
  tournamentId: string,
  plan: TournamentSchedulePlan,
  wave: number,
  groupIdBySortOrder: Map<number, string>,
): Promise<void> {
  const roundPlans = roundsForReleaseWave(plan, wave);
  for (const roundPlan of roundPlans) {
    const groupId = groupIdBySortOrder.get(roundPlan.groupSortOrder);
    if (!groupId) continue;

    const createdRound = await tx.tournamentRound.create({
      data: {
        tournamentId,
        groupId,
        phase: roundPlan.phase,
        roundIndex: roundPlan.roundIndex,
        legIndex: roundPlan.legIndex,
        title: roundPlan.title,
      },
    });

    await tx.tournamentMatch.createMany({
      data: roundPlan.pairs.map((pair, pairIndex) => ({
        tournamentId,
        groupId,
        roundId: createdRound.id,
        phase: roundPlan.phase,
        matchIndex: pairIndex + 1,
        homeEntryId: pair.homeEntryId,
        awayEntryId: pair.awayEntryId,
      })),
    });
  }
}

export function toDrawPreviewDto(
  plan: TournamentSchedulePlan,
  entries: { id: string; displayName: string; playerId: string | null }[],
) {
  const entryById = new Map(entries.map((entry) => [entry.id, entry] as const));
  return {
    groups: plan.groups.map((group) => ({
      name: group.name,
      sortOrder: group.sortOrder,
      entries: group.entryIds
        .map((entryId) => entryById.get(entryId))
        .filter(Boolean)
        .map((entry) => ({
          id: entry!.id,
          displayName: entry!.displayName,
          playerId: entry!.playerId,
        })),
    })),
    rounds: plan.rounds.map((round, planRoundIndex) => ({
      planRoundIndex,
      phase: round.phase,
      groupSortOrder: round.groupSortOrder,
      roundIndex: round.roundIndex,
      legIndex: round.legIndex,
      releaseWave: round.releaseWave,
      title: round.title,
      released: round.releaseWave <= plan.releasedWave,
      pairs: round.pairs.map((pair, index) => ({
        matchIndex: index + 1,
        homeEntryId: pair.homeEntryId,
        awayEntryId: pair.awayEntryId,
        homeDisplayName: entryById.get(pair.homeEntryId)?.displayName ?? "?",
        awayDisplayName: entryById.get(pair.awayEntryId)?.displayName ?? "?",
      })),
    })),
    releasedWave: plan.releasedWave,
    totalWaves: [...new Set(plan.rounds.map((round) => round.releaseWave))].length,
  };
}
