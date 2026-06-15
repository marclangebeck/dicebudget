/**
 * Freischaltung der Entwickler-Vorschau (Labor) per Code.
 * Code kommt aus NEXT_PUBLIC_LABS_PIN (Build-Zeit, Web + iOS).
 */

const LABS_UNLOCKED_KEY = "dicebudget.labsUnlocked.v1";
export const LABS_CHANGED_EVENT = "dicebudget:labs-changed";

function readConfiguredPin(): string {
  return (process.env.NEXT_PUBLIC_LABS_PIN ?? "").trim();
}

export function isLabsPinConfigured(): boolean {
  return readConfiguredPin().length > 0;
}

/** Nur für Tests: optionaler Override des erwarteten Codes. */
export function verifyLabsPin(code: string, expectedPinOverride?: string): boolean {
  const expected = (expectedPinOverride ?? readConfiguredPin()).trim();
  if (!expected) return false;
  return code.trim() === expected;
}

export function isLabsUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(LABS_UNLOCKED_KEY) === "1";
}

export function unlockLabs(code: string): boolean {
  if (!verifyLabsPin(code)) return false;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LABS_UNLOCKED_KEY, "1");
    window.dispatchEvent(new Event(LABS_CHANGED_EVENT));
  }
  return true;
}

export function lockLabs(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(LABS_UNLOCKED_KEY);
    window.dispatchEvent(new Event(LABS_CHANGED_EVENT));
  }
}

export function subscribeLabsAccess(listener: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(LABS_CHANGED_EVENT, listener);
  return () => window.removeEventListener(LABS_CHANGED_EVENT, listener);
}
