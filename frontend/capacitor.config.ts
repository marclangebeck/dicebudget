import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Wichtig: `server.url` = Live-Website.
 * Ohne das packt TestFlight nur das lokale `ios/App/App/public` und driftet
 * sofort von Web weg (wiederholt passiert bei Build 98/99/…).
 * Nach einem Archive mit dieser Config folgt die App dem Server-Frontend.
 */
const LIVE_ORIGIN = "https://dicebudget.bottle-trade.de";

const config: CapacitorConfig = {
  appId: "de.bottletrade.dicebudget",
  appName: "DiceBudget",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
    url: `${LIVE_ORIGIN}/app`,
    allowNavigation: ["dicebudget.bottle-trade.de"],
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: false,
  },
};

export default config;
