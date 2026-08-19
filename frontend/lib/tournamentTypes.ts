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
  matches: TournamentMatchDto[];
};

export function tournamentModeLabel(modeKey: string): string {
  if (modeKey === "league") return "Liga";
  if (modeKey === "turnier") return "Turnier";
  return modeKey;
}

export function tournamentStatusLabel(status: string): string {
  if (status === "OPEN") return "Lobby";
  if (status === "RUNNING") return "Läuft";
  if (status === "FINISHED") return "Beendet";
  return status;
}
