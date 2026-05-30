import type { StatsDto } from "./statsTypes";
import {
  normalizePairingDetail,
  normalizePairingSummary,
} from "./normalizePairing";
import type { PairingSummaryDto } from "./pairingTypes";
import type { RunDto } from "./types";
import type { SessionLobbyDto, SessionRankingDto } from "./sessionTypes";
import { getApiBase } from "@/lib/apiBase";

type ApiRequestInit = Omit<RequestInit, "headers"> & {
  headers?: HeadersInit;
  playerSecret?: string;
};

async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { playerSecret, ...fetchRest } = init ?? {};
  const headers = new Headers({ "Content-Type": "application/json" });
  if (init?.headers) {
    new Headers(init.headers).forEach((v, k) => headers.set(k, v));
  }
  if (playerSecret) {
    headers.set("X-Player-Secret", playerSecret);
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
  return request<{ run: RunDto }>("/runs", {
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
) {
  return request<{ run: RunDto }>(`/runs/${runId}/fields/${fieldId}/complete`, {
    method: "POST",
    body: JSON.stringify({ score, rollsUsed }),
    playerSecret,
  });
}

export function clearLastField(runId: string, fieldId: string, playerSecret?: string) {
  return request<{ run: RunDto }>(`/runs/${runId}/fields/${fieldId}/clear`, {
    method: "POST",
    playerSecret,
  });
}

export function incrementExtraYatzy(runId: string, playerSecret?: string) {
  return request<{ run: RunDto }>(`/runs/${runId}/extra-yatzy`, {
    method: "POST",
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
