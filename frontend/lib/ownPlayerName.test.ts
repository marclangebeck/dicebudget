import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  hasCompletedOwnNameSetup,
  persistOwnPlayerName,
  loadOwnDisplayName,
  ownNameAliasOverlay,
} from "./ownPlayerName.js";

function installWindow(): Record<string, string> {
  const storage: Record<string, string> = {};
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    writable: true,
    value: {
      localStorage: {
        getItem: (key: string) => storage[key] ?? null,
        setItem: (key: string, value: string) => {
          storage[key] = value;
        },
        removeItem: (key: string) => {
          delete storage[key];
        },
      },
      dispatchEvent: () => true,
      addEventListener: () => {},
      removeEventListener: () => {},
      crypto: { randomUUID: () => "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
    },
  });
  return storage;
}

describe("ownPlayerName", () => {
  beforeEach(() => installWindow());
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("merkt Setup und Overlay ohne lokale Rivalen-Aliase", () => {
    persistOwnPlayerName("Mara", "token-1");
    assert.equal(hasCompletedOwnNameSetup(), true);
    assert.equal(loadOwnDisplayName(), "Mara");
    assert.equal(
      ownNameAliasOverlay()["aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"],
      "Mara",
    );
    assert.equal(window.localStorage.getItem("dicebudget.playerAliases.v1"), null);
  });
});
