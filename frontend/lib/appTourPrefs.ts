/**
 * Lokale Tour-Präferenzen (kein Backend).
 * dontShowAgain = Häkchen „nicht erneut anzeigen“ / Tour erledigt.
 */

import {
  parseAppTourChapterParam,
  type AppTourChapterId,
} from "./appTourSteps";

const STORAGE_KEY = "dicebudget.appTour.v1";
const PENDING_TOUR_KEY = "dicebudget.appTour.pending";
export const APP_TOUR_CHANGED_EVENT = "dicebudget:app-tour-changed";
export const APP_TOUR_REQUEST_EVENT = "dicebudget:app-tour-request";

export type AppTourPrefs = {
  /** true = Tour nicht automatisch starten (Häkchen gesetzt). */
  dontShowAgain: boolean;
};

export type AppTourRequest = {
  chapter: AppTourChapterId | "all";
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

/**
 * Tour aus Menü/Deep-Link anfordern.
 * Pending-Flag für Navigation auf /app + Event, falls Startscreen schon aktiv ist.
 */
export function requestAppTour(chapter: AppTourChapterId | "all" = "all"): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(PENDING_TOUR_KEY, chapter);
  window.dispatchEvent(
    new CustomEvent<AppTourRequest>(APP_TOUR_REQUEST_EVENT, { detail: { chapter } }),
  );
}

export function consumePendingAppTour(): AppTourChapterId | "all" | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(PENDING_TOUR_KEY);
  if (!raw) return null;
  window.sessionStorage.removeItem(PENDING_TOUR_KEY);
  return parseAppTourChapterParam(raw);
}

export function subscribeAppTourRequest(
  listener: (chapter: AppTourChapterId | "all") => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<AppTourRequest>).detail;
    const chapter =
      detail?.chapter ??
      parseAppTourChapterParam(window.sessionStorage.getItem(PENDING_TOUR_KEY));
    if (!chapter) return;
    window.sessionStorage.removeItem(PENDING_TOUR_KEY);
    listener(chapter);
  };
  window.addEventListener(APP_TOUR_REQUEST_EVENT, handler);
  return () => window.removeEventListener(APP_TOUR_REQUEST_EVENT, handler);
}
