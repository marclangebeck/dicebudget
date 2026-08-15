import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ruleEventFromDto } from "./ruleEventFeedback.js";

describe("ruleEventFromDto", () => {
  it("2× Alle Fünfe Duell ohne Gutschrift", () => {
    const overlay = ruleEventFromDto({
      type: "yatzy_streak_penalty",
      poolsLost: 4,
      victimPlayerId: "a",
      victimPlayerName: "A",
      victimCount: 1,
      poolsGained: 0,
    });
    assert.ok(overlay);
    assert.equal(overlay!.title, "2× Alle Fünfe!");
    assert.match(overlay!.subtitle, /halbiert/);
    assert.equal(overlay!.badge, "−4");
  });

  it("2× Alle Fünfe Multi mit Gutschrift", () => {
    const overlay = ruleEventFromDto({
      type: "yatzy_streak_penalty",
      poolsLost: 6,
      victimPlayerId: "a",
      victimPlayerName: "A",
      victimCount: 2,
      poolsGained: 6,
    });
    assert.ok(overlay);
    assert.match(overlay!.subtitle, /Mitspieler/);
    assert.match(overlay!.subtitle, /dir \+6/);
    assert.equal(overlay!.badge, "+6");
  });

  it("3× Alle Fünfe mit Gutschrift", () => {
    const overlay = ruleEventFromDto({
      type: "yatzy_triple_penalty",
      poolsLost: 9,
      victimPlayerId: "a",
      victimPlayerName: "A",
      victimCount: 1,
      poolsGained: 9,
    });
    assert.ok(overlay);
    assert.match(overlay!.subtitle, /gesamten Pool/);
    assert.match(overlay!.subtitle, /dir \+9/);
    assert.equal(overlay!.badge, "+9");
  });
});
