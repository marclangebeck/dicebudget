export const MATCH_GAME_COUNT_MIN = 1;
export const MATCH_GAME_COUNT_MAX = 6;
export const LEAGUE_ROUNDS_MIN = 1;
export const LEAGUE_ROUNDS_MAX = 2;
export const GROUP_SIZE_MIN = 3;
export const GROUP_SIZE_MAX = 6;

export type TournamentHouseRules = {
  houseRulesBurn: boolean;
  houseRulesRollSale: boolean;
  houseRulesYatzyStreak: boolean;
  houseRulesYatzyStreakCredit: boolean;
  houseRulesYatzyTriple: boolean;
  houseRulesYatzyTripleCredit: boolean;
  houseRulesUpperRace: boolean;
  houseRulesColumnPoolBonuses: boolean;
};

export type TournamentMatchConfig = {
  useStrategyRules: boolean;
  gameCount: number;
  showOpponentPool: boolean;
  poolEndgameEnabled: boolean;
  houseRules: TournamentHouseRules;
};

export type LeagueTournamentConfig = TournamentMatchConfig & {
  rounds: number;
};

export type TurnierTournamentConfig = TournamentMatchConfig & {
  groupSize: number;
  qualifyPerGroup: 1 | 2;
  knockout: "single";
};

export type TournamentConfig = LeagueTournamentConfig | TurnierTournamentConfig;

export const DEFAULT_HOUSE_RULES: TournamentHouseRules = {
  houseRulesBurn: true,
  houseRulesRollSale: true,
  houseRulesYatzyStreak: true,
  houseRulesYatzyStreakCredit: false,
  houseRulesYatzyTriple: true,
  houseRulesYatzyTripleCredit: false,
  houseRulesUpperRace: true,
  houseRulesColumnPoolBonuses: true,
};

export const DEFAULT_MATCH_CONFIG: TournamentMatchConfig = {
  useStrategyRules: true,
  gameCount: 1,
  showOpponentPool: false,
  poolEndgameEnabled: false,
  houseRules: { ...DEFAULT_HOUSE_RULES },
};

export const DEFAULT_LEAGUE_ROUNDS = 1;
export const DEFAULT_GROUP_SIZE = 4;
export const DEFAULT_QUALIFY_PER_GROUP = 2 as const;

function asObject(raw: unknown): Record<string, unknown> {
  if (raw && typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  return {};
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  return fallback;
}

function readInt(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isInteger(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isInteger(Number(value))) {
    return Number(value);
  }
  return fallback;
}

function normalizeHouseRules(raw: unknown): TournamentHouseRules {
  const obj = asObject(raw);
  const next: TournamentHouseRules = {
    houseRulesBurn: readBoolean(obj.houseRulesBurn, DEFAULT_HOUSE_RULES.houseRulesBurn),
    houseRulesRollSale: readBoolean(
      obj.houseRulesRollSale,
      DEFAULT_HOUSE_RULES.houseRulesRollSale,
    ),
    houseRulesYatzyStreak: readBoolean(
      obj.houseRulesYatzyStreak,
      DEFAULT_HOUSE_RULES.houseRulesYatzyStreak,
    ),
    houseRulesYatzyStreakCredit: readBoolean(
      obj.houseRulesYatzyStreakCredit,
      DEFAULT_HOUSE_RULES.houseRulesYatzyStreakCredit,
    ),
    houseRulesYatzyTriple: readBoolean(
      obj.houseRulesYatzyTriple,
      DEFAULT_HOUSE_RULES.houseRulesYatzyTriple,
    ),
    houseRulesYatzyTripleCredit: readBoolean(
      obj.houseRulesYatzyTripleCredit,
      DEFAULT_HOUSE_RULES.houseRulesYatzyTripleCredit,
    ),
    houseRulesUpperRace: readBoolean(
      obj.houseRulesUpperRace,
      DEFAULT_HOUSE_RULES.houseRulesUpperRace,
    ),
    houseRulesColumnPoolBonuses: readBoolean(
      obj.houseRulesColumnPoolBonuses,
      DEFAULT_HOUSE_RULES.houseRulesColumnPoolBonuses,
    ),
  };
  if (!next.houseRulesYatzyStreak) next.houseRulesYatzyStreakCredit = false;
  if (!next.houseRulesYatzyTriple) next.houseRulesYatzyTripleCredit = false;
  return next;
}

function normalizeMatch(raw: Record<string, unknown>): TournamentMatchConfig {
  const gameCount = readInt(raw.gameCount, DEFAULT_MATCH_CONFIG.gameCount);
  if (gameCount < MATCH_GAME_COUNT_MIN || gameCount > MATCH_GAME_COUNT_MAX) {
    throw new Error(
      `gameCount muss zwischen ${MATCH_GAME_COUNT_MIN} und ${MATCH_GAME_COUNT_MAX} liegen`,
    );
  }
  const useStrategyRules = readBoolean(
    raw.useStrategyRules,
    DEFAULT_MATCH_CONFIG.useStrategyRules,
  );
  return {
    useStrategyRules,
    gameCount,
    showOpponentPool: useStrategyRules
      ? readBoolean(raw.showOpponentPool, DEFAULT_MATCH_CONFIG.showOpponentPool)
      : false,
    poolEndgameEnabled: useStrategyRules
      ? readBoolean(raw.poolEndgameEnabled, DEFAULT_MATCH_CONFIG.poolEndgameEnabled)
      : false,
    houseRules: normalizeHouseRules(raw.houseRules),
  };
}

export function defaultTournamentConfig(modeKey: string): TournamentConfig {
  const match: TournamentMatchConfig = {
    ...DEFAULT_MATCH_CONFIG,
    houseRules: { ...DEFAULT_HOUSE_RULES },
  };
  if (modeKey === "turnier") {
    return {
      ...match,
      groupSize: DEFAULT_GROUP_SIZE,
      qualifyPerGroup: DEFAULT_QUALIFY_PER_GROUP,
      knockout: "single",
    };
  }
  return {
    ...match,
    rounds: DEFAULT_LEAGUE_ROUNDS,
  };
}

export function normalizeTournamentConfig(
  modeKey: string,
  raw: unknown,
): TournamentConfig {
  const obj = asObject(raw);
  const match = normalizeMatch(obj);
  if (modeKey === "turnier") {
    const groupSize = readInt(obj.groupSize, DEFAULT_GROUP_SIZE);
    if (groupSize < GROUP_SIZE_MIN || groupSize > GROUP_SIZE_MAX) {
      throw new Error(
        `groupSize muss zwischen ${GROUP_SIZE_MIN} und ${GROUP_SIZE_MAX} liegen`,
      );
    }
    const qualifyRaw = readInt(obj.qualifyPerGroup, DEFAULT_QUALIFY_PER_GROUP);
    if (qualifyRaw !== 1 && qualifyRaw !== 2) {
      throw new Error("qualifyPerGroup muss 1 oder 2 sein");
    }
    if (qualifyRaw >= groupSize) {
      throw new Error("qualifyPerGroup muss kleiner als die Gruppengröße sein");
    }
    return {
      ...match,
      groupSize,
      qualifyPerGroup: qualifyRaw,
      knockout: "single",
    };
  }
  const rounds = readInt(obj.rounds, DEFAULT_LEAGUE_ROUNDS);
  if (rounds < LEAGUE_ROUNDS_MIN || rounds > LEAGUE_ROUNDS_MAX) {
    throw new Error(
      `rounds muss zwischen ${LEAGUE_ROUNDS_MIN} und ${LEAGUE_ROUNDS_MAX} liegen`,
    );
  }
  return {
    ...match,
    rounds,
  };
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
