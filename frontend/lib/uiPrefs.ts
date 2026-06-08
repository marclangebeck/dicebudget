/**
 * Lokale Geräte-Einstellungen (kein Backend, kein Sync).
 */

import {
  getGameFeedbackPrefs,
  setGameFeedbackPrefs,
  type GameFeedbackPrefs,
} from "@/lib/gameFeedbackPrefs";

const APP_SETTINGS_KEY = "dicebudget.appSettings.v1";

export type AppSettings = {
  soloGameCount: number;
  multiplayerGameCount: number;
  multiplayerMaxPlayers: number;
  useStrategyRules: boolean;
  showOpponentPool: boolean;
  poolEndgameEnabled: boolean;
  tableModeEnabled: boolean;
  tableLeftName: string;
  tableRightName: string;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  soloGameCount: 3,
  multiplayerGameCount: 6,
  multiplayerMaxPlayers: 2,
  useStrategyRules: true,
  showOpponentPool: false,
  poolEndgameEnabled: false,
  tableModeEnabled: false,
  tableLeftName: "Links",
  tableRightName: "Rechts",
};

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.round(parsed)));
}

function normalizeSettings(value: unknown): AppSettings {
  const source = typeof value === "object" && value !== null ? (value as Partial<AppSettings>) : {};
  const tableModeEnabled = Boolean(source.tableModeEnabled);
  return {
    soloGameCount: clampInt(source.soloGameCount, 1, 6, DEFAULT_APP_SETTINGS.soloGameCount),
    multiplayerGameCount: clampInt(
      source.multiplayerGameCount,
      1,
      6,
      DEFAULT_APP_SETTINGS.multiplayerGameCount,
    ),
    multiplayerMaxPlayers: tableModeEnabled
      ? 2
      : clampInt(
          source.multiplayerMaxPlayers,
          2,
          6,
          DEFAULT_APP_SETTINGS.multiplayerMaxPlayers,
        ),
    useStrategyRules:
      typeof source.useStrategyRules === "boolean"
        ? source.useStrategyRules
        : DEFAULT_APP_SETTINGS.useStrategyRules,
    showOpponentPool: Boolean(source.showOpponentPool),
    poolEndgameEnabled: Boolean(source.poolEndgameEnabled),
    tableModeEnabled,
    tableLeftName:
      typeof source.tableLeftName === "string" && source.tableLeftName.trim()
        ? source.tableLeftName.trim().slice(0, 24)
        : DEFAULT_APP_SETTINGS.tableLeftName,
    tableRightName:
      typeof source.tableRightName === "string" && source.tableRightName.trim()
        ? source.tableRightName.trim().slice(0, 24)
        : DEFAULT_APP_SETTINGS.tableRightName,
  };
}

/** Default: an, wenn mindestens eine Feedback-Option aktiv ist. */
export function getBonusCelebrationEnabled(): boolean {
  const prefs = getGameFeedbackPrefs();
  return prefs.animationsEnabled || prefs.soundsEnabled || prefs.progressHintsEnabled;
}

export function setBonusCelebrationEnabled(enabled: boolean): void {
  const next: GameFeedbackPrefs = enabled
    ? { animationsEnabled: true, soundsEnabled: true, progressHintsEnabled: true }
    : { animationsEnabled: false, soundsEnabled: false, progressHintsEnabled: false };
  setGameFeedbackPrefs(next);
}

/** Mindestens eine Feedback-Option aktiv (Kompatibilität). */
export function getGameFeedbackEnabled(): boolean {
  return getBonusCelebrationEnabled();
}

export function setGameFeedbackEnabled(enabled: boolean): void {
  setBonusCelebrationEnabled(enabled);
}

export function getAppSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  const raw = window.localStorage.getItem(APP_SETTINGS_KEY);
  if (!raw) return DEFAULT_APP_SETTINGS;
  try {
    return normalizeSettings(JSON.parse(raw));
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export function setAppSettings(settings: AppSettings): AppSettings {
  const normalized = normalizeSettings(settings);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(APP_SETTINGS_KEY, JSON.stringify(normalized));
  }
  return normalized;
}

export function updateAppSettings(update: Partial<AppSettings>): AppSettings {
  return setAppSettings({ ...getAppSettings(), ...update });
}
