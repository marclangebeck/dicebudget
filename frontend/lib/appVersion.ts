/**
 * Anzeige-Version für Menü / Support.
 *
 * iOS (Capacitor): zur Laufzeit aus dem nativen Bundle (`App.getInfo`) —
 * entspricht Xcode Marketing Version + Build (CFBundleShortVersionString / CFBundleVersion).
 * Web: `NEXT_PUBLIC_APP_VERSION` + `NEXT_PUBLIC_APP_BUILD` (typisch Build = "web").
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

export type NativeAppVersionInfo = {
  version?: string;
  build?: string;
};

/** Wählt Marketing/Build: Native gewinnt, sonst Env-Fallback. */
export function pickVersionParts(input: {
  native?: NativeAppVersionInfo | null;
  marketingFallback?: string;
  buildFallback?: string;
}): { marketing: string; build: string } {
  const marketingFallback = input.marketingFallback ?? APP_MARKETING_VERSION;
  const buildFallback = input.buildFallback ?? APP_BUILD_NUMBER;
  const marketing = input.native?.version?.trim() || marketingFallback;
  const build = input.native?.build?.trim() || buildFallback;
  return { marketing, build };
}

/**
 * Label für die UI: auf iOS/Android die installierte Bundle-Version,
 * im Browser die Build-Zeit-Env (Fallback).
 */
export async function resolveAppVersionLabel(): Promise<string> {
  let native: NativeAppVersionInfo | null = null;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { App } = await import("@capacitor/app");
      const info = await App.getInfo();
      native = { version: info.version, build: info.build };
    }
  } catch {
    native = null;
  }
  const parts = pickVersionParts({ native });
  return formatAppVersionLabel(parts.marketing, parts.build);
}
