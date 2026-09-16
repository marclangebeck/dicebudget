import { APP_STORE_URL } from "@/lib/branding";

/** Browser: keine kostenlose Web-Spiel-UI. Native Capacitor-App bleibt auf diesen Routen. */
export const WEB_PLAY_ROUTE_PREFIXES = [
  "/app",
  "/play",
  "/solo",
  "/multi",
  "/stats",
  "/settings",
  "/tournament",
] as const;

export function isWebPlayRoute(pathname: string): boolean {
  return WEB_PLAY_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function isNativeAppClient(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    return Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

export function getPublicWebPlayRedirectUrl(): string {
  return APP_STORE_URL;
}
