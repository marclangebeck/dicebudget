import { generateSecretToken } from "../lib/secretToken.js";
import { normalizePlayerId } from "../domain/playerIdentity.js";
import { prisma } from "../db/prisma.js";

const MIN_NAME = 2;
const MAX_NAME = 24;
const MAX_LOOKUP_IDS = 64;

export class InvalidDisplayNameError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidDisplayNameError";
  }
}

export class DisplayNameForbiddenError extends Error {
  constructor(message = "Name-Token ungültig") {
    super(message);
    this.name = "DisplayNameForbiddenError";
  }
}

export function normalizeDisplayPlayerId(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new InvalidDisplayNameError("playerId erforderlich");
  }
  const id = normalizePlayerId(raw.replace(/^pid:/i, ""));
  if (id.length < 8 || id.length > 80 || !/^[a-z0-9:_-]+$/i.test(id)) {
    throw new InvalidDisplayNameError("Ungültige playerId");
  }
  return id;
}

export function normalizeDisplayName(raw: unknown): string {
  if (typeof raw !== "string") {
    throw new InvalidDisplayNameError("Spielername erforderlich");
  }
  const name = raw.trim().replace(/\s+/g, " ");
  if (name.length < MIN_NAME || name.length > MAX_NAME) {
    throw new InvalidDisplayNameError(
      `Spielername muss ${MIN_NAME}–${MAX_NAME} Zeichen haben`,
    );
  }
  if (!/^[\p{L}\p{N} .'\-]+$/u.test(name)) {
    throw new InvalidDisplayNameError(
      "Spielername: Buchstaben, Zahlen, Leerzeichen, Punkt, Apostroph oder Bindestrich",
    );
  }
  return name;
}

export async function listPlayerDisplayNames(
  rawIds: unknown,
): Promise<Record<string, string>> {
  const ids = parseIdList(rawIds);
  if (ids.length === 0) return {};
  const rows = await prisma.playerDisplayName.findMany({
    where: { playerId: { in: ids } },
    select: { playerId: true, displayName: true },
  });
  const map: Record<string, string> = {};
  for (const row of rows) map[row.playerId] = row.displayName;
  return map;
}

export async function upsertPlayerDisplayName(input: {
  playerId: unknown;
  displayName: unknown;
  nameToken?: unknown;
}): Promise<{ playerId: string; displayName: string; nameToken: string }> {
  const playerId = normalizeDisplayPlayerId(input.playerId);
  const displayName = normalizeDisplayName(input.displayName);
  const offeredToken =
    typeof input.nameToken === "string" && input.nameToken.trim()
      ? input.nameToken.trim()
      : "";

  const existing = await prisma.playerDisplayName.findUnique({
    where: { playerId },
  });

  if (!existing) {
    const nameToken = generateSecretToken();
    const created = await prisma.playerDisplayName.create({
      data: { playerId, displayName, nameToken },
    });
    return {
      playerId: created.playerId,
      displayName: created.displayName,
      nameToken: created.nameToken,
    };
  }

  if (!offeredToken || offeredToken !== existing.nameToken) {
    throw new DisplayNameForbiddenError();
  }

  const updated = await prisma.playerDisplayName.update({
    where: { playerId },
    data: { displayName },
  });
  return {
    playerId: updated.playerId,
    displayName: updated.displayName,
    nameToken: updated.nameToken,
  };
}

export async function deletePlayerDisplayName(input: {
  playerId: unknown;
  nameToken: unknown;
}): Promise<void> {
  const playerId = normalizeDisplayPlayerId(input.playerId);
  const token =
    typeof input.nameToken === "string" ? input.nameToken.trim() : "";
  if (!token) throw new DisplayNameForbiddenError();

  const existing = await prisma.playerDisplayName.findUnique({
    where: { playerId },
  });
  if (!existing || existing.nameToken !== token) {
    throw new DisplayNameForbiddenError();
  }
  await prisma.playerDisplayName.delete({ where: { playerId } });
}

function parseIdList(rawIds: unknown): string[] {
  let parts: string[] = [];
  if (typeof rawIds === "string") {
    parts = rawIds.split(",");
  } else if (Array.isArray(rawIds)) {
    parts = rawIds.filter((id): id is string => typeof id === "string");
  }
  const unique = new Set<string>();
  for (const part of parts) {
    try {
      unique.add(normalizeDisplayPlayerId(part));
    } catch {
      /* skip invalid */
    }
    if (unique.size >= MAX_LOOKUP_IDS) break;
  }
  return [...unique];
}
