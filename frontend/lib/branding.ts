/** Produkt- und App-Store-Name */
export const APP_NAME = "dice.budget";

/** Vollständiger Titel (Store, Manifest) */
export const APP_TITLE = "dice.budget — Strategy Edition";

export const APP_SHORT = "dice.budget";

export const APP_DESCRIPTION =
  "Strategisches Würfelspiel mit Wurf-Pool und wählbarer Spielanzahl";

export const MODE_STRATEGY_LABEL = "dice.budget Strategy Edition";
export const MODE_CLASSIC_LABEL = "dice.budget Klassisch";

/** Öffentliche Website (Datenschutz, App Store) */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://dicebudget.bottle-trade.de";

export const APP_HOME_PATH = "/app";

export const PRIVACY_PATH = "/datenschutz";

export const PRIVACY_URL = `${SITE_URL}${PRIVACY_PATH}`;

/** Kontakt für Datenschutzanfragen */
export const PRIVACY_EMAIL = "datenschutz@bottle-trade.de";
