/** Läuft die UI in Capacitor (iOS/Android), nicht im Browser. */
export function isNativeShell(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as Window & { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  if (cap?.isNativePlatform?.()) return true;
  const protocol = window.location.protocol;
  return protocol === "capacitor:" || protocol === "ionic:";
}

/** Browser-Zugriff erlaubt (Dev oder explizites Override). */
export function isBrowserAccessAllowed(): boolean {
  if (isNativeShell()) return true;
  if (process.env.NEXT_PUBLIC_ALLOW_BROWSER === "1") return true;
  if (process.env.NODE_ENV === "development") return true;
  return false;
}
