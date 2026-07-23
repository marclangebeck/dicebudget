/**
 * Lokale Tour-Präferenzen (kein Backend).
 * dontShowAgain = Häkchen „nicht erneut anzeigen“ / Tour erledigt.
 */

const STORAGE_KEY = "dicebudget.appTour.v1";
export const APP_TOUR_CHANGED_EVENT = "dicebudget:app-tour-changed";

export type AppTourPrefs = {
  /** true = Tour nicht automatisch starten (Häkchen gesetzt). */
  dontShowAgain: boolean;
};

export const DEFAULT_APP_TOUR_PREFS: AppTourPrefs = {
  dontShowAgain: false,
};

function readPrefs(): AppTourPrefs {
  if (typeof window === "undefined") return { ...DEFAULT_APP_TOUR_PREFS };
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return { ...DEFAULT_APP_TOUR_PREFS };
  try {
    const parsed = JSON.parse(raw) as Partial<AppTourPrefs>;
    return {
      dontShowAgain: Boolean(parsed.dontShowAgain),
    };
  } catch {
    return { ...DEFAULT_APP_TOUR_PREFS };
  }
}

function writePrefs(prefs: AppTourPrefs): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  window.dispatchEvent(new Event(APP_TOUR_CHANGED_EVENT));
}

export function getAppTourPrefs(): AppTourPrefs {
  return readPrefs();
}

export function setAppTourPrefs(update: Partial<AppTourPrefs>): AppTourPrefs {
  const next = { ...readPrefs(), ...update };
  writePrefs(next);
  return next;
}

/** Automatisch starten, solange das Häkchen nicht gesetzt ist. */
export function shouldAutoStartAppTour(): boolean {
  return !readPrefs().dontShowAgain;
}

export function subscribeAppTourPrefs(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(APP_TOUR_CHANGED_EVENT, listener);
  return () => window.removeEventListener(APP_TOUR_CHANGED_EVENT, listener);
}
