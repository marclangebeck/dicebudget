import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fieldCountForGameCount } from "../config.js";
import { createRun, getRunSummary } from "./createRun.js";

describe("createRun", () => {
  it("legt Run mit korrekter Feldanzahl an (createMany pro Spiel)", async () => {
    const gameCount = 3;
    const { runId } = await createRun(gameCount, true);
    const summary = await getRunSummary(runId);

    assert.ok(summary);
    assert.equal(summary.gameCount, gameCount);
    assert.equal(summary.games, gameCount);
    assert.equal(summary.fields, fieldCountForGameCount(gameCount));
    assert.equal(summary.expectedFields, fieldCountForGameCount(gameCount));
    assert.equal(summary.fieldsPerGame, 13);
  });
});
