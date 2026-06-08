/** Erlaubte Rückziele von /settings (nur Setup-Screens). */
export const SETTINGS_RETURN_TARGETS = {
  solo: { href: "/solo", label: "Einzelspiel" },
  multi: { href: "/multi", label: "Multiplayer" },
} as const;

export type SettingsReturnKey = keyof typeof SETTINGS_RETURN_TARGETS;

export function parseSettingsReturn(
  from: string | null | undefined,
): (typeof SETTINGS_RETURN_TARGETS)[SettingsReturnKey] | null {
  if (!from) return null;
  const key = from.trim().toLowerCase();
  if (key === "solo" || key === "multi") {
    return SETTINGS_RETURN_TARGETS[key];
  }
  return null;
}

export function settingsHrefWithReturn(returnKey: SettingsReturnKey): string {
  return `/settings?from=${returnKey}`;
}
