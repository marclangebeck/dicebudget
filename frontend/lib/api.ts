import type { StatsDto } from "./statsTypes";
import {
  normalizePairingDetail,
  normalizePairingSummary,
} from "./normalizePairing";
import type { SessionMatchAnalysisDto } from "./matchAnalysisTypes";
import type { PairingSummaryDto } from "./pairingTypes";
import type { RunDto } from "./types";
import type { SessionLobbyDto, SessionRankingDto } from "./sessionTypes";
import type { HouseRuleAutoEventDto } from "@/lib/ruleEventFeedback";
import { getApiBase } from "@/lib/apiBase";
import { resolveAdminApiKeyForRequest } from "@/lib/adminAccess";

type ApiRequestInit = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  playerSecret?: string;
  adminKey?: string;
};

function getAdminApiKey(): string | undefined {
  return resolveAdminApiKeyForRequest();
}

/** True, wenn Admin freigeschaltet und API-Key verfügbar (M43). */
export function hasAdminApiKey(): boolean {
  return Boolean(getAdminApiKey());
}

async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { playerSecret, adminKey, ...fetchRest } = init ?? {};
  const headers = new Headers({ "Content-Type": "application/json" });
  if (init?.headers) {
    new Headers(init.headers).forEach((v, k) => headers.set(k, v));
  }
  if (playerSecret) {
    headers.set("X-Player-Secret", playerSecret);
  }
  const resolvedAdminKey = adminKey ?? getAdminApiKey();
  if (resolvedAdminKey) {
    headers.set("X-Admin-Key", resolvedAdminKey);
  }

  const res = await fetch(`${getApiBase()}${path}`, {
    ...fetchRest,
    headers,
  });
  const text = await res.text();
  let body: { error?: string };
  if (text) {
    try {
      body = JSON.parse(text) as { error?: string };
    } catch {
      throw new Error("Ungültige Server-Antwort");
    }
  } else {
    body = {};
  }
  if (!res.ok) {
    throw new Error(translateApiError(body.error, res.status));
  }
  return body as T;
}

function translateApiError(message: string | undefined, status: number): string {
  const raw = (message ?? "").trim();
  if (
    raw === "Invalid or missing player token for multiplayer run" ||
    raw.includes("player token")
  ) {
    return "Spieler-Anmeldung ungültig oder abgelaufen. Bitte dem Raum erneut beitreten.";
  }
  if (
    raw === "Invalid or missing admin API key" ||
    raw.toLowerCase().includes("admin api key") ||
    raw.includes("Admin-Schlüssel fehlt") ||
    raw.includes("App-Admin-Key")
  ) {
    return "Admin-Schlüssel fehlt oder ist falsch. Unter Einstellungen → Admin freischalten und Key hinterlegen.";
  }
  if (
    raw === "Admin API not configured" ||
    raw.includes("Admin-API nicht konfiguriert")
  ) {
    return "Admin-API nicht konfiguriert (Server ADMIN_API_KEY fehlt).";
  }
  return raw || `Anfrage fehlgeschlagen (${status})`;
}

export function createRun(gameCount: number, useStrategyRules = true) {
  return request<{ run: RunDto; soloSecretToken: string }>("/runs", {
    method: "POST",
    body: JSON.stringify({ gameCount, useStrategyRules }),
  });
}

export function getRun(runId: string, playerSecret?: string) {
  return request<{ run: RunDto }>(`/runs/${runId}`, { playerSecret });
}

export function recordRoll(
  runId: string,
  fieldId: string,
  diceValues: number[],
  playerSecret?: string,
) {
  return request<{ run: RunDto }>(`/runs/${runId}/fields/${fieldId}/rolls`, {
    method: "POST",
    body: JSON.stringify({ diceValues }),
    playerSecret,
  });
}

export function completeField(
  runId: string,
  fieldId: string,
  score: number,
  rollsUsed: number,
  playerSecret?: string,
  yatzyDieValue?: number,
) {
  const body: { score: number; rollsUsed: number; yatzyDieValue?: number } = {
    score,
    rollsUsed,
  };
  if (yatzyDieValue !== undefined) {
    body.yatzyDieValue = yatzyDieValue;
  }
  return request<{ run: RunDto; events?: HouseRuleAutoEventDto[] }>(
    `/runs/${runId}/fields/${fieldId}/complete`,
    {
      method: "POST",
      body: JSON.stringify(body),
      playerSecret,
    },
  );
}

export function finalizeSessionStats(
  inviteCode: string,
  includeInPairingStats: boolean,
  playerSecret: string,
) {
  return request<{ session: SessionRankingDto }>(
    `/sessions/invite/${encodeURIComponent(inviteCode)}/finalize-stats`,
    {
      method: "POST",
      body: JSON.stringify({ includeInPairingStats }),
      playerSecret,
    },
  );
}

export function clearLastField(runId: string, fieldId: string, playerSecret?: string) {
  return request<{ run: RunDto }>(`/runs/${runId}/fields/${fieldId}/clear`, {
    method: "POST",
    playerSecret,
  });
}

export function incrementExtraYatzy(
  runId: string,
  yatzyDieValue: number,
  playerSecret?: string,
) {
  return request<{ run: RunDto }>(`/runs/${runId}/extra-yatzy`, {
    method: "POST",
    body: JSON.stringify({ yatzyDieValue }),
    playerSecret,
  });
}

export function finishRun(runId: string, playerSecret?: string) {
  return request<{ run: RunDto }>(`/runs/${runId}/finish`, {
    method: "POST",
    playerSecret,
  });
}

/** Eigenen Run vorzeitig beenden (offene Felder zählen nicht). */
export function abandonRun(runId: string, playerSecret?: string) {
  return request<{ run: RunDto }>(`/runs/${runId}/abandon`, {
    method: "POST",
    playerSecret,
  });
}

export function applyBurnRoll(
  runId: string,
  fieldId: string,
  mode: "reroll" | "set_face" = "reroll",
  playerSecret?: string,
) {
  return request<{ run: RunDto }>(`/runs/${runId}/house-rules/burn`, {
    method: "POST",
    body: JSON.stringify({ fieldId, mode }),
    playerSecret,
  });
}

export function applyYatzyStreakPenalty(
  runId: string,
  victimPlayerId: string,
  playerSecret?: string,
) {
  return request<{
    beneficiaryRun: RunDto;
    victimRun: RunDto;
    victimPlayerId: string;
    victimPlayerName: string;
    poolsLost: number;
  }>(`/runs/${runId}/house-rules/yatzy-streak-penalty`, {
    method: "POST",
    body: JSON.stringify({ victimPlayerId }),
    playerSecret,
  });
}

export function applyRollSale(
  inviteCode: string,
  sellerPlayerId: string,
  buyerPlayerId: string,
  pools: number,
  playerSecret: string,
) {
  return request<{
    sellerRun: RunDto;
    buyerRun: RunDto;
    sellerPlayerId: string;
    buyerPlayerId: string;
    pools: number;
  }>(`/sessions/invite/${encodeURIComponent(inviteCode)}/roll-sale`, {
    method: "POST",
    body: JSON.stringify({ sellerPlayerId, buyerPlayerId, pools }),
    playerSecret,
  });
}

export function getStats() {
  return request<{ stats: StatsDto }>("/stats");
}

export async function getPairingSummaries() {
  const { pairings } = await request<{ pairings: unknown[] }>("/stats/pairings");
  return {
    pairings: (pairings ?? [])
      .map(normalizePairingSummary)
      .filter((p): p is PairingSummaryDto => p !== null),
  };
}

export function resetPairings(keys: string[]) {
  return request<{
    deletedSessions: number;
    skippedMultiPlayer: number;
    leaguesRebuilt: number;
  }>("/stats/pairings/reset", {
    method: "POST",
    body: JSON.stringify({ keys }),
  });
}

export type PairingBaselineEntry = {
  key: string;
  extraWinsA: number;
  extraWinsB: number;
  extraBonusA: number;
  extraBonusB: number;
  isAbsolute?: boolean;
  note?: string | null;
};

/** Manuell nachgetragene Werte (außerhalb der App gespielt) speichern. */
export function upsertPairingBaselines(entries: PairingBaselineEntry[]) {
  return request<{ written: number; deleted: number }>(
    "/stats/pairings/baseline",
    {
      method: "POST",
      body: JSON.stringify({ entries }),
    },
  );
}

export async function getPairingDetail(key: string) {
  const { pairing } = await request<{ pairing: unknown }>(
    `/stats/pairing?key=${encodeURIComponent(key)}`,
  );
  const normalized = normalizePairingDetail(pairing);
  if (!normalized) {
    throw new Error("Paarung nicht gefunden");
  }
  return { pairing: normalized };
}

export function createGameSession(
  gameCount: number,
  maxPlayers: number,
  useStrategyRules = true,
  leagueCode?: string,
  showOpponentPool = false,
  poolEndgameEnabled = false,
  houseRules?: {
    ruleYatzyStreak2?: boolean;
    ruleYatzyTriple?: boolean;
    ruleYatzyStreak2Credit?: boolean;
    ruleYatzyTripleCredit?: boolean;
    ruleUpperRace?: boolean;
    ruleColumnPoolBonuses?: boolean;
  },
) {
  return request<{ session: SessionLobbyDto }>("/sessions", {
    method: "POST",
    body: JSON.stringify({
      gameCount,
      maxPlayers,
      useStrategyRules,
      leagueCode,
      showOpponentPool,
      poolEndgameEnabled,
      houseRules,
    }),
  });
}

export function getSessionLobby(inviteCode: string, options?: { lite?: boolean }) {
  const lite = options?.lite ? "?lite=1" : "";
  return request<{ session: SessionLobbyDto }>(
    `/sessions/invite/${encodeURIComponent(inviteCode)}${lite}`,
  );
}

export function joinSession(inviteCode: string, playerId: string) {
  return request<{
    player: {
      id: string;
      playerId: string;
      orderIndex: number;
      secretToken: string;
      runId: string;
    };
    run: RunDto;
    fieldCount: number;
    maxRolls: number | null;
  }>(`/sessions/invite/${encodeURIComponent(inviteCode)}/join`, {
    method: "POST",
    body: JSON.stringify({ playerId }),
  });
}

export function getSessionRanking(inviteCode: string) {
  return request<{ session: SessionRankingDto }>(
    `/sessions/invite/${encodeURIComponent(inviteCode)}/ranking`,
  );
}

export function getSessionMatchAnalysis(
  inviteCode: string,
  viewerPlayerId: string,
  playerSecret?: string,
) {
  return request<{ analysis: SessionMatchAnalysisDto }>(
    `/sessions/invite/${encodeURIComponent(inviteCode)}/match-analysis?viewerPlayerId=${encodeURIComponent(viewerPlayerId)}`,
    { playerSecret },
  );
}

/** Pool-Endspiel auflösen: Feld verbessern oder alten Wert behalten (M33). */
export function resolvePoolEndgame(
  inviteCode: string,
  payload: { keep: true } | { fieldId: string; score: number },
  playerSecret?: string,
) {
  return request<{ session: SessionRankingDto }>(
    `/sessions/invite/${encodeURIComponent(inviteCode)}/pool-endgame`,
    {
      method: "POST",
      body: JSON.stringify(payload),
      playerSecret,
    },
  );
}
