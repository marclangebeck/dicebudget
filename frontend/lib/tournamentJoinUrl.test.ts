import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildTournamentJoinUrl,
  pathFromAnyJoinDeepLink,
  pathFromTournamentJoinDeepLink,
} from "./tournamentJoinUrl.js";

describe("buildTournamentJoinUrl", () => {
  it("baut HTTPS-Event-Join-URL", () => {
    assert.equal(
      buildTournamentJoinUrl("ab cd-12", "https://dicebudget.bottle-trade.de"),
      "https://dicebudget.bottle-trade.de/tournament/join?code=ABCD12",
    );
  });
});

describe("pathFromTournamentJoinDeepLink", () => {
  it("extrahiert Event-Pfad aus Universal Link", () => {
    assert.equal(
      pathFromTournamentJoinDeepLink(
        "https://dicebudget.bottle-trade.de/tournament/join?code=ABCD2345",
      ),
      "/tournament/join?code=ABCD2345",
    );
  });

  it("lehnt Multi-Join ab", () => {
    assert.equal(
      pathFromTournamentJoinDeepLink(
        "https://dicebudget.bottle-trade.de/multi/join?code=ABCD2345",
      ),
      null,
    );
  });

  it("akzeptiert relativen Pfad", () => {
    assert.equal(
      pathFromTournamentJoinDeepLink("/tournament/join?code=ABCD2345"),
      "/tournament/join?code=ABCD2345",
    );
  });
});

describe("pathFromAnyJoinDeepLink", () => {
  it("erkennt Event vor Multi", () => {
    assert.equal(
      pathFromAnyJoinDeepLink(
        "https://dicebudget.bottle-trade.de/tournament/join?code=ABCD2345",
      ),
      "/tournament/join?code=ABCD2345",
    );
    assert.equal(
      pathFromAnyJoinDeepLink(
        "https://dicebudget.bottle-trade.de/multi/join?code=ABCD2345",
      ),
      "/multi/join?code=ABCD2345",
    );
  });
});
