import type { PairingDetailDto, PairingRoundDto, PairingSummaryDto } from "./pairingTypes";

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function winner(value: unknown): PairingRoundDto["winner"] {
  return value === "A" || value === "B" || value === "tie" ? value : "tie";
}

export function normalizePairingRound(raw: unknown): PairingRoundDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const inviteCode = str(o.inviteCode);
  const leagueCode = str(o.leagueCode);
  if (!inviteCode || !leagueCode) return null;

  return {
    inviteCode,
    leagueCode,
    roundNumber: num(o.roundNumber, 1),
    finishedAt: str(o.finishedAt),
    playerAScore: num(o.playerAScore),
    playerBScore: num(o.playerBScore),
    winner: winner(o.winner),
    scoreDiff: num(o.scoreDiff),
  };
}

export function normalizePairingSummary(raw: unknown): PairingSummaryDto | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const key = str(o.key);
  const playerA = str(o.playerA);
  const playerB = str(o.playerB);
  if (!key || !playerA || !playerB) return null;

  return {
    key,
    playerA,
    playerB,
    roundsPlayed: num(o.roundsPlayed),
    appRoundsPlayed: num(o.appRoundsPlayed),
    playerAWins: num(o.playerAWins),
    playerBWins: num(o.playerBWins),
    playerAAppWins: num(o.playerAAppWins),
    playerBAppWins: num(o.playerBAppWins),
    ties: num(o.ties),
    playerABonusPoints: num(o.playerABonusPoints),
    playerBBonusPoints: num(o.playerBBonusPoints),
    playerAManualBonus: num(o.playerAManualBonus),
    playerBManualBonus: num(o.playerBManualBonus),
    playerATotalScore: num(o.playerATotalScore),
    playerBTotalScore: num(o.playerBTotalScore),
    lastPlayedAt: str(o.lastPlayedAt),
  };
}

export function normalizePairingDetail(raw: unknown): PairingDetailDto | null {
  const summary = normalizePairingSummary(raw);
  if (!summary) return null;

  const o = raw as Record<string, unknown>;
  const rounds = Array.isArray(o.rounds)
    ? o.rounds.map(normalizePairingRound).filter((r): r is PairingRoundDto => r !== null)
    : [];

  return { ...summary, rounds };
}
