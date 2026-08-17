import {
  clampInt,
  DEFAULT_LEAGUE_SETTINGS,
  DEFAULT_MATCH_PREFS,
  DEFAULT_TURNIER_SETTINGS,
  GROUP_SIZE_MAX,
  GROUP_SIZE_MIN,
  LEAGUE_ROUNDS_MAX,
  LEAGUE_ROUNDS_MIN,
  MATCH_GAME_COUNT_MAX,
  MATCH_GAME_COUNT_MIN,
  type LeagueSettings,
  type MatchPrefs,
  type TurnierSettings,
} from "@/lib/eventConfig";
import {
  clampMaxEntries,
  isTournamentModeKey,
  type TournamentModeKey,
} from "@/lib/tournamentModes";

const SETUP_DRAFT_KEY = "dicebudget.tournament.setupDraft.v1";

export type SetupDraft = {
  name: string;
  modeKey?: TournamentModeKey;
  maxEntries?: number;
  match: MatchPrefs;
  league: LeagueSettings;
  turnier: TurnierSettings;
};

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function parseMatch(raw: unknown): MatchPrefs {
  const obj = asRecord(raw);
  const useStrategyRules =
    typeof obj.useStrategyRules === "boolean"
      ? obj.useStrategyRules
      : DEFAULT_MATCH_PREFS.useStrategyRules;
  const gameCount =
    typeof obj.gameCount === "number"
      ? clampInt(obj.gameCount, MATCH_GAME_COUNT_MIN, MATCH_GAME_COUNT_MAX)
      : DEFAULT_MATCH_PREFS.gameCount;
  return {
    useStrategyRules,
    gameCount,
    showOpponentPool: useStrategyRules
      ? typeof obj.showOpponentPool === "boolean"
        ? obj.showOpponentPool
        : DEFAULT_MATCH_PREFS.showOpponentPool
      : false,
    poolEndgameEnabled: useStrategyRules
      ? typeof obj.poolEndgameEnabled === "boolean"
        ? obj.poolEndgameEnabled
        : DEFAULT_MATCH_PREFS.poolEndgameEnabled
      : false,
  };
}

function parseLeague(raw: unknown): LeagueSettings {
  const obj = asRecord(raw);
  const rounds =
    typeof obj.rounds === "number"
      ? clampInt(obj.rounds, LEAGUE_ROUNDS_MIN, LEAGUE_ROUNDS_MAX)
      : DEFAULT_LEAGUE_SETTINGS.rounds;
  return { rounds };
}

function parseTurnier(raw: unknown): TurnierSettings {
  const obj = asRecord(raw);
  const groupSize =
    typeof obj.groupSize === "number"
      ? clampInt(obj.groupSize, GROUP_SIZE_MIN, GROUP_SIZE_MAX)
      : DEFAULT_TURNIER_SETTINGS.groupSize;
  const qualifyRaw =
    obj.qualifyPerGroup === 1 || obj.qualifyPerGroup === 2
      ? obj.qualifyPerGroup
      : DEFAULT_TURNIER_SETTINGS.qualifyPerGroup;
  const qualifyPerGroup = qualifyRaw >= groupSize ? 1 : qualifyRaw;
  return { groupSize, qualifyPerGroup };
}

export function loadSetupDraft(): SetupDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SETUP_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    if (typeof parsed.name !== "string") return null;
    const draft: SetupDraft = {
      name: parsed.name,
      match: parseMatch(parsed.match),
      league: parseLeague(parsed.league),
      turnier: parseTurnier(parsed.turnier),
    };
    if (isTournamentModeKey(parsed.modeKey)) {
      draft.modeKey = parsed.modeKey;
    }
    if (typeof parsed.maxEntries === "number") {
      draft.maxEntries = clampMaxEntries(parsed.maxEntries);
    }
    return draft;
  } catch {
    /* ignore */
  }
  return null;
}

export function saveSetupDraft(draft: SetupDraft): void {
  window.localStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(draft));
}

export function patchSetupDraft(patch: Partial<SetupDraft>): SetupDraft | null {
  const current = loadSetupDraft();
  if (!current) return null;
  const next: SetupDraft = {
    ...current,
    ...patch,
    match: parseMatch({ ...current.match, ...patch.match }),
    league: parseLeague({ ...current.league, ...patch.league }),
    turnier: parseTurnier({ ...current.turnier, ...patch.turnier }),
  };
  if (typeof next.maxEntries === "number") {
    next.maxEntries = clampMaxEntries(next.maxEntries);
  }
  saveSetupDraft(next);
  return next;
}

export function clearSetupDraft(): void {
  window.localStorage.removeItem(SETUP_DRAFT_KEY);
}
