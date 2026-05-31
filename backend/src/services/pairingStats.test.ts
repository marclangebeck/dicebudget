import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  emptyAccumulator,
  foldManualBaselines,
  normalizePairingKeys,
  pairingKey,
  parsePairingKey,
  sessionResetAction,
  type PairingAccumulator,
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

describe("foldManualBaselines", () => {
  it("erzeugt eine reine Baseline-Paarung, wenn keine App-Runde existiert", () => {
    const map = new Map<string, PairingAccumulator>();
    foldManualBaselines(map, [
      {
        pairingKey: "Marc::Nicole",
        extraWinsA: 46,
        extraWinsB: 58,
        extraBonusA: 0,
        extraBonusB: 1972,
      },
    ]);
    const acc = map.get("Marc::Nicole");
    assert.ok(acc);
    assert.equal(acc.playerAWins, 46);
    assert.equal(acc.playerBWins, 58);
    assert.equal(acc.playerABonusPoints, 0);
    assert.equal(acc.playerBBonusPoints, 1972);
    assert.equal(acc.playerAManualBonus, 0);
    assert.equal(acc.playerBManualBonus, 1972);
    assert.equal(acc.appRoundsPlayed, 0);
    assert.equal(acc.playerAAppWins, 0);
    assert.equal(acc.roundsPlayed, 104);
  });

  it("addiert manuelle Werte auf vorhandene App-Werte, ohne App-Werte zu verändern", () => {
    const map = new Map<string, PairingAccumulator>();
    const acc = emptyAccumulator("Marc::Nicole", "Marc", "Nicole");
    acc.roundsPlayed = 2;
    acc.appRoundsPlayed = 2;
    acc.playerAWins = 1;
    acc.playerAAppWins = 1;
    acc.playerBWins = 1;
    acc.playerBAppWins = 1;
    acc.playerABonusPoints = 10;
    acc.playerBBonusPoints = 5;
    map.set("Marc::Nicole", acc);

    foldManualBaselines(map, [
      {
        pairingKey: "Marc::Nicole",
        extraWinsA: 3,
        extraWinsB: 0,
        extraBonusA: 40,
        extraBonusB: 0,
      },
    ]);

    const result = map.get("Marc::Nicole")!;
    assert.equal(result.playerAWins, 4);
    assert.equal(result.playerAAppWins, 1);
    assert.equal(result.playerABonusPoints, 50);
    assert.equal(result.playerAManualBonus, 40);
    assert.equal(result.playerBBonusPoints, 5);
    assert.equal(result.playerBManualBonus, 0);
    assert.equal(result.appRoundsPlayed, 2);
  });
});
