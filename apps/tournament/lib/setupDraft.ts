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
};

export function loadSetupDraft(): SetupDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SETUP_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SetupDraft;
    if (typeof parsed.name !== "string") return null;
    const draft: SetupDraft = { name: parsed.name };
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
  const next: SetupDraft = { ...current, ...patch };
  if (typeof next.maxEntries === "number") {
    next.maxEntries = clampMaxEntries(next.maxEntries);
  }
  saveSetupDraft(next);
  return next;
}

export function clearSetupDraft(): void {
  window.localStorage.removeItem(SETUP_DRAFT_KEY);
}
