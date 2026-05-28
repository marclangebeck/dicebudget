/** Antwort Lobby / Ranking (wie Backend `session`-Objekt). */
export type LeagueStandingDto = {
  rank: number;
  playerId: string;
  winPoints: number;
  bonusPoints: number;
  totalPoints: number;
};

export type SessionLobbyDto = {
  id: string;
  inviteCode: string;
  gameCount: number;
  maxPlayers: number;
  useStrategyRules: boolean;
  status: string;
  createdAt: string;
  leagueCode: string;
  roundNumber: number;
  pointsAwarded: boolean;
  playerCount: number;
  players: {
    id: string;
    playerId: string;
    orderIndex: number;
    runFinished: boolean;
    totalScore: number;
  }[];
  allRunsFinished: boolean;
  leagueStandings: LeagueStandingDto[];
  joinPath: string;
};

export type SessionRankingDto = SessionLobbyDto & {
  ranking: {
    rank: number;
    playerId: string;
    totalScore: number;
    finished: boolean;
  }[];
  winner: { playerId: string; totalScore: number } | null;
};
