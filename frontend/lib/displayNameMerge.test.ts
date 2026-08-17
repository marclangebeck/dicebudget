import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { overlayDisplayNames } from "./displayNameMerge.js";

function installWindow(storage: Record<string, string> = {}): void {
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
}

describe("overlayDisplayNames", () => {
  beforeEach(() => installWindow());
  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("legt Server-Namen über lokale Aliase", () => {
    const merged = overlayDisplayNames(
      { "pid-a": "Lokal" },
      { "pid-a": "Server", "pid-b": "Ben" },
    );
    assert.equal(merged["pid-a"], "Server");
    assert.equal(merged["pid-b"], "Ben");
  });

  it("lässt den eigenen Gerätenamen zuletzt gewinnen", () => {
    window.localStorage.setItem("dicebudget.playerId", "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    window.localStorage.setItem("dicebudget.ownDisplayName.v1", "Mara");
    const merged = overlayDisplayNames(
      { "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee": "Lokal" },
      { "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee": "Server" },
    );
    assert.equal(merged["aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee"], "Mara");
  });
});
