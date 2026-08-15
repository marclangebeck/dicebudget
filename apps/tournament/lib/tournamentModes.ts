export type TournamentModeKey = "league" | "knockout";

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
    key: "knockout",
    label: "K.O.",
    description: "Bracket mit Ausscheiden — folgt in einem späteren Schritt.",
    available: false,
  },
];

export function isTournamentModeKey(value: unknown): value is TournamentModeKey {
  return value === "league" || value === "knockout";
}
