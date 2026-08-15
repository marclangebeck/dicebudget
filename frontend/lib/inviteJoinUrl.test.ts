import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildInviteJoinUrl, pathFromInviteDeepLink } from "./inviteJoinUrl.js";

describe("buildInviteJoinUrl", () => {
  it("baut HTTPS-Join-URL mit normalisiertem Code", () => {
    assert.equal(
      buildInviteJoinUrl("ab cd-12", "https://dicebudget.bottle-trade.de"),
      "https://dicebudget.bottle-trade.de/multi/join?code=ABCD12",
    );
  });
});

describe("pathFromInviteDeepLink", () => {
  it("extrahiert Pfad aus Universal Link", () => {
    assert.equal(
      pathFromInviteDeepLink("https://dicebudget.bottle-trade.de/multi/join?code=ABCD2345"),
      "/multi/join?code=ABCD2345",
    );
  });

  it("lehnt fremde Pfade ab", () => {
    assert.equal(pathFromInviteDeepLink("https://dicebudget.bottle-trade.de/app"), null);
  });

  it("lehnt zu kurze Codes ab", () => {
    assert.equal(
      pathFromInviteDeepLink("https://dicebudget.bottle-trade.de/multi/join?code=AB"),
      null,
    );
  });

  it("akzeptiert relativen Join-Pfad", () => {
    assert.equal(pathFromInviteDeepLink("/multi/join?code=ABCD2345"), "/multi/join?code=ABCD2345");
  });
});
