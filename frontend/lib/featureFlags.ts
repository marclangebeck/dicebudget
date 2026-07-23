/**
 * Feature-Register für schrittweisen Rollout.
 * - stage "labs": nur nach Code-Freischaltung + Toggle im Labor
 * - stage "released": für alle Nutzer aktiv
 */

import { isLabsUnlocked } from "@/lib/labsAccess";

const LABS_PREFS_KEY = "dicebudget.labsFeatures.v1";
export const FEATURE_FLAGS_CHANGED_EVENT = "dicebudget:feature-flags-changed";

export type FeatureStage = "labs" | "released";

export type FeatureDefinition = {
  id: string;
  title: string;
  description: string;
  stage: FeatureStage;
  /** Standard im Labor, wenn noch kein Toggle gesetzt wurde. */
  defaultLabsOn?: boolean;
};

/**
 * Neue Vorschau-Features hier registrieren.
 * Marktreif → stage auf "released" setzen und ggf. in normale Einstellungen verschieben.
 */
export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  houseRulesBurn: {
    id: "houseRulesBurn",
    title: "Hausregel: Brennt",
    description: "Ungültiger Wurf am Tisch: −1 Pool, physisch neu würfeln.",
    stage: "labs",
    defaultLabsOn: true,
  },
  houseRulesRollSale: {
    id: "houseRulesRollSale",
    title: "Hausregel: Wurf verkaufen",
    description: "Bei voller Feldzeile Wurf verkaufen, Freifeld ohne Würfeln.",
    stage: "labs",
    defaultLabsOn: true,
  },
  houseRulesYatzyStreak: {
    id: "houseRulesYatzyStreak",
    title: "Hausregel: 2× Alle Fünfe",
    description: "Zwei Alle Fünfe (≤3 Würfe) hintereinander: Gegner verliert halben Pool.",
    stage: "labs",
    defaultLabsOn: true,
  },
};

export type FeatureId = keyof typeof FEATURE_REGISTRY;

function readLabsPrefs(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(LABS_PREFS_KEY);
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

function writeLabsPrefs(prefs: Record<string, boolean>): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LABS_PREFS_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event(FEATURE_FLAGS_CHANGED_EVENT));
}

export function getLabsFeaturePref(featureId: string): boolean | undefined {
  const prefs = readLabsPrefs();
  return prefs[featureId];
}

export function setLabsFeaturePref(featureId: string, enabled: boolean): void {
  const prefs = readLabsPrefs();
  prefs[featureId] = enabled;
  writeLabsPrefs(prefs);
}

export function listLabsFeatures(): FeatureDefinition[] {
  return Object.values(FEATURE_REGISTRY).filter((feature) => feature.stage === "labs");
}

export function isFeatureEnabled(featureId: string): boolean {
  const feature = FEATURE_REGISTRY[featureId];
  if (!feature) return false;
  if (feature.stage === "released") return true;
  if (!isLabsUnlocked()) return false;
  const pref = getLabsFeaturePref(featureId);
  if (typeof pref === "boolean") return pref;
  return Boolean(feature.defaultLabsOn);
}

export function subscribeFeatureFlags(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(FEATURE_FLAGS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(FEATURE_FLAGS_CHANGED_EVENT, listener);
}
