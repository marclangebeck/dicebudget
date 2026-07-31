import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatAppVersionLabel } from "./appVersion.js";

describe("formatAppVersionLabel", () => {
  it("formatiert Marketing + Build", () => {
    assert.equal(formatAppVersionLabel("2.0", "29"), "Version 2.0 (29)");
    assert.equal(formatAppVersionLabel("2.0", "web"), "Version 2.0 (web)");
  });
});
