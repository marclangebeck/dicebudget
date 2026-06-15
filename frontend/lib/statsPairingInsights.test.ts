import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import {
  duelWinShare,
  pickFeaturedPairingKey,
  sortPairings,
} from "@/lib/statsPairingInsights";

function pairing(partial: Partial<PairingSummaryDto> & Pick<PairingSummaryDto, "key">): PairingSummaryDto {
  return {
    playerA: "a",
    playerB: "b",
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

describe("statsPairingInsights", () => {
  it("sorts by closest margin", () => {
    const list = [
      pairing({ key: "wide", playerAWins: 5, playerBWins: 1 }),
      pairing({ key: "tight", playerAWins: 3, playerBWins: 2 }),
    ];
    const sorted = sortPairings(list, "closest");
    assert.equal(sorted[0]?.key, "tight");
  });

  it("picks featured by most rounds", () => {
    const list = [
      pairing({ key: "few", roundsPlayed: 2 }),
      pairing({ key: "many", roundsPlayed: 8 }),
    ];
    assert.equal(pickFeaturedPairingKey(list), "many");
  });

  it("computes duel win share", () => {
    assert.equal(duelWinShare(pairing({ key: "x", playerAWins: 3, playerBWins: 1 })), 75);
    assert.equal(duelWinShare(pairing({ key: "y", playerAWins: 0, playerBWins: 0 })), 50);
  });
});
