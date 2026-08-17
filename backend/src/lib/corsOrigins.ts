const EXACT_ORIGINS = new Set([
  "http://127.0.0.1:3021",
  "http://localhost:3021",
  "http://127.0.0.1:3022",
  "http://localhost:3022",
  "https://dicebudget.bottle-trade.de",
  "capacitor://localhost",
  "ionic://localhost",
  "https://localhost",
  "http://localhost",
]);

/** Capacitor iOS mit iosScheme https nutzt Origin https://localhost (sonst „Load failed“). */
export function isAllowedCorsOrigin(origin: string | undefined): boolean {
  if (!origin) return true;
  if (EXACT_ORIGINS.has(origin)) return true;
  try {
    const url = new URL(origin);
    const localHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    const localScheme =
      url.protocol === "http:" ||
      url.protocol === "https:" ||
      url.protocol === "capacitor:" ||
      url.protocol === "ionic:";
    return localHost && localScheme;
  } catch {
    return origin.startsWith("capacitor:") || origin.startsWith("ionic:");
  }
}
