import type { TournamentMatchDto, TournamentRoundDto } from "@/lib/api";

export function isByeEntry(entry: {
  displayName: string;
  playerId: string | null;
}): boolean {
  return (
    entry.playerId == null ||
    entry.displayName.trim().toUpperCase() === "BYE"
  );
}

export function tournamentStatusLabel(status?: string): string {
  if (status === "OPEN") return "Anmeldung";
  if (status === "RUNNING") return "Läuft";
  if (status === "FINISHED") return "Beendet";
  return status ?? "…";
}

export function phaseLabel(phase?: string): string {
  if (phase === "LEAGUE") return "Liga";
  if (phase === "GROUP") return "Gruppenphase";
  if (phase === "KO") return "K.O.";
  if (phase === "KO_THIRD") return "Spiel um Platz 3";
  return phase ?? "Phase";
}

export function matchStatusLabel(status: string, hasSession: boolean): string {
  if (status === "FINISHED") return "Beendet";
  if (status === "READY" || hasSession) return "Jetzt spielen";
  if (status === "PENDING") return "Geplant";
  return status;
}

export function formatMatchScore(
  home: number | null,
  away: number | null,
): string | null {
  if (home == null || away == null) return null;
  return `${home} : ${away}`;
}

export function formatPoints(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

export function filterVisibleMatch(match: TournamentMatchDto): boolean {
  return !isByeEntry(match.homeEntry) || !isByeEntry(match.awayEntry);
}

export function sortRoundsForDisplay(
  rounds: TournamentRoundDto[],
): TournamentRoundDto[] {
  const phaseOrder = (phase: string) => {
    if (phase === "LEAGUE") return 0;
    if (phase === "GROUP") return 1;
    if (phase === "KO") return 2;
    if (phase === "KO_THIRD") return 3;
    return 4;
  };

  return [...rounds].sort(
    (a, b) =>
      phaseOrder(a.phase) - phaseOrder(b.phase) ||
      a.legIndex - b.legIndex ||
      a.roundIndex - b.roundIndex,
  );
}

export function countLiveMatches(rounds: TournamentRoundDto[]): number {
  return rounds.reduce(
    (sum, round) =>
      sum +
      round.matches.filter(
        (m) =>
          filterVisibleMatch(m) &&
          (m.status === "READY" || Boolean(m.sessionInviteCode)),
      ).length,
    0,
  );
}
