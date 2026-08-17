import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatGroupPreview,
  normalizeTournamentConfig,
} from "./tournamentConfig.js";

describe("normalizeTournamentConfig", () => {
  it("füllt Liga-Defaults", () => {
    const config = normalizeTournamentConfig("league", {});
    assert.ok("rounds" in config);
    if ("rounds" in config) {
      assert.equal(config.rounds, 3);
    }
    assert.equal(config.useStrategyRules, true);
    assert.equal(config.gameCount, 1);
  });

  it("füllt Turnier-Defaults", () => {
    const config = normalizeTournamentConfig("turnier", {});
    assert.ok("groupSize" in config);
    if ("groupSize" in config) {
      assert.equal(config.groupSize, 4);
      assert.equal(config.qualifyPerGroup, 2);
      assert.equal(config.knockout, "single");
    }
  });

  it("lehnt ungültige Runden ab", () => {
    assert.throws(() => normalizeTournamentConfig("league", { rounds: 0 }));
  });
});

describe("formatGroupPreview", () => {
  it("teilt glatt", () => {
    assert.equal(formatGroupPreview(16, 4), "16 Spieler → 4 Gruppen à 4");
  });

  it("nennt Rest", () => {
    assert.equal(
      formatGroupPreview(17, 4),
      "17 Spieler → 4 Gruppen à 4, 1 Rest (Ausgleich später)",
    );
  });
});
