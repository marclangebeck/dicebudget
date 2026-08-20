export const APP_NAME = "DiceBudget Tournament";
export const APP_SHORT = "Tournament";
export const PARTICIPANT_APP_NAME = "DiceBudget Pro";
export const PARTICIPANT_APP_SUBTITLE = "Strategy Edition · iOS";
export const PARTICIPANT_APP_TAGLINE =
  "Strategisches Würfelspiel mit Wurf-Pool, Multiplayer und Turnier-Modus — die App für alle Spieler.";
export const PARTICIPANT_APP_BADGE = "Für iPhone & iPad";
export const PARTICIPANT_APP_FEATURE_BADGE = "Turnier-Modus";
export const PARTICIPANT_APP_CTA_STORE = "Im App Store";
export const PARTICIPANT_APP_CTA_LEARN = "Mehr erfahren";

const SITE_BASE =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "")) ||
  "https://dicebudget.bottle-trade.de";

/** Produktseite / Web-App — bis der Store-Link feststeht. */
export const PARTICIPANT_APP_LANDING_URL = `${SITE_BASE}/app`;

/** Optional: `NEXT_PUBLIC_DICEBUDGET_APP_STORE_URL` setzen, sobald live. */
export const PARTICIPANT_APP_STORE_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_DICEBUDGET_APP_STORE_URL?.trim()) ||
  "";

export const PARTICIPANT_APP_ICON_URL = `${SITE_BASE}/apple-touch-icon.png`;

export function participantAppPromoUrl(): string {
  return PARTICIPANT_APP_STORE_URL || PARTICIPANT_APP_LANDING_URL;
}

export function participantAppPromoCtaLabel(): string {
  return PARTICIPANT_APP_STORE_URL
    ? PARTICIPANT_APP_CTA_STORE
    : PARTICIPANT_APP_CTA_LEARN;
}

export const APP_TAGLINE =
  "Turniere orchestrieren — Auslosung, Live-Stand, Anzeige für alle.";

/** iOS App Store / TestFlight — sobald Tournament live ist. */
export const TOURNAMENT_APP_STORE_URL =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_TOURNAMENT_APP_STORE_URL?.trim()) ||
  "";
