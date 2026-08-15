const HOST_STORE_KEY = "dicebudget.tournament.host.v1";

export type HostSession = {
  tournamentId: string;
  inviteCode: string;
  hostToken: string;
};

export function loadHostSession(): HostSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(HOST_STORE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as HostSession;
    if (
      typeof parsed.tournamentId === "string" &&
      typeof parsed.inviteCode === "string" &&
      typeof parsed.hostToken === "string"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveHostSession(session: HostSession): void {
  window.localStorage.setItem(HOST_STORE_KEY, JSON.stringify(session));
}

export function clearHostSession(): void {
  window.localStorage.removeItem(HOST_STORE_KEY);
}
