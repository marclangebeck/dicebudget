/**
 * Granulare Spiel-Feedback-Einstellungen (lokal, kein Backend).
 */

const LEGACY_KEY = "dicebudget.bonusCelebration";
const PREFS_KEY = "dicebudget.feedbackPrefs.v1";

export type GameFeedbackPrefs = {
  animationsEnabled: boolean;
  /** Zeilen-/Spalten-Lauffeuer auf dem Zettel. */
  sheetFuseHighlightEnabled: boolean;
  soundsEnabled: boolean;
  progressHintsEnabled: boolean;
};

export const DEFAULT_GAME_FEEDBACK_PREFS: GameFeedbackPrefs = {
  animationsEnabled: true,
  sheetFuseHighlightEnabled: true,
  soundsEnabled: true,
  progressHintsEnabled: true,
};

function normalizePrefs(value: unknown): GameFeedbackPrefs {
  const source =
    typeof value === "object" && value !== null ? (value as Partial<GameFeedbackPrefs>) : {};
  const animationsEnabled =
    typeof source.animationsEnabled === "boolean"
      ? source.animationsEnabled
      : DEFAULT_GAME_FEEDBACK_PREFS.animationsEnabled;
  return {
    animationsEnabled,
    // Altstände ohne Key: wie bisher an Erfolgsanimationen gekoppelt
    sheetFuseHighlightEnabled:
      typeof source.sheetFuseHighlightEnabled === "boolean"
        ? source.sheetFuseHighlightEnabled
        : animationsEnabled,
    soundsEnabled:
      typeof source.soundsEnabled === "boolean"
        ? source.soundsEnabled
        : DEFAULT_GAME_FEEDBACK_PREFS.soundsEnabled,
    progressHintsEnabled:
      typeof source.progressHintsEnabled === "boolean"
        ? source.progressHintsEnabled
        : DEFAULT_GAME_FEEDBACK_PREFS.progressHintsEnabled,
  };
}

function migrateFromLegacy(): GameFeedbackPrefs {
  if (typeof window === "undefined") return DEFAULT_GAME_FEEDBACK_PREFS;
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  const allOn = legacy !== "0";
  return {
    animationsEnabled: allOn,
    sheetFuseHighlightEnabled: allOn,
    soundsEnabled: allOn,
    progressHintsEnabled: allOn,
  };
}

export function getGameFeedbackPrefs(): GameFeedbackPrefs {
  if (typeof window === "undefined") return DEFAULT_GAME_FEEDBACK_PREFS;
  const raw = window.localStorage.getItem(PREFS_KEY);
  if (!raw) return migrateFromLegacy();
  try {
    return normalizePrefs(JSON.parse(raw));
  } catch {
    return migrateFromLegacy();
  }
}

export function setGameFeedbackPrefs(prefs: GameFeedbackPrefs): GameFeedbackPrefs {
  const normalized = normalizePrefs(prefs);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(normalized));
    const anyOn =
      normalized.animationsEnabled ||
      normalized.sheetFuseHighlightEnabled ||
      normalized.soundsEnabled ||
      normalized.progressHintsEnabled;
    window.localStorage.setItem(LEGACY_KEY, anyOn ? "1" : "0");
  }
  return normalized;
}

export function updateGameFeedbackPrefs(update: Partial<GameFeedbackPrefs>): GameFeedbackPrefs {
  return setGameFeedbackPrefs({ ...getGameFeedbackPrefs(), ...update });
}

export function getAchievementAnimationsEnabled(): boolean {
  return getGameFeedbackPrefs().animationsEnabled;
}

export function getSheetFuseHighlightEnabled(): boolean {
  return getGameFeedbackPrefs().sheetFuseHighlightEnabled;
}

export function getFeedbackSoundsEnabled(): boolean {
  return getGameFeedbackPrefs().soundsEnabled;
}

export function getProgressHintsEnabled(): boolean {
  return getGameFeedbackPrefs().progressHintsEnabled;
}

export function feedbackPrefsSummary(prefs: GameFeedbackPrefs): string {
  const parts: string[] = [];
  if (prefs.animationsEnabled) parts.push("Animationen");
  if (prefs.sheetFuseHighlightEnabled) parts.push("Lauffeuer");
  if (prefs.soundsEnabled) parts.push("Sounds");
  if (prefs.progressHintsEnabled) parts.push("Fortschritt");
  return parts.length > 0 ? parts.join(" · ") : "Alles aus";
}
