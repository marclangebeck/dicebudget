/**
 * Anzeige-Version für Menü / Support.
 * iOS: NEXT_PUBLIC_APP_BUILD an Xcode CURRENT_PROJECT_VERSION angleichen (z. B. 29).
 * Web: typisch "web" oder gleiche Build-Nummer wie der aktuelle Store-Stand.
 */

export const APP_MARKETING_VERSION =
  process.env.NEXT_PUBLIC_APP_VERSION?.trim() || "2.0";

export const APP_BUILD_NUMBER =
  process.env.NEXT_PUBLIC_APP_BUILD?.trim() || "web";

/** z. B. "Version 2.0 (29)" oder "Version 2.0 (web)" */
export function formatAppVersionLabel(
  marketing = APP_MARKETING_VERSION,
  build = APP_BUILD_NUMBER,
): string {
  return `Version ${marketing} (${build})`;
}
