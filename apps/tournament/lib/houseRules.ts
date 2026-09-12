export type HouseRuleId =
  | "houseRulesBurn"
  | "houseRulesRollSale"
  | "houseRulesYatzyStreak"
  | "houseRulesYatzyStreakCredit"
  | "houseRulesYatzyTriple"
  | "houseRulesYatzyTripleCredit"
  | "houseRulesUpperRace"
  | "houseRulesColumnPoolBonuses";

export type HouseRulePrefs = Record<HouseRuleId, boolean>;

export type HouseRuleOption = {
  id: HouseRuleId;
  title: string;
  description: string;
  parentId?: HouseRuleId;
  defaultOn: boolean;
};

/** Wie DiceBudget Einstellungen → Multi (Hausregeln). */
export const HOUSE_RULE_OPTIONS: HouseRuleOption[] = [
  {
    id: "houseRulesBurn",
    title: "Brennt",
    description:
      "Brennender Würfel: neu würfeln (−1 Pool, Rest liegen lassen) oder Augenzahl selbst (−2 Pool).",
    defaultOn: true,
  },
  {
    id: "houseRulesRollSale",
    title: "Wurf verkaufen",
    description: "Bei voller Feldzeile Wurf verkaufen, Freifeld ohne Würfeln.",
    defaultOn: true,
  },
  {
    id: "houseRulesYatzyStreak",
    title: "2× Alle Fünfe",
    description:
      "Zwei echte Alle Fünfe (50, ≤3 Würfe) hintereinander: Mitspieler verlieren 1/n Pool (zu zweit Hälfte).",
    defaultOn: true,
  },
  {
    id: "houseRulesYatzyStreakCredit",
    title: "Pool-Gutschrift",
    description:
      "Abgezogene Pools der Mitspieler dem Erfolgreichen gutschreiben (Transfer statt nur Strafe).",
    parentId: "houseRulesYatzyStreak",
    defaultOn: false,
  },
  {
    id: "houseRulesYatzyTriple",
    title: "3× Alle Fünfe",
    description:
      "Drei echte Alle Fünfe (50, ≤3 Würfe) hintereinander: Mitspieler verlieren den gesamten Pool.",
    defaultOn: true,
  },
  {
    id: "houseRulesYatzyTripleCredit",
    title: "Pool-Gutschrift",
    description:
      "Abgezogene Pools der Mitspieler dem Erfolgreichen gutschreiben (Transfer statt nur Strafe).",
    parentId: "houseRulesYatzyTriple",
    defaultOn: false,
  },
  {
    id: "houseRulesUpperRace",
    title: "Oberer Bereich zuerst",
    description:
      "Wer zuerst alle oberen Felder (Spiele × 6) voll hat, erhält die offenen oberen Felder des Rivalen als Pool.",
    defaultOn: true,
  },
  {
    id: "houseRulesColumnPoolBonuses",
    title: "Spalten-Pool-Boni",
    description:
      "Erster mit Spalten-Bonus oben (+2), unten voll (+2), gleiche Spalte komplett (+2); max. 6 Pool.",
    defaultOn: true,
  },
];

export const DEFAULT_HOUSE_RULES: HouseRulePrefs = {
  houseRulesBurn: true,
  houseRulesRollSale: true,
  houseRulesYatzyStreak: true,
  houseRulesYatzyStreakCredit: false,
  houseRulesYatzyTriple: true,
  houseRulesYatzyTripleCredit: false,
  houseRulesUpperRace: true,
  houseRulesColumnPoolBonuses: true,
};

export function parseHouseRules(raw: unknown): HouseRulePrefs {
  const obj =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};
  const next = { ...DEFAULT_HOUSE_RULES };
  for (const option of HOUSE_RULE_OPTIONS) {
    const value = obj[option.id];
    if (typeof value === "boolean") next[option.id] = value;
  }
  if (!next.houseRulesYatzyStreak) next.houseRulesYatzyStreakCredit = false;
  if (!next.houseRulesYatzyTriple) next.houseRulesYatzyTripleCredit = false;
  return next;
}

export function listTopHouseRules(): HouseRuleOption[] {
  return HOUSE_RULE_OPTIONS.filter((option) => !option.parentId);
}

export function listChildHouseRules(parentId: HouseRuleId): HouseRuleOption[] {
  return HOUSE_RULE_OPTIONS.filter((option) => option.parentId === parentId);
}

export function setHouseRule(
  current: HouseRulePrefs,
  id: HouseRuleId,
  checked: boolean,
): HouseRulePrefs {
  const next: HouseRulePrefs = { ...current, [id]: checked };
  if (!checked) {
    for (const child of listChildHouseRules(id)) {
      next[child.id] = false;
    }
  }
  return parseHouseRules(next);
}
