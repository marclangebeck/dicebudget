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
  it("schreibt absolute Ziel-Siege auf Repräsentanten-Key", () => {
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
    assert.equal(writes[0]?.isAbsolute, true);
    assert.equal(writes[0]?.extraWinsA, 5);
    assert.equal(writes[0]?.extraWinsB, 2);
    assert.equal(writes[0]?.extraBonusA, 12);
    assert.equal(writes[0]?.extraBonusB, 0);
  });

  it("Multi-Key: Absolute Diff bleibt 237 trotz zweitem App-Key", () => {
    const k1 = summary({
      key: "aaa::host",
      playerA: "aaa",
      playerB: "host",
      playerAWins: 2,
      playerBWins: 1,
      playerAAppWins: 2,
      playerBAppWins: 1,
      playerABonusPoints: 100,
      playerBBonusPoints: 50,
    });
    const k2 = summary({
      key: "bbb::host",
      playerA: "bbb",
      playerB: "host",
      playerAWins: 3,
      playerBWins: 2,
      playerAAppWins: 3,
      playerBAppWins: 2,
      playerABonusPoints: 400,
      playerBBonusPoints: 100,
    });
    const aliases = { aaa: "Nicole", bbb: "Nicole" };
    const merged = mergePairingSummaries([k1, k2], aliases, "host")[0];
    assert.ok(merged);

    const writes = buildBaselineWrites(merged, [k1, k2], aliases, "host", {
      totalWinsA: 20,
      totalWinsB: 10,
      netDiff: 237,
    });
    const withBonus = writes.find((w) => w.extraBonusA + w.extraBonusB > 0);
    assert.ok(withBonus);
    assert.equal(withBonus.extraBonusA + withBonus.extraBonusB, 237);

    const folded = [
      summary({
        key: "aaa::host",
        playerA: "aaa",
        playerB: "host",
        playerAAppWins: 2,
        playerBAppWins: 1,
        playerAWins: 20,
        playerBWins: 10,
        playerABonusPoints: 237,
        playerBBonusPoints: 0,
        playerAManualBonus: 237,
        playerBManualBonus: 0,
      }),
      summary({
        key: "bbb::host",
        playerA: "bbb",
        playerB: "host",
        playerAAppWins: 3,
        playerBAppWins: 2,
        playerAWins: 3,
        playerBWins: 2,
        playerABonusPoints: 400,
        playerBBonusPoints: 100,
      }),
    ];
    const again = mergePairingSummaries(folded, aliases, "host")[0];
    assert.ok(again);
    assert.equal(again.playerABonusPoints - again.playerBBonusPoints, 237);
  });

  it("Multi-Key: Absolute auf repKey; Merge-Max hält Ziel trotz zweitem App-Key", () => {
    const k1 = summary({
      key: "aaa::host",
      playerA: "aaa",
      playerB: "host",
      playerAWins: 2,
      playerBWins: 1,
      playerAAppWins: 2,
      playerBAppWins: 1,
    });
    const k2 = summary({
      key: "bbb::host",
      playerA: "bbb",
      playerB: "host",
      playerAWins: 3,
      playerBWins: 2,
      playerAAppWins: 3,
      playerBAppWins: 2,
    });
    const aliases = { aaa: "Nicole", bbb: "Nicole" };
    const merged = mergePairingSummaries([k1, k2], aliases, "host")[0];
    assert.ok(merged);

    const writes = buildBaselineWrites(merged, [k1, k2], aliases, "host", {
      totalWinsA: 20,
      totalWinsB: 10,
      netDiff: 0,
    });
    assert.equal(writes.length, 2);
    assert.ok(writes.every((w) => w.isAbsolute));
    const withWins = writes.filter((w) => w.extraWinsA + w.extraWinsB > 0);
    assert.equal(withWins.length, 1);
    assert.equal(withWins[0]!.extraWinsA + withWins[0]!.extraWinsB, 30);

    const folded = [
      summary({
        key: "aaa::host",
        playerA: "aaa",
        playerB: "host",
        playerAAppWins: 2,
        playerBAppWins: 1,
        playerAWins: 20,
        playerBWins: 10,
      }),
      summary({
        key: "bbb::host",
        playerA: "bbb",
        playerB: "host",
        playerAAppWins: 3,
        playerBAppWins: 2,
        playerAWins: 3,
        playerBWins: 2,
      }),
    ];
    const again = mergePairingSummaries(folded, aliases, "host")[0];
    assert.ok(again);
    assert.equal(again.playerAWins, 20);
    assert.equal(again.playerBWins, 10);

    const raw = mergePairingSummaries(folded, {}, "host");
    assert.equal(raw.length, 2);
    const absoluteRow = raw.find((r) => r.playerAWins === 20 || r.playerBWins === 20);
    assert.ok(absoluteRow);
  });
});
