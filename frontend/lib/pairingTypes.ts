export type PairingSummaryDto = {
  key: string;
  playerA: string;
  playerB: string;
  roundsPlayed: number;
  appRoundsPlayed: number;
  playerAWins: number;
  playerBWins: number;
  playerAAppWins: number;
  playerBAppWins: number;
  ties: number;
  playerABonusPoints: number;
  playerBBonusPoints: number;
  playerATotalScore: number;
  playerBTotalScore: number;
  lastPlayedAt: string | null;
};

export type PairingRoundDto = {
  inviteCode: string;
  leagueCode: string;
  roundNumber: number;
  finishedAt: string | null;
  playerAScore: number;
  playerBScore: number;
  winner: "A" | "B" | "tie";
  scoreDiff: number;
};

export type PairingDetailDto = PairingSummaryDto & {
  rounds: PairingRoundDto[];
};
