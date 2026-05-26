import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolvePlayerName } from "./playerNames.js";

describe("resolvePlayerName", () => {
  it("gibt unbekannte Namen unverändert zurück", () => {
    const map = new Map([["Marc", "Marc Langebeck"]]);
    assert.equal(resolvePlayerName("Anna", map), "Anna");
    assert.equal(resolvePlayerName("Marc Langebeck", map), "Marc Langebeck");
  });

  it("löst Aliase auf", () => {
    const map = new Map([["Marc", "Marc Langebeck"]]);
    assert.equal(resolvePlayerName("Marc", map), "Marc Langebeck");
  });
});
