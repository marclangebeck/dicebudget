import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { playerLabel } from "./playerIdentity.js";

describe("playerLabel", () => {
  it("bevorzugt Anzeigenamen vor „Du“", () => {
    assert.equal(
      playerLabel("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", {
        "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee": "Mara",
      }),
      "Mara",
    );
  });

  it("zeigt „Du“ ohne Alias", () => {
    assert.equal(
      playerLabel(
        "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee",
        {},
      ),
      "Du",
    );
  });

  it("fällt auf Kurz-ID zurück", () => {
    assert.equal(
      playerLabel("aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", "other-id", {}),
      "Unbekannt (AAAAAAAA)",
    );
  });
});
