import type { SessionRankingDto } from "./sessionTypes";
import { isNativeShell } from "./nativeShell";

const PROD_API = "https://dicebudget.bottle-trade.de/api";

function apiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (isNativeShell()) {
    return fromEnv?.startsWith("http") ? fromEnv : PROD_API;
  }
  if (fromEnv) return fromEnv;
  return PROD_API;
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit & { hostToken?: string },
): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (init?.hostToken) {
    headers.set("X-Host-Token", init.hostToken);
  }
  const url = `${apiBase()}${path}`;
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers });
  } catch {
    throw new Error(`API nicht erreichbar (${url})`);
  }
  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err =
      typeof data === "object" &&
      data &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : `HTTP ${res.status}`;
    throw new Error(err);
  }
  return data as T;
}

export type TournamentDto = {
  id: string;
  inviteCode: string;
  name: string | null;
  modeKey: string;
  status: string;
  maxEntries: number;
  config?: Record<string, unknown>;
  entryCount: number;
  createdAt: string;
  entries?: TournamentEntryDto[];
  groups?: TournamentGroupDto[];
  rounds?: TournamentRoundDto[];
};

export type TournamentEntryDto = {
  id: string;
  displayName: string;
  playerId: string | null;
  orderIndex: number;
  joinedAt: string;
};

export type TournamentGroupStandingDto = {
  id: string;
  rank: number;
  matchesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  points: number;
  totalScoreDiff: number;
  totalScoreFor: number;
  totalScoreAgainst: number;
  entry: Pick<TournamentEntryDto, "id" | "displayName" | "playerId">;
};

export type TournamentGroupDto = {
  id: string;
  name: string;
  sortOrder: number;
  standings: TournamentGroupStandingDto[];
};

export type TournamentMatchDto = {
  id: string;
  phase: string;
  matchIndex: number;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  homePointsAwarded: number | null;
  awayPointsAwarded: number | null;
  tieBreakNeeded: boolean;
  winnerEntryId: string | null;
  groupId: string | null;
  sessionId: string | null;
  sessionInviteCode?: string | null;
  homeEntry: Pick<TournamentEntryDto, "id" | "displayName" | "playerId">;
  awayEntry: Pick<TournamentEntryDto, "id" | "displayName" | "playerId">;
};

export type TournamentRoundDto = {
  id: string;
  groupId: string | null;
  phase: string;
  roundIndex: number;
  legIndex: number;
  title: string;
  releaseWave?: number | null;
  matches: TournamentMatchDto[];
};

export type DrawPreviewPairDto = {
  matchIndex: number;
  homeEntryId: string;
  awayEntryId: string;
  homeDisplayName: string;
  awayDisplayName: string;
};

export type DrawPreviewRoundDto = {
  planRoundIndex: number;
  phase: string;
  groupSortOrder: number;
  roundIndex: number;
  legIndex: number;
  releaseWave: number;
  title: string;
  released: boolean;
  pairs: DrawPreviewPairDto[];
};

export type DrawPreviewDto = {
  groups: {
    name: string;
    sortOrder: number;
    entries: Pick<TournamentEntryDto, "id" | "displayName" | "playerId">[];
  }[];
  rounds: DrawPreviewRoundDto[];
  releasedWave: number;
  totalWaves: number;
};

export type ScheduleMetaDto = {
  releasedWave: number;
  totalWaves: number;
  hasMoreRounds: boolean;
};

export type CreateTournamentResponse = {
  tournament: TournamentDto;
  hostToken: string;
};

export function createTournament(input: {
  name?: string;
  modeKey?: string;
  maxEntries?: number;
  config?: Record<string, unknown>;
}): Promise<CreateTournamentResponse> {
  return apiFetch("/tournaments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getTournamentByInvite(
  inviteCode: string,
  hostToken?: string,
): Promise<{
  tournament: TournamentDto;
  drawPreview?: DrawPreviewDto;
  scheduleMeta?: ScheduleMetaDto;
}> {
  return apiFetch(`/tournaments/invite/${encodeURIComponent(inviteCode)}`, {
    hostToken,
  });
}

export function prepareTournamentDraw(
  tournamentId: string,
  hostToken: string,
): Promise<{ tournament: TournamentDto; drawPreview: DrawPreviewDto }> {
  return apiFetch(`/tournaments/${encodeURIComponent(tournamentId)}/draw`, {
    method: "POST",
    hostToken,
    body: JSON.stringify({ action: "prepare" }),
  });
}

export function shuffleTournamentDraw(
  tournamentId: string,
  hostToken: string,
): Promise<{ tournament: TournamentDto; drawPreview: DrawPreviewDto }> {
  return apiFetch(`/tournaments/${encodeURIComponent(tournamentId)}/draw`, {
    method: "POST",
    hostToken,
    body: JSON.stringify({ action: "shuffle" }),
  });
}

export function patchTournamentDraw(
  tournamentId: string,
  hostToken: string,
  input: {
    planRoundIndex: number;
    matchIndex: number;
    swapSides?: boolean;
    homeEntryId?: string;
    awayEntryId?: string;
    assignPlayer?: {
      planRoundIndex: number;
      matchIndex: number;
      side: "home" | "away";
      entryId: string;
    };
  },
): Promise<{ tournament: TournamentDto; drawPreview: DrawPreviewDto }> {
  return apiFetch(`/tournaments/${encodeURIComponent(tournamentId)}/draw`, {
    method: "PATCH",
    hostToken,
    body: JSON.stringify(input),
  });
}

export function releaseNextTournamentRound(
  tournamentId: string,
  hostToken: string,
): Promise<{ tournament: TournamentDto; scheduleMeta?: ScheduleMetaDto }> {
  return apiFetch(`/tournaments/${encodeURIComponent(tournamentId)}/rounds`, {
    method: "POST",
    hostToken,
  });
}

export function startTournament(
  tournamentId: string,
  hostToken: string,
): Promise<{ tournament: TournamentDto }> {
  return apiFetch(`/tournaments/${encodeURIComponent(tournamentId)}/start`, {
    method: "POST",
    hostToken,
  });
}

export function createTournamentMatchSession(
  tournamentId: string,
  matchId: string,
  hostToken: string,
): Promise<{
  tournament: TournamentDto;
  matchId: string;
  sessionInviteCode: string;
  joinPath: string;
}> {
  return apiFetch(
    `/tournaments/${encodeURIComponent(tournamentId)}/matches/${encodeURIComponent(matchId)}/session`,
    {
      method: "POST",
      hostToken,
    },
  );
}

export function getSessionRanking(
  sessionInviteCode: string,
): Promise<{ session: SessionRankingDto }> {
  return apiFetch(
    `/sessions/invite/${encodeURIComponent(sessionInviteCode)}/ranking`,
  );
}
