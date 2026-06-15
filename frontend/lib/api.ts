import type { StatsDto } from "./statsTypes";
import {
  normalizePairingDetail,
  normalizePairingSummary,
} from "./normalizePairing";
import type { SessionMatchAnalysisDto } from "./matchAnalysisTypes";
import type { PairingSummaryDto } from "./pairingTypes";
import type { RunDto } from "./types";
import type { SessionLobbyDto, SessionRankingDto } from "./sessionTypes";
import { getApiBase } from "@/lib/apiBase";

type ApiRequestInit = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  playerSecret?: string;
  adminKey?: string;
};

function getAdminApiKey(): string | undefined {
  const key = process.env.NEXT_PUBLIC_ADMIN_API_KEY?.trim();
  return key || undefined;
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
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return body as T;
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
  return request<{ run: RunDto }>(`/runs/${runId}/fields/${fieldId}/complete`, {
    method: "POST",
    body: JSON.stringify(body),
    playerSecret,
  });
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

export function applyBurnRoll(runId: string, fieldId: string, playerSecret?: string) {
  return request<{ run: RunDto }>(`/runs/${runId}/house-rules/burn`, {
    method: "POST",
    body: JSON.stringify({ fieldId }),
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
    }),
  });
}

export function getSessionLobby(inviteCode: string) {
  return request<{ session: SessionLobbyDto }>(
    `/sessions/invite/${encodeURIComponent(inviteCode)}`,
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
