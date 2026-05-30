/**
 * Lokale Geräte-Einstellungen (kein Backend, kein Sync).
 * Aktuell: Bonus-Einblendung (M31) an/aus.
 */

const BONUS_CELEBRATION_KEY = "dicebudget.bonusCelebration";

/** Default: an. Nur "0" gilt als ausgeschaltet. */
export function getBonusCelebrationEnabled(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(BONUS_CELEBRATION_KEY) !== "0";
}

export function setBonusCelebrationEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(BONUS_CELEBRATION_KEY, enabled ? "1" : "0");
}
