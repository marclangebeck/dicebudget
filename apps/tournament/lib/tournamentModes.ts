export type TournamentModeKey = "league" | "turnier";

export type TournamentModeOption = {
  key: TournamentModeKey;
  label: string;
  description: string;
};

/**
 * Formate nur in DiceBudget Tournament (Host).
 * Die Spieler-App tritt nur per QR bei — ohne Format-Setup.
 */
export const TOURNAMENT_MODE_OPTIONS: TournamentModeOption[] = [
  {
    key: "league",
    label: "Liga",
    description: "Jeder gegen jeden — Runden und Tabelle.",
  },
  {
    key: "turnier",
    label: "Turnier",
    description:
      "Gruppen-Vorrunde, Qualifikation, dann K.O. in der Hauptrunde.",
  },
];

export function isTournamentModeKey(value: unknown): value is TournamentModeKey {
  return value === "league" || value === "turnier";
}

/** Nächster Wizard-Schritt nach Größe — formatabhängig. */
export function setupPathAfterSize(modeKey: TournamentModeKey): string {
  return modeKey === "turnier" ? "/setup/turnier" : "/setup/league";
}

export const MIN_MAX_ENTRIES = 2;
export const MAX_MAX_ENTRIES = 64;
export const DEFAULT_MAX_ENTRIES = 16;

export const MAX_ENTRIES_PRESETS = [8, 16, 24, 32, 64] as const;

export function clampMaxEntries(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_MAX_ENTRIES;
  return Math.min(MAX_MAX_ENTRIES, Math.max(MIN_MAX_ENTRIES, Math.round(value)));
}
