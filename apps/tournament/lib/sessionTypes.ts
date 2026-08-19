/** Live-Daten einer DiceBudget-Session (öffentliches Ranking). */
export type SessionRankingDto = {
  inviteCode: string;
  status: string;
  gameCount: number;
  showOpponentPool: boolean;
  koTieBreakEnabled?: boolean;
  koTieBreakPending?: boolean;
  koTieBreakWinnerPlayerId?: string | null;
  allRunsFinished: boolean;
  players: {
    playerId: string;
    orderIndex: number;
    runFinished: boolean;
    totalScore: number;
    diceScore?: number;
    rollsInPool: number | null;
  }[];
  ranking: {
    rank: number;
    playerId: string;
    totalScore: number;
    finished: boolean;
  }[];
  winner: { playerId: string; totalScore: number } | null;
};
