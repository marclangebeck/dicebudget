import { SITE_URL } from "@/lib/branding";
import { normalizeInviteCode } from "@/lib/activeGame";
import { pathFromInviteDeepLink } from "@/lib/inviteJoinUrl";

export const TOURNAMENT_JOIN_PATH = "/tournament/join";

/** Öffentliche Event-Join-URL für QR und Universal Links (Host-QR). */
export function buildTournamentJoinUrl(
  inviteCode: string,
  siteUrl: string = SITE_URL,
): string {
  const code = normalizeInviteCode(inviteCode);
  const base = siteUrl.replace(/\/$/, "");
  return `${base}${TOURNAMENT_JOIN_PATH}?code=${encodeURIComponent(code)}`;
}

/**
 * Extrahiert den App-Pfad aus einem Event-Join-Link.
 * z. B. https://dicebudget…/tournament/join?code=ABC → /tournament/join?code=ABC
 */
export function pathFromTournamentJoinDeepLink(rawUrl: string): string | null {
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    const path = url.pathname.replace(/\/$/, "") || "/";
    if (path !== TOURNAMENT_JOIN_PATH && !path.startsWith(`${TOURNAMENT_JOIN_PATH}/`)) {
      return null;
    }
    const code = normalizeInviteCode(url.searchParams.get("code") ?? "");
    if (code.length < 6) return null;
    return `${TOURNAMENT_JOIN_PATH}?code=${encodeURIComponent(code)}`;
  } catch {
    if (trimmed.startsWith(TOURNAMENT_JOIN_PATH)) {
      try {
        const url = new URL(trimmed, "https://dicebudget.bottle-trade.de");
        const code = normalizeInviteCode(url.searchParams.get("code") ?? "");
        if (code.length < 6) return null;
        return `${TOURNAMENT_JOIN_PATH}?code=${encodeURIComponent(code)}`;
      } catch {
        return null;
      }
    }
    return null;
  }
}

/** Multi- oder Event-Join aus Universal Link / QR-URL. */
export function pathFromAnyJoinDeepLink(rawUrl: string): string | null {
  return pathFromTournamentJoinDeepLink(rawUrl) ?? pathFromInviteDeepLink(rawUrl);
}
