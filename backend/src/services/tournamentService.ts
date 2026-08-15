import { randomBytes } from "crypto";
import { generateSecretToken } from "../lib/secretToken.js";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/prisma.js";

export const TOURNAMENT_STATUS = {
  OPEN: "OPEN",
  RUNNING: "RUNNING",
  FINISHED: "FINISHED",
} as const;

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MIN_ENTRIES = 2;
const MAX_ENTRIES_CAP = 64;
const DEFAULT_MAX_ENTRIES = 32;

export class TournamentNotFoundError extends Error {
  constructor() {
    super("Tournament not found");
    this.name = "TournamentNotFoundError";
  }
}

export class TournamentForbiddenError extends Error {
  constructor(message = "Host-Token ungültig") {
    super(message);
    this.name = "TournamentForbiddenError";
  }
}

export class TournamentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TournamentConflictError";
  }
}

export class TournamentInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TournamentInputError";
  }
}

async function generateUniqueTournamentCode(
  tx: Prisma.TransactionClient,
): Promise<string> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    let code = "";
    const buf = randomBytes(8);
    for (let i = 0; i < 8; i += 1) {
      code += INVITE_CHARS[buf[i]! % INVITE_CHARS.length];
    }
    const existing = await tx.tournament.findUnique({
      where: { inviteCode: code },
    });
    if (!existing) return code;
  }
  throw new Error("Could not allocate tournament invite code");
}

function normalizeModeKey(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "league";
  const key = raw.trim().toLowerCase().slice(0, 32);
  if (!/^[a-z0-9_-]+$/.test(key)) {
    throw new TournamentInputError("Ungültiger modeKey");
  }
  return key;
}

function normalizeMaxEntries(raw: unknown): number {
  if (raw === undefined || raw === null || raw === "") return DEFAULT_MAX_ENTRIES;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < MIN_ENTRIES || n > MAX_ENTRIES_CAP) {
    throw new TournamentInputError(
      `maxEntries muss zwischen ${MIN_ENTRIES} und ${MAX_ENTRIES_CAP} liegen`,
    );
  }
  return n;
}

function normalizeName(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const name = raw.trim().slice(0, 48);
  return name.length > 0 ? name : null;
}

function normalizeDisplayName(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) {
    throw new TournamentInputError("displayName erforderlich");
  }
  return raw.trim().slice(0, 32);
}

function toTournamentDto(
  row: {
    id: string;
    inviteCode: string;
    name: string | null;
    modeKey: string;
    status: string;
    maxEntries: number;
    createdAt: Date;
    entries?: {
      id: string;
      displayName: string;
      orderIndex: number;
      joinedAt: Date;
    }[];
  },
  options?: { includeEntries?: boolean },
) {
  const entries = row.entries ?? [];
  return {
    id: row.id,
    inviteCode: row.inviteCode,
    name: row.name,
    modeKey: row.modeKey,
    status: row.status,
    maxEntries: row.maxEntries,
    entryCount: entries.length,
    createdAt: row.createdAt.toISOString(),
    ...(options?.includeEntries
      ? {
          entries: entries.map((e) => ({
            id: e.id,
            displayName: e.displayName,
            orderIndex: e.orderIndex,
            joinedAt: e.joinedAt.toISOString(),
          })),
        }
      : {}),
  };
}

export async function createTournament(input: {
  name?: unknown;
  modeKey?: unknown;
  maxEntries?: unknown;
}) {
  const name = normalizeName(input.name);
  const modeKey = normalizeModeKey(input.modeKey);
  const maxEntries = normalizeMaxEntries(input.maxEntries);
  const hostToken = generateSecretToken();

  const tournament = await prisma.$transaction(async (tx) => {
    const inviteCode = await generateUniqueTournamentCode(tx);
    return tx.tournament.create({
      data: {
        inviteCode,
        name,
        modeKey,
        maxEntries,
        hostToken,
        status: TOURNAMENT_STATUS.OPEN,
      },
      include: { entries: { orderBy: { orderIndex: "asc" } } },
    });
  });

  return {
    tournament: toTournamentDto(tournament, { includeEntries: true }),
    hostToken,
  };
}

export async function getTournamentByInviteCode(
  inviteCode: string,
  hostToken?: string,
) {
  const code = inviteCode.trim().toUpperCase();
  if (!code) throw new TournamentNotFoundError();

  const tournament = await prisma.tournament.findUnique({
    where: { inviteCode: code },
    include: { entries: { orderBy: { orderIndex: "asc" } } },
  });
  if (!tournament) throw new TournamentNotFoundError();

  if (hostToken && hostToken !== tournament.hostToken) {
    throw new TournamentForbiddenError();
  }

  return {
    tournament: toTournamentDto(tournament, { includeEntries: true }),
  };
}

export async function joinTournament(
  inviteCode: string,
  input: { displayName?: unknown; playerId?: unknown },
) {
  const code = inviteCode.trim().toUpperCase();
  const displayName = normalizeDisplayName(input.displayName);
  const playerId =
    typeof input.playerId === "string" && input.playerId.trim()
      ? input.playerId.trim().slice(0, 64)
      : null;

  const result = await prisma.$transaction(async (tx) => {
    const tournament = await tx.tournament.findUnique({
      where: { inviteCode: code },
      include: { entries: true },
    });
    if (!tournament) throw new TournamentNotFoundError();
    if (tournament.status !== TOURNAMENT_STATUS.OPEN) {
      throw new TournamentConflictError("Turnier nimmt keine Anmeldungen mehr an");
    }
    if (tournament.entries.length >= tournament.maxEntries) {
      throw new TournamentConflictError("Turnier ist voll");
    }
    if (
      playerId &&
      tournament.entries.some((e) => e.playerId === playerId)
    ) {
      throw new TournamentConflictError("Spieler bereits angemeldet");
    }

    const entry = await tx.tournamentEntry.create({
      data: {
        tournamentId: tournament.id,
        displayName,
        playerId,
        orderIndex: tournament.entries.length,
      },
    });

    const fresh = await tx.tournament.findUniqueOrThrow({
      where: { id: tournament.id },
      include: { entries: { orderBy: { orderIndex: "asc" } } },
    });

    return { tournament: fresh, entry };
  });

  return {
    tournament: toTournamentDto(result.tournament, { includeEntries: true }),
    entry: {
      id: result.entry.id,
      displayName: result.entry.displayName,
      orderIndex: result.entry.orderIndex,
      joinedAt: result.entry.joinedAt.toISOString(),
    },
  };
}

export async function startTournament(tournamentId: string, hostToken: string) {
  if (!hostToken) throw new TournamentForbiddenError();

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: { entries: { orderBy: { orderIndex: "asc" } } },
  });
  if (!tournament) throw new TournamentNotFoundError();
  if (tournament.hostToken !== hostToken) throw new TournamentForbiddenError();
  if (tournament.status !== TOURNAMENT_STATUS.OPEN) {
    throw new TournamentConflictError("Turnier ist nicht mehr in der Lobby");
  }
  if (tournament.entries.length < MIN_ENTRIES) {
    throw new TournamentConflictError(
      `Mindestens ${MIN_ENTRIES} Spieler zum Start nötig`,
    );
  }

  const updated = await prisma.tournament.update({
    where: { id: tournamentId },
    data: { status: TOURNAMENT_STATUS.RUNNING },
    include: { entries: { orderBy: { orderIndex: "asc" } } },
  });

  return {
    tournament: toTournamentDto(updated, { includeEntries: true }),
  };
}
