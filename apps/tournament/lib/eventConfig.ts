import { DEFAULT_HOUSE_RULES, parseHouseRules, type HouseRulePrefs } from "./houseRules";

export const MATCH_GAME_COUNT_MIN = 1;
export const MATCH_GAME_COUNT_MAX = 6;
export const LEAGUE_ROUNDS_MIN = 1;
export const LEAGUE_ROUNDS_MAX = 10;
export const GROUP_SIZE_MIN = 3;
export const GROUP_SIZE_MAX = 6;

export type MatchPrefs = {
  useStrategyRules: boolean;
  gameCount: number;
  showOpponentPool: boolean;
  poolEndgameEnabled: boolean;
  houseRules: HouseRulePrefs;
};

export type LeagueSettings = {
  rounds: number;
};

export type TurnierSettings = {
  groupSize: number;
  qualifyPerGroup: 1 | 2;
};

export const DEFAULT_MATCH_PREFS: MatchPrefs = {
  useStrategyRules: true,
  gameCount: 1,
  showOpponentPool: false,
  poolEndgameEnabled: false,
  houseRules: { ...DEFAULT_HOUSE_RULES },
};

export const DEFAULT_LEAGUE_SETTINGS: LeagueSettings = {
  rounds: 3,
};

export const DEFAULT_TURNIER_SETTINGS: TurnierSettings = {
  groupSize: 4,
  qualifyPerGroup: 2,
};

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export function formatGroupPreview(maxEntries: number, groupSize: number): string {
  const groups = Math.floor(maxEntries / groupSize);
  const remainder = maxEntries % groupSize;
  if (groups < 1) {
    return `${maxEntries} Spieler, Gruppengröße ${groupSize} — zu wenig für eine volle Gruppe`;
  }
  if (remainder === 0) {
    return `${maxEntries} Spieler → ${groups} Gruppen à ${groupSize}`;
  }
  return `${maxEntries} Spieler → ${groups} Gruppen à ${groupSize}, ${remainder} Rest (Ausgleich später)`;
}

export function matchModeLabel(useStrategyRules: boolean): string {
  return useStrategyRules ? "Strategy" : "Klassisch";
}

export type EventConfigPayload = MatchPrefs &
  (
    | { rounds: number }
    | { groupSize: number; qualifyPerGroup: 1 | 2; knockout: "single" }
  );

export function buildEventConfigPayload(
  modeKey: "league" | "turnier",
  match: MatchPrefs,
  league: LeagueSettings,
  turnier: TurnierSettings,
): EventConfigPayload {
  const prefs: MatchPrefs = {
    ...match,
    showOpponentPool: match.useStrategyRules ? match.showOpponentPool : false,
    poolEndgameEnabled: match.useStrategyRules ? match.poolEndgameEnabled : false,
    houseRules: parseHouseRules(match.houseRules),
  };
  if (modeKey === "turnier") {
    return {
      ...prefs,
      groupSize: turnier.groupSize,
      qualifyPerGroup: turnier.qualifyPerGroup,
      knockout: "single",
    };
  }
  return {
    ...prefs,
    rounds: league.rounds,
  };
}
