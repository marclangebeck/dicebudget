import { SITE_URL } from "@/lib/branding";

const DEV_API = "http://127.0.0.1:3020";
const NATIVE_API = `${SITE_URL}/api`;

/** Läuft die UI in der Capacitor-iOS/Android-Hülle? */
export function isCapacitorNative(): boolean {
  if (typeof window === "undefined") return false;
  const p = window.location.protocol;
  return p === "capacitor:" || p === "ionic:";
}

/**
 * API-Basis:
 * - Browser auf dicebudget: `/api` (same-origin)
 * - Capacitor: absolute Produktions-URL
 * - Lokal Dev: 127.0.0.1:3020
 */
export function getApiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (isCapacitorNative()) {
    return (
      process.env.NEXT_PUBLIC_API_URL_NATIVE?.trim() || NATIVE_API
    );
  }
  if (env && env.startsWith("/")) return env;
  if (env) return env;
  if (typeof window !== "undefined") return DEV_API;
  return env || DEV_API;
}
