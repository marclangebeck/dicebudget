import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runNeedsScoredSequenceBackfill } from "./scoredSequence.js";

describe("runNeedsScoredSequenceBackfill", () => {
  it("erkennt fehlende scoredSequence bei bewerteten Feldern", () => {
    assert.equal(
      runNeedsScoredSequenceBackfill([
        {
          fields: [
            { id: "f1", score: 10, scoredSequence: 1 },
            { id: "f2", score: 5, scoredSequence: null },
          ],
        },
      ]),
      true,
    );
  });

  it("ist false wenn alle bewerteten Felder eine Sequenz haben", () => {
    assert.equal(
      runNeedsScoredSequenceBackfill([
        {
          fields: [
            { id: "f1", score: 10, scoredSequence: 1 },
            { id: "f2", score: null, scoredSequence: null },
          ],
        },
      ]),
      false,
    );
  });
});
