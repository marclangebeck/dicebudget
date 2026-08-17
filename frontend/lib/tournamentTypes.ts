export type TournamentDto = {
  id: string;
  inviteCode: string;
  name: string | null;
  modeKey: string;
  status: string;
  maxEntries: number;
  entryCount: number;
  createdAt: string;
  entries?: TournamentEntryDto[];
};

export type TournamentEntryDto = {
  id: string;
  displayName: string;
  playerId: string | null;
  orderIndex: number;
  joinedAt: string;
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
