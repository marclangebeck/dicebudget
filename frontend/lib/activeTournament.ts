const STORAGE_KEY = "dicebudget.activeTournament.v1";

export type ActiveTournamentEntry = {
  inviteCode: string;
  tournamentId: string;
  entryId: string;
  displayName: string;
  playerId: string;
};

function normalizeCode(code: string): string {
  return code.trim().toUpperCase();
}

export function loadActiveTournament(
  inviteCode?: string,
): ActiveTournamentEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ActiveTournamentEntry>;
    if (
      typeof parsed.inviteCode !== "string" ||
      typeof parsed.tournamentId !== "string" ||
      typeof parsed.entryId !== "string" ||
      typeof parsed.displayName !== "string" ||
      typeof parsed.playerId !== "string"
    ) {
      return null;
    }
    const entry: ActiveTournamentEntry = {
      inviteCode: normalizeCode(parsed.inviteCode),
      tournamentId: parsed.tournamentId,
      entryId: parsed.entryId,
      displayName: parsed.displayName,
      playerId: parsed.playerId,
    };
    if (inviteCode && entry.inviteCode !== normalizeCode(inviteCode)) {
      return null;
    }
    return entry;
  } catch {
    return null;
  }
}

export function saveActiveTournament(entry: ActiveTournamentEntry): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      ...entry,
      inviteCode: normalizeCode(entry.inviteCode),
    }),
  );
}

export function clearActiveTournament(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
