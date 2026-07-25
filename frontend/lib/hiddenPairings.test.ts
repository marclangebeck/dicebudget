import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canFilterPairingsByOwnPlayer,
  keysToHideForPairing,
  pairingExcludesOwnPlayer,
  pairingIncludesOwnIds,
  pairingIncludesOwnPlayer,
  pairingIsHidden,
} from "./hiddenPairings";
import { normalizePublicPlayerId } from "./playerIdentity";
import { resolveOwnPlayerIds } from "./selfIdentity";

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

  it("matches via ownIds set from self profile", () => {
    const ownIds = new Set([normalize("marc-old"), normalize("phone")]);
    assert.equal(
      pairingIncludesOwnIds(
        { playerA: "marc-old", playerB: "nicole" },
        ownIds,
        normalize,
      ),
      true,
    );
    assert.equal(
      pairingIncludesOwnIds(
        { playerA: "malte", playerB: "nicole" },
        ownIds,
        normalize,
      ),
      false,
    );
  });

  it("hides via merged or source key", () => {
    const pairing = { key: "m:a|b", sourceKeys: ["a::b", "c::d"] };
    const hidden = new Set(keysToHideForPairing(pairing));
    assert.equal(pairingIsHidden(pairing, hidden), true);
    assert.equal(pairingIsHidden({ key: "other", sourceKeys: [] }, hidden), false);
    assert.equal(pairingIsHidden({ key: "x", sourceKeys: ["a::b"] }, hidden), true);
  });
});

describe("resolveOwnPlayerIds", () => {
  it("includes linked ids from self rival profile", () => {
    const ids = resolveOwnPlayerIds(
      "phone-id",
      {},
      [
        {
          id: "self-prof",
          name: "Marc",
          playerIds: ["marc-a", "marc-b"],
        },
      ],
      "self-prof",
    );
    assert.ok(ids.has(normalize("phone-id")));
    assert.ok(ids.has(normalize("marc-a")));
    assert.ok(ids.has(normalize("marc-b")));
  });
});
