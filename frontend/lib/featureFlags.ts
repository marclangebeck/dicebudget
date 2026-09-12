/**
 * Feature-Register für optionale Hausregeln (Einstellungen → Multi).
 * - stage "optional": Toggle, Default über defaultEnabled
 * - stage "released": immer an (kein Toggle nötig)
 */

const FEATURE_PREFS_KEY = "dicebudget.labsFeatures.v1";
export const FEATURE_FLAGS_CHANGED_EVENT = "dicebudget:feature-flags-changed";

export type FeatureStage = "optional" | "released" | "labs";

export type FeatureDefinition = {
  id: string;
  title: string;
  description: string;
  stage: FeatureStage;
  /** Standard, wenn noch kein Toggle gesetzt wurde. */
  defaultEnabled?: boolean;
  /** @deprecated Alias für defaultEnabled (alte Labs-Prefs). */
  defaultLabsOn?: boolean;
  /** Key für Info-Overlay (houseRuleInfo). */
  infoKey?: string;
  /** Optionaler Unter-Toggle: nur sichtbar/aktiv wenn Parent an. */
  parentId?: string;
};

function defaultOn(feature: FeatureDefinition): boolean {
  if (typeof feature.defaultEnabled === "boolean") return feature.defaultEnabled;
  return Boolean(feature.defaultLabsOn);
}

/**
 * Optionale Multi-/Strategy-Hausregeln.
 * Prefs bleiben unter dem bisherigen localStorage-Key (Abwärtskompatibilität).
 */
export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  houseRulesBurn: {
    id: "houseRulesBurn",
    title: "Brennt",
    description:
      "Brennender Würfel: neu würfeln (−1 Pool, Rest liegen lassen) oder Augenzahl selbst (−2 Pool).",
    stage: "optional",
    defaultEnabled: true,
    infoKey: "burn",
  },
  houseRulesRollSale: {
    id: "houseRulesRollSale",
    title: "Wurf verkaufen",
    description: "Bei voller Feldzeile Wurf verkaufen, Freifeld ohne Würfeln.",
    stage: "optional",
    defaultEnabled: true,
    infoKey: "rollSale",
  },
  houseRulesYatzyStreak: {
    id: "houseRulesYatzyStreak",
    title: "2× Alle Fünfe",
    description:
      "Zwei echte Alle Fünfe (50, ≤3 Würfe) hintereinander: Mitspieler verlieren 1/n Pool (zu zweit Hälfte).",
    stage: "optional",
    defaultEnabled: true,
    infoKey: "yatzyStreak2",
  },
  houseRulesYatzyStreakCredit: {
    id: "houseRulesYatzyStreakCredit",
    title: "Pool-Gutschrift",
    description:
      "Abgezogene Pools der Mitspieler dem Erfolgreichen gutschreiben (Transfer statt nur Strafe).",
    stage: "optional",
    defaultEnabled: false,
    parentId: "houseRulesYatzyStreak",
    infoKey: "yatzyStreak2Credit",
  },
  houseRulesYatzyTriple: {
    id: "houseRulesYatzyTriple",
    title: "3× Alle Fünfe",
    description:
      "Drei echte Alle Fünfe (50, ≤3 Würfe) hintereinander: Mitspieler verlieren den gesamten Pool.",
    stage: "optional",
    defaultEnabled: true,
    infoKey: "yatzyStreak3",
  },
  houseRulesYatzyTripleCredit: {
    id: "houseRulesYatzyTripleCredit",
    title: "Pool-Gutschrift",
    description:
      "Abgezogene Pools der Mitspieler dem Erfolgreichen gutschreiben (Transfer statt nur Strafe).",
    stage: "optional",
    defaultEnabled: false,
    parentId: "houseRulesYatzyTriple",
    infoKey: "yatzyStreak3Credit",
  },
  houseRulesUpperRace: {
    id: "houseRulesUpperRace",
    title: "Oberer Bereich zuerst",
    description:
      "Wer zuerst alle oberen Felder (Spiele × 6) voll hat, erhält die offenen oberen Felder der Mitspieler als Pool.",
    stage: "optional",
    defaultEnabled: true,
    infoKey: "upperRace",
  },
  houseRulesColumnPoolBonuses: {
    id: "houseRulesColumnPoolBonuses",
    title: "Spalten-Pool-Boni",
    description:
      "Erster mit Spalten-Bonus oben (+2), unten voll (+2), gleiche Spalte komplett (+2); max. 6 Pool.",
    stage: "optional",
    defaultEnabled: true,
    infoKey: "columnPoolBonuses",
  },
  houseRulesYatzyEfficiency: {
    id: "houseRulesYatzyEfficiency",
    title: "Alle Fünfe: Effizienz",
    description:
      "Nur Strategy. Bis Wurf 7 volle 50; danach alle 3 Würfe −5 Punkte (10 % vom Ausgangswert). Aus = wie bisher immer 50.",
    stage: "optional",
    defaultEnabled: false,
    infoKey: "yatzyEfficiency",
  },
};

export type FeatureId = keyof typeof FEATURE_REGISTRY;

function readFeaturePrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(FEATURE_PREFS_KEY);
  if (!raw) return {};
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === "boolean") out[key] = value;
    }
    return out;
  } catch {
    return {};
  }
}

function writeFeaturePrefs(prefs: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(FEATURE_PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event(FEATURE_FLAGS_CHANGED_EVENT));
}

export function getLabsFeaturePref(featureId: string): boolean | undefined {
  const prefs = readFeaturePrefs();
  return prefs[featureId];
}

export function setLabsFeaturePref(featureId: string, enabled: boolean): void {
  const prefs = readFeaturePrefs();
  prefs[featureId] = enabled;
  writeFeaturePrefs(prefs);
}

/** Top-Level optionale Hausregeln (ohne Unter-Toggles). */
export function listLabsFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter(
    (feature) =>
      (feature.stage === "optional" || feature.stage === "labs") && !feature.parentId,
  );
}

export function listLabsChildFeatures(parentId: string): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter(
    (feature) =>
      (feature.stage === "optional" || feature.stage === "labs") &&
      feature.parentId === parentId,
  );
}

export function isFeatureEnabled(featureId: string): boolean {
  const feature = FEATURE_REGISTRY[featureId];
  if (!feature) return false;
  if (feature.parentId && !isFeatureEnabled(feature.parentId)) return false;
  if (feature.stage === "released") return true;
  const pref = getLabsFeaturePref(featureId);
  if (typeof pref === "boolean") return pref;
  return defaultOn(feature);
}

/** Session-Flags für Auto-Hausregeln aus den Multi-Einstellungen. */
export function sessionHouseRuleFlagsFromPrefs(): {
  ruleYatzyStreak2: boolean;
  ruleYatzyTriple: boolean;
  ruleYatzyStreak2Credit: boolean;
  ruleYatzyTripleCredit: boolean;
  ruleUpperRace: boolean;
  ruleColumnPoolBonuses: boolean;
  ruleYatzyEfficiency: boolean;
} {
  return {
    ruleYatzyStreak2: isFeatureEnabled("houseRulesYatzyStreak"),
    ruleYatzyTriple: isFeatureEnabled("houseRulesYatzyTriple"),
    ruleYatzyStreak2Credit: isFeatureEnabled("houseRulesYatzyStreakCredit"),
    ruleYatzyTripleCredit: isFeatureEnabled("houseRulesYatzyTripleCredit"),
    ruleUpperRace: isFeatureEnabled("houseRulesUpperRace"),
    ruleColumnPoolBonuses: isFeatureEnabled("houseRulesColumnPoolBonuses"),
    ruleYatzyEfficiency: isFeatureEnabled("houseRulesYatzyEfficiency"),
  };
}

export function subscribeFeatureFlags(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FEATURE_FLAGS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(FEATURE_FLAGS_CHANGED_EVENT, listener);
}
