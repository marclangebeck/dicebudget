import { SITE_URL } from "@/lib/branding";
import { normalizeInviteCode } from "@/lib/activeGame";

export const APPLE_TEAM_ID = "5QGGV8N5ZD";
export const APP_BUNDLE_ID = "de.bottletrade.dicebudget";
/** Format für apple-app-site-association */
export const APPLE_APP_ID = `${APPLE_TEAM_ID}.${APP_BUNDLE_ID}`;

export const JOIN_PATH = "/multi/join";

/** Öffentliche Join-URL für QR und Universal Links. */
export function buildInviteJoinUrl(inviteCode: string, siteUrl: string = SITE_URL): string {
  const code = normalizeInviteCode(inviteCode);
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${JOIN_PATH}?code=${encodeURIComponent(code)}`;
}

/**
 * Extrahiert den App-Pfad aus einem Universal-Link / Deep-Link.
 * z. B. https://dicebudget…/multi/join?code=ABC → /multi/join?code=ABC
 */
export function pathFromInviteDeepLink(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const path = url.pathname.replace(/\/$/, "") || "/";
    if (path !== JOIN_PATH && path !== `${JOIN_PATH}/`) {
      // Nur Join-Links navigieren wir gezielt; andere Site-Links ignorieren
      if (!path.startsWith(JOIN_PATH)) return null;
    }
    const code = normalizeInviteCode(url.searchParams.get("code") ?? "");
    if (code.length < 6) return null;
    return `${JOIN_PATH}?code=${encodeURIComponent(code)}`;
  } catch {
    // Relative Pfade
    if (trimmed.startsWith(JOIN_PATH)) {
      try {
        const url = new URL(trimmed, "https://dicebudget.bottle-trade.de");
        const code = normalizeInviteCode(url.searchParams.get("code") ?? "");
        if (code.length < 6) return null;
        return `${JOIN_PATH}?code=${encodeURIComponent(code)}`;
      } catch {
        return null;
      }
    }
    return null;
  }
}
