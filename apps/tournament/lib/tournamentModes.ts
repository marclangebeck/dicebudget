export type TournamentModeKey = "league" | "turnier";

export type TournamentModeOption = {
  key: TournamentModeKey;
  label: string;
  description: string;
  available: boolean;
};

/** Host-Setup: Ereignis-Format — Liga oder Turnier. */
export const TOURNAMENT_MODE_OPTIONS: TournamentModeOption[] = [
  {
    key: "league",
    label: "Liga",
    description: "Jeder gegen jeden — Runden und Tabelle.",
    available: true,
  },
  {
    key: "turnier",
    label: "Turnier",
    description:
      "Gruppen-Vorrunde, Qualifikation, dann K.O. in der Hauptrunde — folgt später.",
    available: false,
  },
];

export function isTournamentModeKey(value: unknown): value is TournamentModeKey {
  return value === "league" || value === "turnier";
}

export const MIN_MAX_ENTRIES = 2;
export const MAX_MAX_ENTRIES = 64;
export const DEFAULT_MAX_ENTRIES = 16;

export const MAX_ENTRIES_PRESETS = [8, 16, 24, 32, 64] as const;

export function clampMaxEntries(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MAX_ENTRIES;
  return Math.min(MAX_MAX_ENTRIES, Math.max(MIN_MAX_ENTRIES, Math.round(value)));
}
