import { computeGameBreakdown, gameIndexForExtraYatzyClick } from "@/lib/gameScoring";
import { poolDeltaForComplete } from "@/lib/gameRules";
import { SHEET_ROWS } from "@/lib/labels";
import type { FieldDto, FieldTypeId, GameDto, RunDto } from "@/lib/types";

const STORAGE_KEY = "dicebudget.localSoloRuns.v1";
const LOCAL_RUN_PREFIX = "local-run-";

type LocalSoloState = {
  run: RunDto;
  nextScoredSequence: number;
  scoredSequenceByFieldId: Record<string, number>;
};

type LocalSoloStore = Record<string, LocalSoloState>;

function nowIso(): string {
  return new Date().toISOString();
}

function createId(prefix: string): string {
  if (typeof window !== "undefined" && typeof window.crypto?.randomUUID === "function") {
    return `${prefix}${window.crypto.randomUUID()}`;
  }
  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function maxRollsForGameCount(gameCount: number): number {
  return gameCount * 39;
}

function fieldTypesPerGame(): FieldTypeId[] {
  return SHEET_ROWS.filter((row): row is { kind: "field"; fieldType: FieldTypeId } => row.kind === "field")
    .map((row) => row.fieldType);
}

function loadStore(): LocalSoloStore {
  if (typeof window === "undefined") return {};
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as LocalSoloStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function saveStore(store: LocalSoloStore): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

function recomputeRun(run: RunDto): void {
  let totalScore = 0;
  for (const game of run.games) {
    const breakdown = computeGameBreakdown(game.fields, game.summary.extraYatzyBonus ?? 0);
    game.summary = breakdown;
    game.score = breakdown.gameTotal;
    totalScore += breakdown.gameTotal;
  }
  run.totalScore = totalScore;
  run.rollsRemaining = run.useStrategyRules
    ? Math.max(0, maxRollsForGameCount(run.gameCount) - run.totalRollsUsed)
    : null;
}

function getLastScoredFieldId(state: LocalSoloState): string | null {
  let maxSeq = -1;
  let lastFieldId: string | null = null;
  for (const [fieldId, sequence] of Object.entries(state.scoredSequenceByFieldId)) {
    if (sequence > maxSeq) {
      maxSeq = sequence;
      lastFieldId = fieldId;
    }
  }
  return lastFieldId;
}

function findField(state: LocalSoloState, fieldId: string): FieldDto | null {
  for (const game of state.run.games) {
    const field = game.fields.find((f) => f.id === fieldId);
    if (field) return field;
  }
  return null;
}

function saveState(state: LocalSoloState): RunDto {
  const store = loadStore();
  state.run.lastScoredFieldId = getLastScoredFieldId(state);
  store[state.run.id] = deepClone(state);
  saveStore(store);
  return deepClone(state.run);
}

function getState(runId: string): LocalSoloState {
  const store = loadStore();
  const state = store[runId];
  if (!state) {
    throw new Error("Lokaler Solo-Run nicht gefunden");
  }
  return deepClone(state);
}

function createEmptyGame(index: number): GameDto {
  const fields: FieldDto[] = fieldTypesPerGame().map((fieldType) => ({
    id: createId(`local-field-${index}-`),
    fieldType,
    score: null,
    rollsUsed: 0,
    rolls: [],
  }));
  const summary = computeGameBreakdown(fields, 0);
  return {
    id: createId(`local-game-${index}-`),
    index,
    score: summary.gameTotal,
    summary,
    fields,
  };
}

export function isLocalSoloRunId(runId: string): boolean {
  return runId.startsWith(LOCAL_RUN_PREFIX);
}

export function createLocalSoloRun(gameCount: number, useStrategyRules: boolean): RunDto {
  if (!Number.isInteger(gameCount) || gameCount < 1 || gameCount > 6) {
    throw new Error("gameCount must be between 1 and 6");
  }

  const runId = createId(LOCAL_RUN_PREFIX);
  const createdAt = nowIso();
  const games = Array.from({ length: gameCount }, (_, idx) => createEmptyGame(idx + 1));
  const run: RunDto = {
    id: runId,
    gameCount,
    useStrategyRules,
    totalScore: 0,
    totalRollsUsed: 0,
    extraYatzyCount: 0,
    rollsInPool: 0,
    rollsRemaining: useStrategyRules ? maxRollsForGameCount(gameCount) : null,
    status: "ACTIVE",
    createdAt,
    finishedAt: null,
    lastScoredFieldId: null,
    games,
  };

  const state: LocalSoloState = {
    run,
    nextScoredSequence: 1,
    scoredSequenceByFieldId: {},
  };
  return saveState(state);
}

export function getLocalSoloRun(runId: string): RunDto {
  const state = getState(runId);
  return deepClone(state.run);
}

export function completeLocalSoloField(
  runId: string,
  fieldId: string,
  score: number,
  rollsUsed: number,
  yatzyDieValue?: number,
): RunDto {
  const state = getState(runId);
  const run = state.run;
  if (run.status !== "ACTIVE") throw new Error("Run is not active");
  const field = findField(state, fieldId);
  if (!field) throw new Error("Field not found");

  if (field.fieldType === "KNIFFEL" && score === 50) {
    if (
      yatzyDieValue === undefined ||
      !Number.isInteger(yatzyDieValue) ||
      yatzyDieValue < 1 ||
      yatzyDieValue > 6
    ) {
      throw new Error("yatzyDieValue must be between 1 and 6 for Yatzy");
    }
  } else if (yatzyDieValue !== undefined) {
    throw new Error("yatzyDieValue is only allowed for Yatzy (50 points)");
  }

  if (run.useStrategyRules) {
    if (!Number.isInteger(rollsUsed) || rollsUsed < 1 || rollsUsed > 20) {
      throw new Error("rollsUsed must be between 1 and 20");
    }
    const currentPoolBeforeCorrection = field.score === null
      ? run.rollsInPool
      : (() => {
          const oldDelta = poolDeltaForComplete(field.rollsUsed, true);
          return run.rollsInPool + oldDelta.poolCost - oldDelta.spareToPool;
        })();
    const newDelta = poolDeltaForComplete(rollsUsed, true);
    if (newDelta.poolCost > currentPoolBeforeCorrection) {
      throw new Error("Not enough rolls in pool");
    }
    const oldDelta = field.score === null
      ? { spareToPool: 0, poolCost: 0 }
      : poolDeltaForComplete(field.rollsUsed, true);
    run.rollsInPool =
      run.rollsInPool + oldDelta.poolCost - oldDelta.spareToPool + newDelta.spareToPool - newDelta.poolCost;
  } else {
    rollsUsed = 1;
  }

  if (field.score !== null) {
    run.totalRollsUsed -= field.rollsUsed;
  } else {
    state.scoredSequenceByFieldId[field.id] = state.nextScoredSequence;
    state.nextScoredSequence += 1;
  }

  field.score = score;
  field.rollsUsed = rollsUsed;
  field.yatzyDieValue =
    field.fieldType === "KNIFFEL" && score === 50 ? yatzyDieValue ?? null : null;
  run.totalRollsUsed += rollsUsed;
  recomputeRun(run);
  return saveState(state);
}

export function clearLocalSoloField(runId: string, fieldId: string): RunDto {
  const state = getState(runId);
  const run = state.run;
  if (run.status !== "ACTIVE") throw new Error("Run is not active");
  const field = findField(state, fieldId);
  if (!field || field.score === null) throw new Error("Field not scored");

  const lastScoredFieldId = getLastScoredFieldId(state);
  if (!lastScoredFieldId || lastScoredFieldId !== fieldId) {
    throw new Error("Only the latest scored field can be cleared");
  }

  if (run.useStrategyRules) {
    const oldDelta = poolDeltaForComplete(field.rollsUsed, true);
    run.rollsInPool = run.rollsInPool + oldDelta.poolCost - oldDelta.spareToPool;
  }

  run.totalRollsUsed -= field.rollsUsed;
  field.score = null;
  field.rollsUsed = 0;
  field.yatzyDieValue = null;
  delete state.scoredSequenceByFieldId[field.id];

  recomputeRun(run);
  return saveState(state);
}

export function incrementLocalSoloExtraYatzy(runId: string): RunDto {
  const state = getState(runId);
  const run = state.run;
  if (run.status !== "ACTIVE") throw new Error("Run is not active");

  run.extraYatzyCount += 1;
  const gameIndex = gameIndexForExtraYatzyClick(run.extraYatzyCount, run.gameCount);
  const targetGame = run.games.find((g) => g.index === gameIndex);
  if (!targetGame) throw new Error("Game not found for extra yatzy");
  targetGame.summary.extraYatzyBonus += 100;
  recomputeRun(run);
  return saveState(state);
}

export function finishLocalSoloRun(runId: string): RunDto {
  const state = getState(runId);
  const run = state.run;
  const allScored = run.games.every((g) => g.fields.every((f) => f.score !== null));
  if (!allScored) throw new Error("Run is not complete");
  run.status = "FINISHED";
  run.finishedAt = nowIso();
  return saveState(state);
}

export function abandonLocalSoloRun(runId: string): RunDto {
  const state = getState(runId);
  const run = state.run;
  run.status = "FINISHED";
  run.finishedAt = nowIso();
  return saveState(state);
}

