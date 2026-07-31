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
  showOpponentPool: boolean;
  /** Host-Option: Sieger mit größtem Pool darf am Ende ein Feld verbessern (M33). */
  poolEndgameEnabled: boolean;
  /** True, sobald das Pool-Endspiel entschieden ist (verbessert oder behalten). */
  poolEndgameResolved: boolean;
  /** Öffentliche playerId des Pool-Siegers, oder null (kein eindeutiger Sieger / noch offen). */
  poolEndgameImproverPlayerId: string | null;
  ruleYatzyStreak2?: boolean;
  ruleYatzyTriple?: boolean;
  ruleUpperRace?: boolean;
  ruleColumnPoolBonuses?: boolean;
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
    /** Eingetragene Feldpunkte ohne oberen Bonus / Extra-Yatzy. */
    diceScore?: number;
    /** Wurf-Pool des Spielers; nur gesetzt, wenn der Host es erlaubt hat. */
    rollsInPool: number | null;
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
