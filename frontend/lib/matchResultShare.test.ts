import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildPairingShareText, recentPairingForm, shareAvatarInitials } from "./matchResultShare.js";

describe("recentPairingForm", () => {
  it("nimmt die neuesten Runden (API newest-first) und kehrt für Form um", () => {
    const rounds = [
      { winner: "A" as const },
      { winner: "B" as const },
      { winner: "tie" as const },
      { winner: "A" as const },
      { winner: "B" as const },
      { winner: "A" as const },
    ];
    assert.deepEqual(recentPairingForm(rounds, 5), ["B", "A", "tie", "B", "A"]);
  });

  it("liefert leeres Array ohne Runden", () => {
    assert.deepEqual(recentPairingForm([], 5), []);
  });
});

describe("shareAvatarInitials", () => {
  it("bildet Initialen aus Vor- und Nachname", () => {
    assert.equal(shareAvatarInitials("Alex Sam"), "AS");
  });

  it("nimmt zwei Buchstaben bei einem Wort", () => {
    assert.equal(shareAvatarInitials("Alex"), "AL");
  });
});

describe("buildPairingShareText", () => {
  it("enthält Bilanz, Lead und optional Form/Diff", () => {
    const text = buildPairingShareText({
      playerAName: "Alex",
      playerBName: "Sam",
      playerAWins: 3,
      playerBWins: 1,
      ties: 1,
      roundsPlayed: 5,
      netDiff: 12,
      form: ["A", "B", "A"],
    });
    assert.match(text, /Alex vs\. Sam/);
    assert.match(text, /3:1/);
    assert.match(text, /Alex führt \(\+2\)/);
    assert.match(text, /\+12/);
    assert.match(text, /Form: A-B-A/);
  });
});
