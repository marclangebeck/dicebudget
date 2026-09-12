import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Eingebettetes Web-Bundle (wie bisher): kein server.url.
 * UI kommt aus ios/App/App/public nach `npm run build` + `npx cap sync ios`.
 * Vor jedem TestFlight-Archive: `npm run build:ios` und `npm run verify:ios-web`.
 */
const config: CapacitorConfig = {
  appId: "de.bottletrade.dicebudget",
  appName: "DiceBudget",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  ios: {
    contentInset: "automatic",
    scrollEnabled: false,
  },
};

export default config;
