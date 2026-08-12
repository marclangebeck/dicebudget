import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatAppVersionLabel, pickVersionParts } from "./appVersion.js";

describe("formatAppVersionLabel", () => {
  it("formatiert Marketing + Build", () => {
    assert.equal(formatAppVersionLabel("2.0", "29"), "Version 2.0 (29)");
    assert.equal(formatAppVersionLabel("2.0", "web"), "Version 2.0 (web)");
  });
});

describe("pickVersionParts", () => {
  it("nimmt Native-Werte wenn gesetzt", () => {
    assert.deepEqual(
      pickVersionParts({
        native: { version: "2.0", build: "50" },
        marketingFallback: "2.0",
        buildFallback: "web",
      }),
      { marketing: "2.0", build: "50" },
    );
  });

  it("fällt auf Env-Fallback zurück ohne Native", () => {
    assert.deepEqual(
      pickVersionParts({
        native: null,
        marketingFallback: "2.0",
        buildFallback: "web",
      }),
      { marketing: "2.0", build: "web" },
    );
  });

  it("ignoriert leere Native-Strings", () => {
    assert.deepEqual(
      pickVersionParts({
        native: { version: "  ", build: "" },
        marketingFallback: "2.0",
        buildFallback: "46",
      }),
      { marketing: "2.0", build: "46" },
    );
  });
});
