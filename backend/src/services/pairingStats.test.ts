import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { pairingKey, parsePairingKey } from "./pairingStats.js";

describe("pairingKey", () => {
  it("sortiert Namen stabil", () => {
    assert.equal(pairingKey("Nicole Langebeck", "Marc"), "Marc::Nicole Langebeck");
    assert.equal(pairingKey("Marc", "Nicole Langebeck"), "Marc::Nicole Langebeck");
  });
});

describe("parsePairingKey", () => {
  it("parst gültige Schlüssel", () => {
    assert.deepEqual(parsePairingKey("Marc::Nicole Langebeck"), ["Marc", "Nicole Langebeck"]);
  });
});
