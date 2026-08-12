import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasAdminAccess,
  peekAdminApiKeyRaw,
  resolveAdminApiKeyForRequest,
  verifyAdminPin,
} from "./adminAccess.js";

describe("verifyAdminPin", () => {
  it("akzeptiert passenden Code", () => {
    assert.equal(verifyAdminPin("admin99", "admin99"), true);
  });

  it("lehnt falschen Code ab", () => {
    assert.equal(verifyAdminPin("x", "admin99"), false);
  });

  it("trimmt Eingabe", () => {
    assert.equal(verifyAdminPin("  admin99  ", "admin99"), true);
  });

  it("lehnt ab wenn kein Code konfiguriert", () => {
    assert.equal(verifyAdminPin("egal", ""), false);
  });
});

describe("resolveAdminApiKeyForRequest (ohne DOM)", () => {
  it("liefert ohne window keinen lokalen Key", () => {
    assert.equal(peekAdminApiKeyRaw(), "");
    assert.equal(resolveAdminApiKeyForRequest(), undefined);
    assert.equal(hasAdminAccess(), false);
  });
});
