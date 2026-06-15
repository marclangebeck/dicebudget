import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { verifyLabsPin } from "./labsAccess.js";

describe("verifyLabsPin", () => {
  it("akzeptiert passenden Code", () => {
    assert.equal(verifyLabsPin("geheim42", "geheim42"), true);
  });

  it("lehnt falschen Code ab", () => {
    assert.equal(verifyLabsPin("falsch", "geheim42"), false);
  });

  it("trimmt Eingabe", () => {
    assert.equal(verifyLabsPin("  geheim42  ", "geheim42"), true);
  });

  it("lehnt ab wenn kein Code konfiguriert", () => {
    assert.equal(verifyLabsPin("egal", ""), false);
  });
});
