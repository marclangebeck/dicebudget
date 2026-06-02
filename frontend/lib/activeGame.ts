const STORAGE_KEY = "kniffel-active-game";
const LEGACY_MP_KEY = "kniffel-mp-session";

export type ActiveGameState =
  | { type: "solo"; runId: string }
  | { type: "multi"; runId: string; playerSecret: string; inviteCode: string }
  | { type: "table"; inviteCode: string };

export function saveActiveGame(state: ActiveGameState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadActiveGame(): ActiveGameState | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    const parsed = parseActiveGame(raw);
    if (parsed) return parsed;
  }

  const legacy = sessionStorage.getItem(LEGACY_MP_KEY);
  if (legacy) {
    try {
      const data = JSON.parse(legacy) as {
        runId?: string;
        playerSecret?: string;
        inviteCode?: string;
      };
      if (
        typeof data.runId === "string" &&
        typeof data.playerSecret === "string" &&
        typeof data.inviteCode === "string"
      ) {
        const migrated: ActiveGameState = {
          type: "multi",
          runId: data.runId,
          playerSecret: data.playerSecret,
          inviteCode: data.inviteCode,
        };
        saveActiveGame(migrated);
        sessionStorage.removeItem(LEGACY_MP_KEY);
        return migrated;
      }
    } catch {
      /* ignore */
    }
  }

  return null;
}

function parseActiveGame(raw: string): ActiveGameState | null {
  try {
    const data = JSON.parse(raw) as ActiveGameState;
    if (data.type === "solo" && typeof data.runId === "string") {
      return { type: "solo", runId: data.runId };
    }
    if (
      data.type === "multi" &&
      typeof data.runId === "string" &&
      typeof data.playerSecret === "string" &&
      typeof data.inviteCode === "string"
    ) {
      return data;
    }
    if (data.type === "table" && typeof data.inviteCode === "string") {
      return { type: "table", inviteCode: data.inviteCode };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function clearActiveGame(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_MP_KEY);
}

export function playPath(game: ActiveGameState): string {
  if (game.type === "multi") {
    return `/play?runId=${encodeURIComponent(game.runId)}&invite=${encodeURIComponent(game.inviteCode)}`;
  }
  if (game.type === "table") {
    return `/play?table=1&invite=${encodeURIComponent(game.inviteCode)}`;
  }
  return `/play?runId=${encodeURIComponent(game.runId)}`;
}

/** Einladungscode normalisieren (API erwartet Großbuchstaben). */
export function normalizeInviteCode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}
