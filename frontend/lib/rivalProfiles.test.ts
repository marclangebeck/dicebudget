import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  getRivalDisplayMap,
  loadDisplayNames,
  upsertRivalName,
} from "./rivalProfiles.js";

function installBrowserMocks(): void {
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
      crypto: {
        randomUUID: () => "rival-test-id",
      },
    },
  });
}

describe("rivalProfiles", () => {
  beforeEach(() => {
    installBrowserMocks();
    window.localStorage.removeItem("dicebudget.rivalProfiles.v1");
    window.localStorage.removeItem("dicebudget.rivalProfiles.migratedFromAliases.v1");
    window.localStorage.removeItem("dicebudget.playerAliases.v1");
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("legt Rivalen-Namen an und liest Display-Map", () => {
    upsertRivalName("abc-123", "Nicole");
    const map = getRivalDisplayMap();
    assert.equal(map["abc-123"], "Nicole");
    assert.equal(loadDisplayNames()["abc-123"], "Nicole");
  });

  it("migriert bestehende Aliase", () => {
    window.localStorage.setItem(
      "dicebudget.playerAliases.v1",
      JSON.stringify({ "pid:xyz": "Marc" }),
    );
    const map = loadDisplayNames();
    assert.equal(map.xyz, "Marc");
  });
});
