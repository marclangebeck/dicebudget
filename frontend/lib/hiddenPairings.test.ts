import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canFilterPairingsByOwnPlayer,
  pairingExcludesOwnPlayer,
  pairingIncludesOwnPlayer,
} from "./hiddenPairings";
import { normalizePublicPlayerId } from "./playerIdentity";

const normalize = normalizePublicPlayerId;

describe("pairingIncludesOwnPlayer", () => {
  it("matches exact own id", () => {
    assert.equal(
      pairingIncludesOwnPlayer(
        { playerA: "aaa-1", playerB: "bbb-2" },
        "aaa-1",
        normalize,
      ),
      true,
    );
  });

  it("matches via shared alias", () => {
    const aliases = {
      [normalize("device-new")]: "Marc",
      [normalize("old-id")]: "Marc",
    };
    assert.equal(
      pairingIncludesOwnPlayer(
        { playerA: "old-id", playerB: "rival" },
        "device-new",
        normalize,
        aliases,
      ),
      true,
    );
  });

  it("excludes foreign pairings", () => {
    assert.equal(
      pairingExcludesOwnPlayer(
        { playerA: "x", playerB: "y" },
        "me",
        normalize,
        { [normalize("me")]: "Marc" },
      ),
      true,
    );
  });

  it("skips filter when own id is unknown in data", () => {
    const pairings = [{ playerA: "a", playerB: "b" }];
    assert.equal(
      canFilterPairingsByOwnPlayer(pairings, "brand-new-id", normalize, {}),
      false,
    );
  });
});
