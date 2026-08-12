import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { rivalAvatarTargetSize } from "./rivalAvatarStore.js";

describe("rivalAvatarTargetSize", () => {
  it("lässt kleine Bilder unverändert", () => {
    assert.deepEqual(rivalAvatarTargetSize(120, 80, 256), { width: 120, height: 80 });
  });

  it("skaliert die längere Kante auf maxSide", () => {
    assert.deepEqual(rivalAvatarTargetSize(800, 400, 256), { width: 256, height: 128 });
  });

  it("skaliert Hochformat", () => {
    assert.deepEqual(rivalAvatarTargetSize(300, 900, 256), { width: 85, height: 256 });
  });
});
