import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PairingSummaryDto } from "./pairingTypes.js";
import {
  buildBaselineWrites,
  isMergedPairingKey,
  mergePairingSummaries,
} from "./pairingMerge.js";

function summary(
  partial: Partial<PairingSummaryDto> & Pick<PairingSummaryDto, "key" | "playerA" | "playerB">,
): PairingSummaryDto {
  return {
    roundsPlayed: 0,
    appRoundsPlayed: 0,
    playerAWins: 0,
    playerBWins: 0,
    playerAAppWins: 0,
    playerBAppWins: 0,
    ties: 0,
    playerABonusPoints: 0,
    playerBBonusPoints: 0,
    playerAManualBonus: 0,
    playerBManualBonus: 0,
    playerATotalScore: 0,
    playerBTotalScore: 0,
    lastPlayedAt: null,
    ...partial,
  };
}

describe("isMergedPairingKey", () => {
  it("erkennt zusammengeführte Keys", () => {
    assert.equal(isMergedPairingKey("m:a|b"), true);
    assert.equal(isMergedPairingKey("Marc::Nicole"), false);
  });
});

describe("mergePairingSummaries", () => {
  it("fasst Paarungen mit gleichem Alias zusammen", () => {
    const merged = mergePairingSummaries(
      [
        summary({
          key: "k1",
          playerA: "host",
          playerB: "pid-a",
          roundsPlayed: 2,
        }),
        summary({
          key: "k2",
          playerA: "host",
          playerB: "pid-b",
          roundsPlayed: 3,
        }),
      ],
      { "pid-a": "Anna", "pid-b": "Anna" },
      "host",
    );

    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.roundsPlayed, 5);
    assert.equal(merged[0]?.sourceKeys.sort().join(","), "k1,k2");
    assert.equal(isMergedPairingKey(merged[0]?.key ?? ""), true);
  });

  it("lässt verschiedene Aliase getrennt", () => {
    const merged = mergePairingSummaries(
      [
        summary({ key: "a", playerA: "p1", playerB: "p2", roundsPlayed: 1 }),
        summary({ key: "b", playerA: "p1", playerB: "p3", roundsPlayed: 1 }),
      ],
      {},
      "p1",
    );
    assert.equal(merged.length, 2);
  });
});

describe("buildBaselineWrites", () => {
  it("schreibt manuelle Anteile auf Repräsentanten-Key", () => {
    const src = summary({
      key: "src-key",
      playerA: "opponent",
      playerB: "self",
      playerAWins: 2,
      playerBWins: 1,
      playerAAppWins: 2,
      playerBAppWins: 1,
      playerAManualBonus: 0,
      playerBManualBonus: 0,
      playerABonusPoints: 10,
      playerBBonusPoints: 4,
    });
    const mergedList = mergePairingSummaries([src], {}, "self");
    const merged = mergedList[0];
    assert.ok(merged);

    const writes = buildBaselineWrites(
      merged,
      [src],
      {},
      "self",
      { totalWinsA: 5, totalWinsB: 2, netDiff: 12 },
    );

    assert.equal(writes.length, 1);
    assert.equal(writes[0]?.key, "src-key");
    assert.equal(writes[0]?.extraWinsA, 3);
    assert.equal(writes[0]?.extraWinsB, 1);
  });
});
