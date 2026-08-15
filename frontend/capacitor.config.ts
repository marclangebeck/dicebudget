import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "de.bottletrade.dicebudget",
  appName: "DiceBudget",
  webDir: "out",
  server: {
    androidScheme: "https",
    iosScheme: "https",
  },
  ios: {
    minVersion: "15.0",
    contentInset: "automatic",
    scrollEnabled: false,
  },
};

export default config;
