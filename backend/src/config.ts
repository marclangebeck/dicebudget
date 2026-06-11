export const PORT = Number(process.env.PORT ?? 3020);

/** Pflicht für destruktive Stats-Endpunkte (`X-Admin-Key`). */
export const ADMIN_API_KEY = process.env.ADMIN_API_KEY?.trim() || "";
export const MIN_GAME_COUNT = 1;
export const MAX_GAME_COUNT = 6;
export const FIELDS_PER_GAME = 13;
export const ROLLS_PER_FIELD = 3;
export const MIN_SESSION_PLAYERS = 2;
export const MAX_SESSION_PLAYERS = 6;

export function maxRollsForGameCount(gameCount: number): number {
  return gameCount * FIELDS_PER_GAME * ROLLS_PER_FIELD;
}

export function fieldCountForGameCount(gameCount: number): number {
  return gameCount * FIELDS_PER_GAME;
}
