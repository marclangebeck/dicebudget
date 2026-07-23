import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  createRival,
  getRivalDisplayMap,
  linkPlayerToRival,
  loadDisplayNames,
  loadRivalProfiles,
  mergeRivals,
  upsertRivalName,
} from "./rivalProfiles.js";

function installBrowserMocks(): void {
  const storage: Record<string, string> = {};
  let idSeq = 0;
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
        randomUUID: () => `rival-test-id-${++idSeq}`,
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

  it("legt manuelle Rivalen an und merged sie", () => {
    createRival("Nicole");
    createRival("Nic");
    const before = loadRivalProfiles();
    assert.equal(before.length, 2);
    const nicole = before.find((profile) => profile.name === "Nicole");
    const nic = before.find((profile) => profile.name === "Nic");
    assert.ok(nicole && nic);
    mergeRivals(nicole!.id, nic!.id);
    const after = loadRivalProfiles();
    assert.equal(after.length, 1);
    assert.equal(after[0]?.name, "Nicole");
  });

  it("verknüpft playerId mit manuell angelegtem Rivalen", () => {
    const created = createRival("Nicole");
    assert.ok(created);
    linkPlayerToRival("abc-999", created!.id);
    assert.equal(getRivalDisplayMap()["abc-999"], "Nicole");
    const profile = loadRivalProfiles().find((row) => row.name === "Nicole");
    assert.ok(profile?.playerIds.includes("abc-999"));
  });
});
