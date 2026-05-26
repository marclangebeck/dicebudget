import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeRoundPoints } from "./leaguePoints.js";

describe("computeRoundPoints", () => {
  it("vergibt Sieger 1 Punkt und Differenzbonus, Verlierer 0", () => {
    const awards = computeRoundPoints([
      { name: "Anna", totalScore: 320, orderIndex: 1 },
      { name: "Bob", totalScore: 280, orderIndex: 2 },
    ]);

    assert.deepEqual(
      awards.find((a) => a.playerName === "Anna"),
      { playerName: "Anna", winPoints: 1, bonusPoints: 40 },
    );
    assert.deepEqual(
      awards.find((a) => a.playerName === "Bob"),
      { playerName: "Bob", winPoints: 0, bonusPoints: 0 },
    );
  });

  it("nutzt den Letztplatzierten bei drei Spielern für die Differenz", () => {
    const awards = computeRoundPoints([
      { name: "Anna", totalScore: 300, orderIndex: 1 },
      { name: "Bob", totalScore: 250, orderIndex: 2 },
      { name: "Clara", totalScore: 200, orderIndex: 3 },
    ]);

    assert.deepEqual(
      awards.find((a) => a.playerName === "Anna"),
      { playerName: "Anna", winPoints: 1, bonusPoints: 100 },
    );
    assert.deepEqual(
      awards.find((a) => a.playerName === "Bob"),
      { playerName: "Bob", winPoints: 0, bonusPoints: 0 },
    );
  });

  it("löst Punktgleichstand über orderIndex", () => {
    const awards = computeRoundPoints([
      { name: "Anna", totalScore: 300, orderIndex: 1 },
      { name: "Bob", totalScore: 300, orderIndex: 2 },
    ]);

    assert.deepEqual(
      awards.find((a) => a.playerName === "Anna"),
      { playerName: "Anna", winPoints: 1, bonusPoints: 0 },
    );
    assert.deepEqual(
      awards.find((a) => a.playerName === "Bob"),
      { playerName: "Bob", winPoints: 0, bonusPoints: 0 },
    );
  });

  it("gibt bei weniger als zwei Spielern nichts zurück", () => {
    assert.deepEqual(computeRoundPoints([{ name: "Anna", totalScore: 100, orderIndex: 1 }]), []);
  });
});
