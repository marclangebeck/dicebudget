/** Produkt- und App-Store-Name */
export const APP_NAME = "DiceBudget";

/** Vollständiger Titel (Store, Manifest) */
export const APP_TITLE = "DiceBudget — Strategy Edition";

export const APP_SHORT = "DiceBudget";

export const APP_DESCRIPTION =
  "Strategisches Würfelspiel mit Wurf-Pool und wählbarer Spielanzahl";

export const MODE_STRATEGY_LABEL = "DiceBudget Strategy Edition";
export const MODE_CLASSIC_LABEL = "DiceBudget Klassisch";

/** Öffentliche Website (Datenschutz, App Store) */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dicebudget.bottle-trade.de";

export const APP_HOME_PATH = "/app";

export const PRIVACY_PATH = "/datenschutz";

export const IMPRESSUM_PATH = "/impressum";

export const PRIVACY_URL = `${SITE_URL}${PRIVACY_PATH}`;

export const IMPRESSUM_URL = `${SITE_URL}${IMPRESSUM_PATH}`;

/** Kontakt (Impressum, Datenschutz, Support) */
export const CONTACT_EMAIL = "info@bottle-trade.de";

/** Alias für Datenschutzanfragen */
export const PRIVACY_EMAIL = CONTACT_EMAIL;
