import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { determinePoolEndgameImprover } from "./sessionService.js";

describe("determinePoolEndgameImprover", () => {
  it("wählt den Spieler mit dem eindeutig größten Pool", () => {
    const improver = determinePoolEndgameImprover([
      { id: "a", rollsInPool: 5 },
      { id: "b", rollsInPool: 8 },
    ]);
    assert.equal(improver?.id, "b");
  });

  it("gibt bei Gleichstand an der Spitze niemanden zurück", () => {
    const improver = determinePoolEndgameImprover([
      { id: "a", rollsInPool: 7 },
      { id: "b", rollsInPool: 7 },
    ]);
    assert.equal(improver, null);
  });

  it("ignoriert Gleichstände unterhalb der Spitze", () => {
    const improver = determinePoolEndgameImprover([
      { id: "a", rollsInPool: 9 },
      { id: "b", rollsInPool: 4 },
      { id: "c", rollsInPool: 4 },
    ]);
    assert.equal(improver?.id, "a");
  });

  it("gibt bei weniger als zwei Spielern null zurück", () => {
    assert.equal(determinePoolEndgameImprover([{ id: "a", rollsInPool: 3 }]), null);
  });
});
