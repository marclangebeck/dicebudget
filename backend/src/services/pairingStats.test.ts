import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizePairingKeys,
  pairingKey,
  parsePairingKey,
  sessionResetAction,
} from "./pairingStats.js";

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

describe("normalizePairingKeys", () => {
  it("normalisiert auf kanonische, sortierte Keys", () => {
    const set = normalizePairingKeys(["Nicole::Marc", "Marc::Nicole"]);
    assert.deepEqual([...set], ["Marc::Nicole"]);
  });

  it("ignoriert ungültige Keys", () => {
    const set = normalizePairingKeys(["", "kein-key", "A::B"]);
    assert.deepEqual([...set], ["A::B"]);
  });
});

describe("sessionResetAction", () => {
  const targets = normalizePairingKeys(["Marc::Nicole"]);

  it("löscht exakte 2-Spieler-Paarung (Reihenfolge egal)", () => {
    assert.equal(sessionResetAction(["Nicole", "Marc"], targets), "delete");
  });

  it("ignoriert nicht betroffene 2-Spieler-Paarung", () => {
    assert.equal(sessionResetAction(["Marc", "Tom"], targets), "ignore");
  });

  it("schützt Mehr-Spieler-Sessions, die das Paar enthalten", () => {
    assert.equal(sessionResetAction(["Marc", "Nicole", "Tom"], targets), "skip-multi");
  });

  it("ignoriert Mehr-Spieler-Sessions ohne das Paar", () => {
    assert.equal(sessionResetAction(["Marc", "Tom", "Ann"], targets), "ignore");
  });
});
