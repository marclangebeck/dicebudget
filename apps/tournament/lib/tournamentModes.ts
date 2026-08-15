export type TournamentModeKey = "league" | "turnier";

export type TournamentModeOption = {
  key: TournamentModeKey;
  label: string;
  description: string;
  available: boolean;
};

/** Host-Setup: nur verfügbare Modi sind wählbar. */
export const TOURNAMENT_MODE_OPTIONS: TournamentModeOption[] = [
  {
    key: "league",
    label: "Liga",
    description: "Tabelle über mehrere Runden — erster unterstützter Modus.",
    available: true,
  },
  {
    key: "turnier",
    label: "Turnier",
    description: "Ausscheidungsverfahren mit Bracket — folgt später.",
    available: false,
  },
];

export function isTournamentModeKey(value: unknown): value is TournamentModeKey {
  return value === "league" || value === "turnier";
}
