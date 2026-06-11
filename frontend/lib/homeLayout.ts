export type HomeLayoutMode = "classic" | "cinematic";

const ENV_LAYOUT = process.env.NEXT_PUBLIC_HOME_LAYOUT;
const STORAGE_KEY = "dicebudget.homeLayout";

/** Build-Zeit-Default (Production: cinematic). */
export function getHomeLayoutFromEnv(): HomeLayoutMode {
  return ENV_LAYOUT === "classic" ? "classic" : "cinematic";
}

/** Laufzeit-Override für schnellen Wechsel ohne Rebuild (Dev/Browser-Konsole). */
export function getHomeLayoutOverride(): HomeLayoutMode | null {
  if (typeof window === "undefined") return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "classic" || stored === "cinematic") return stored;
  return null;
}

export function resolveHomeLayout(): HomeLayoutMode {
  return getHomeLayoutOverride() ?? getHomeLayoutFromEnv();
}

export function setHomeLayoutOverride(mode: HomeLayoutMode | null): void {
  if (typeof window === "undefined") return;
  if (mode === null) {
    window.localStorage.removeItem(STORAGE_KEY);
  } else {
    window.localStorage.setItem(STORAGE_KEY, mode);
  }
}
