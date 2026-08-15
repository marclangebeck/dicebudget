const SETUP_DRAFT_KEY = "dicebudget.tournament.setupDraft.v1";

export type SetupDraft = {
  name: string;
};

export function loadSetupDraft(): SetupDraft | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SETUP_DRAFT_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SetupDraft;
    if (typeof parsed.name === "string") {
      return { name: parsed.name };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function saveSetupDraft(draft: SetupDraft): void {
  window.localStorage.setItem(SETUP_DRAFT_KEY, JSON.stringify(draft));
}

export function clearSetupDraft(): void {
  window.localStorage.removeItem(SETUP_DRAFT_KEY);
}
