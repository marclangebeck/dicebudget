import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  abandonLocalSoloRun,
  clearLocalSoloField,
  completeLocalSoloField,
  createLocalSoloRun,
  getLocalSoloRun,
  isLocalSoloRunId,
} from "./localSoloRun.js";

const STORAGE_KEY = "dicebudget.localSoloRuns.v1";

function installBrowserMocks(): void {
  const storage: Record<string, string> = {};
  let uuidCounter = 0;

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
        clear: () => {
          for (const key of Object.keys(storage)) delete storage[key];
        },
        get length() {
          return Object.keys(storage).length;
        },
        key: () => null,
      },
      crypto: {
        randomUUID: () => {
          uuidCounter += 1;
          return `00000000-0000-4000-8000-${String(uuidCounter).padStart(12, "0")}`;
        },
      },
    },
  });
}

function clearBrowserMocks(): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: undefined,
  });
}

describe("localSoloRun", () => {
  beforeEach(() => {
    installBrowserMocks();
  });

  afterEach(() => {
    clearBrowserMocks();
  });

  it("isLocalSoloRunId erkennt lokale Runs", () => {
    assert.equal(isLocalSoloRunId("local-run-abc"), true);
    assert.equal(isLocalSoloRunId("server-run"), false);
  });

  it("createLocalSoloRun validiert gameCount", () => {
    assert.throws(() => createLocalSoloRun(0, false), /gameCount must be between 1 and 6/);
    assert.throws(() => createLocalSoloRun(7, false), /gameCount must be between 1 and 6/);
  });

  it("speichert und lädt Run in localStorage", () => {
    const run = createLocalSoloRun(1, false);
    assert.ok(isLocalSoloRunId(run.id));
    assert.equal(run.status, "ACTIVE");
    assert.equal(run.games.length, 1);

    const loaded = getLocalSoloRun(run.id);
    assert.equal(loaded.id, run.id);
    assert.equal(window.localStorage.getItem(STORAGE_KEY)?.includes(run.id), true);
  });

  it("completeLocalSoloField trägt Feld ein (Klassisch)", () => {
    const run = createLocalSoloRun(1, false);
    const fieldId = run.games[0]?.fields[0]?.id;
    assert.ok(fieldId);

    const updated = completeLocalSoloField(run.id, fieldId, 12, 1);
    const field = updated.games[0]?.fields.find((f) => f.id === fieldId);
    assert.equal(field?.score, 12);
    assert.equal(updated.totalRollsUsed, 1);
  });

  it("clearLocalSoloField nur für letztes Feld", () => {
    const run = createLocalSoloRun(1, false);
    const fields = run.games[0]?.fields ?? [];
    const firstId = fields[0]?.id;
    const secondId = fields[1]?.id;
    assert.ok(firstId && secondId);

    completeLocalSoloField(run.id, firstId, 3, 1);
    completeLocalSoloField(run.id, secondId, 6, 1);

    assert.throws(
      () => clearLocalSoloField(run.id, firstId),
      /Only the latest scored field can be cleared/,
    );

    const cleared = clearLocalSoloField(run.id, secondId);
    assert.equal(cleared.games[0]?.fields.find((f) => f.id === secondId)?.score, null);
  });

  it("abandonLocalSoloRun beendet Run", () => {
    const run = createLocalSoloRun(1, false);
    const finished = abandonLocalSoloRun(run.id);
    assert.equal(finished.status, "FINISHED");
    assert.ok(finished.finishedAt);
  });
});
