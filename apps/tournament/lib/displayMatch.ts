import type { TournamentMatchDto, TournamentRoundDto } from "@/lib/api";

export type MatchWithRound = {
  match: TournamentMatchDto;
  roundTitle: string;
  roundPhase: string;
};

export function findMatchInRounds(
  rounds: TournamentRoundDto[],
  matchId: string,
): MatchWithRound | null {
  for (const round of rounds) {
    const match = round.matches.find((m) => m.id === matchId);
    if (match) {
      return {
        match,
        roundTitle: round.title,
        roundPhase: round.phase,
      };
    }
  }
  return null;
}

export function syncMatchInUrl(matchId: string | null) {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (matchId) {
    url.searchParams.set("match", matchId);
  } else {
    url.searchParams.delete("match");
  }
  window.history.replaceState({}, "", url);
}
