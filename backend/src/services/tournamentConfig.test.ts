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
    assert.equal(config.houseRules.houseRulesBurn, true);
    assert.equal(config.houseRules.houseRulesYatzyStreakCredit, false);
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

  it("nimmt Hausregeln entgegen", () => {
    const config = normalizeTournamentConfig("league", {
      houseRules: {
        houseRulesBurn: false,
        houseRulesYatzyStreakCredit: true,
      },
    });
    assert.equal(config.houseRules.houseRulesBurn, false);
    assert.equal(config.houseRules.houseRulesYatzyStreak, true);
    assert.equal(config.houseRules.houseRulesYatzyStreakCredit, true);
  });

  it("stellt Gutschrift aus wenn die Elternregel aus ist", () => {
    const config = normalizeTournamentConfig("league", {
      houseRules: {
        houseRulesYatzyStreak: false,
        houseRulesYatzyStreakCredit: true,
        houseRulesYatzyTriple: false,
        houseRulesYatzyTripleCredit: true,
      },
    });
    assert.equal(config.houseRules.houseRulesYatzyStreakCredit, false);
    assert.equal(config.houseRules.houseRulesYatzyTripleCredit, false);
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
