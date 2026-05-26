import { prisma } from "../db/prisma.js";

export type PlayerNameAliasDto = {
  aliasName: string;
  canonicalName: string;
};

export class InvalidPlayerNameMergeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPlayerNameMergeError";
  }
}

export class PlayerNameAliasNotFoundError extends Error {
  constructor() {
    super("Name alias not found");
    this.name = "PlayerNameAliasNotFoundError";
  }
}

function trimName(name: string): string {
  return name.trim();
}

function assertValidMergeName(name: string, label: string): string {
  const trimmed = trimName(name);
  if (trimmed.length < 1 || trimmed.length > 40) {
    throw new InvalidPlayerNameMergeError(`${label} must be 1–40 characters`);
  }
  return trimmed;
}

export async function loadAliasMap(): Promise<Map<string, string>> {
  const rows = await prisma.playerNameAlias.findMany({
    select: { aliasName: true, canonicalName: true },
  });
  return new Map(rows.map((row) => [row.aliasName, row.canonicalName]));
}

export function resolvePlayerName(name: string, aliasMap: Map<string, string>): string {
  return aliasMap.get(name) ?? name;
}

export async function resolvePlayerNameAsync(name: string): Promise<string> {
  const aliasMap = await loadAliasMap();
  return resolvePlayerName(name, aliasMap);
}

export async function listKnownPlayerNames(): Promise<string[]> {
  const [players, aliases] = await Promise.all([
    prisma.player.findMany({
      where: { session: { pointsAwarded: true } },
      select: { name: true },
      distinct: ["name"],
    }),
    prisma.playerNameAlias.findMany({
      select: { aliasName: true, canonicalName: true },
    }),
  ]);

  const names = new Set<string>();
  for (const player of players) names.add(player.name);
  for (const alias of aliases) {
    names.add(alias.aliasName);
    names.add(alias.canonicalName);
  }

  return [...names].sort((a, b) => a.localeCompare(b, "de"));
}

export async function listPlayerNameAliases(): Promise<PlayerNameAliasDto[]> {
  const rows = await prisma.playerNameAlias.findMany({
    orderBy: { aliasName: "asc" },
  });
  return rows.map((row) => ({
    aliasName: row.aliasName,
    canonicalName: row.canonicalName,
  }));
}

async function mergeLeagueStandingsForAlias(
  aliasName: string,
  canonicalName: string,
): Promise<void> {
  const aliasRows = await prisma.leagueStanding.findMany({
    where: { playerName: aliasName },
  });

  for (const row of aliasRows) {
    const canonicalRow = await prisma.leagueStanding.findUnique({
      where: {
        leagueId_playerName: {
          leagueId: row.leagueId,
          playerName: canonicalName,
        },
      },
    });

    if (canonicalRow) {
      await prisma.leagueStanding.update({
        where: { id: canonicalRow.id },
        data: {
          winPoints: canonicalRow.winPoints + row.winPoints,
          bonusPoints: canonicalRow.bonusPoints + row.bonusPoints,
        },
      });
      await prisma.leagueStanding.delete({ where: { id: row.id } });
    } else {
      await prisma.leagueStanding.update({
        where: { id: row.id },
        data: { playerName: canonicalName },
      });
    }
  }
}

export async function mergePlayerNames(
  aliasNameInput: string,
  canonicalNameInput: string,
): Promise<PlayerNameAliasDto> {
  const aliasName = assertValidMergeName(aliasNameInput, "aliasName");
  const canonicalName = assertValidMergeName(canonicalNameInput, "canonicalName");

  if (aliasName === canonicalName) {
    throw new InvalidPlayerNameMergeError("aliasName and canonicalName must differ");
  }

  const aliasMap = await loadAliasMap();
  if (aliasMap.has(canonicalName)) {
    throw new InvalidPlayerNameMergeError("canonicalName is already an alias");
  }

  for (const [existingAlias, existingCanonical] of aliasMap.entries()) {
    if (existingCanonical === aliasName && existingAlias !== aliasName) {
      throw new InvalidPlayerNameMergeError("aliasName is already a canonical name");
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.playerNameAlias.upsert({
      where: { aliasName },
      create: { aliasName, canonicalName },
      update: { canonicalName },
    });

    const chainedAliases = await tx.playerNameAlias.findMany({
      where: { canonicalName: aliasName },
    });

    for (const chained of chainedAliases) {
      await tx.playerNameAlias.update({
        where: { id: chained.id },
        data: { canonicalName },
      });
    }
  });

  await mergeLeagueStandingsForAlias(aliasName, canonicalName);

  return { aliasName, canonicalName };
}

export async function removePlayerNameAlias(aliasNameInput: string): Promise<void> {
  const aliasName = assertValidMergeName(aliasNameInput, "aliasName");
  const existing = await prisma.playerNameAlias.findUnique({ where: { aliasName } });
  if (!existing) throw new PlayerNameAliasNotFoundError();
  await prisma.playerNameAlias.delete({ where: { aliasName } });
}
