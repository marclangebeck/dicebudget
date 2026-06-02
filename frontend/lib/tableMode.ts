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

export function createTableModePlayerId(side: TableModeSide): string {
  const suffix =
    typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function"
      ? window.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `table-${side}-${suffix}`;
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
