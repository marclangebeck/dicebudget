/**
 * Admin-Zugang: ein Build, PIN-Freischaltung + lokal hinterlegter API-Key.
 * Server-Aktionen weiter über X-Admin-Key (Backend ADMIN_API_KEY).
 */

const ADMIN_UNLOCKED_KEY = "dicebudget.adminUnlocked.v1";
const ADMIN_API_KEY_STORAGE = "dicebudget.adminApiKey.v1";
export const ADMIN_CHANGED_EVENT = "dicebudget:admin-changed";

function readConfiguredPin(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_PIN ?? "").trim();
}

function readEnvAdminApiKey(): string {
  return (process.env.NEXT_PUBLIC_ADMIN_API_KEY ?? "").trim();
}

function notifyAdminChanged(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(ADMIN_CHANGED_EVENT));
}

export function isAdminPinConfigured(): boolean {
  return readConfiguredPin().length > 0;
}

/** Nur für Tests: optionaler Override des erwarteten Codes. */
export function verifyAdminPin(code: string, expectedPinOverride?: string): boolean {
  const expected = (expectedPinOverride ?? readConfiguredPin()).trim();
  if (!expected) return false;
  return code.trim() === expected;
}

export function isAdminUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ADMIN_UNLOCKED_KEY) === "1";
}

export function unlockAdmin(code: string): boolean {
  if (!verifyAdminPin(code)) return false;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ADMIN_UNLOCKED_KEY, "1");
    notifyAdminChanged();
  }
  return true;
}

/** Sperrt die Admin-Session; hinterlegter Key bleibt (erneut nach PIN nutzbar). */
export function lockAdmin(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ADMIN_UNLOCKED_KEY);
    notifyAdminChanged();
  }
}

export function getStoredAdminApiKey(): string {
  if (typeof window === "undefined") return "";
  return (window.localStorage.getItem(ADMIN_API_KEY_STORAGE) ?? "").trim();
}

export function setStoredAdminApiKey(key: string): void {
  if (typeof window === "undefined") return;
  const trimmed = key.trim();
  if (trimmed) {
    window.localStorage.setItem(ADMIN_API_KEY_STORAGE, trimmed);
  } else {
    window.localStorage.removeItem(ADMIN_API_KEY_STORAGE);
  }
  notifyAdminChanged();
}

export function clearStoredAdminApiKey(): void {
  setStoredAdminApiKey("");
}

/** Roh-Key aus Env oder lokalem Speicher (ohne Unlock-Check). */
export function peekAdminApiKeyRaw(): string {
  return readEnvAdminApiKey() || getStoredAdminApiKey();
}

/**
 * Key für API-Header: nur wenn freigeschaltet (bei konfigurierter PIN)
 * bzw. Legacy-Env-Key ohne PIN-Gate.
 */
export function resolveAdminApiKeyForRequest(): string | undefined {
  const key = peekAdminApiKeyRaw();
  if (!key) return undefined;
  if (isAdminPinConfigured()) {
    return isAdminUnlocked() ? key : undefined;
  }
  // Legacy: eingebetteter Env-Key ohne PIN
  return readEnvAdminApiKey() || undefined;
}

/** Stats/Admin-UI: Key verfügbar und (falls PIN) freigeschaltet. */
export function hasAdminAccess(): boolean {
  return Boolean(resolveAdminApiKeyForRequest());
}

export function hasStoredOrEnvAdminApiKey(): boolean {
  return Boolean(peekAdminApiKeyRaw());
}

export function subscribeAdminAccess(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(ADMIN_CHANGED_EVENT, listener);
  return () => window.removeEventListener(ADMIN_CHANGED_EVENT, listener);
}
