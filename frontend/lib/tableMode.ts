export type TableModeSide = "left" | "right";

export type TableModePlayer = {
  side: TableModeSide;
  label: string;
  playerId: string;
  runId: string;
  playerSecret: string;
};

export type TableModeSession = {
  inviteCode: string;
  players: [TableModePlayer, TableModePlayer];
};

const STORAGE_PREFIX = "dicebudget.tableMode.";

function storageKey(inviteCode: string): string {
  return `${STORAGE_PREFIX}${inviteCode.trim().toUpperCase()}`;
}

export function createTableModePlayerId(): string {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  // RFC-4122-v4-Fallback fuer Browser ohne randomUUID; Backend validiert UUIDs.
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      Number(c) ^
      (Math.random() * 16) >> (Number(c) / 4)
    ).toString(16),
  );
}

export function saveTableModeSession(session: TableModeSession): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(session.inviteCode), JSON.stringify(session));
}

export function loadTableModeSession(inviteCode: string): TableModeSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(storageKey(inviteCode));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as TableModeSession;
    if (
      typeof parsed.inviteCode === "string" &&
      Array.isArray(parsed.players) &&
      parsed.players.length === 2 &&
      parsed.players.every(
        (p) =>
          (p.side === "left" || p.side === "right") &&
          typeof p.label === "string" &&
          typeof p.playerId === "string" &&
          typeof p.runId === "string" &&
          typeof p.playerSecret === "string",
      )
    ) {
      return parsed;
    }
  } catch {
    /* ignore malformed local state */
  }
  return null;
}
