import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  FEATURE_REGISTRY,
  isFeatureEnabled,
  setLabsFeaturePref,
} from "./featureFlags.js";

const TEST_FEATURE_ID = "__testLabsFeature";

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
    },
  });
}

describe("isFeatureEnabled", () => {
  const originalRegistry = { ...FEATURE_REGISTRY };

  beforeEach(() => {
    installBrowserMocks();
    (FEATURE_REGISTRY as Record<string, unknown>)[TEST_FEATURE_ID] = {
      id: TEST_FEATURE_ID,
      title: "Test",
      description: "Test",
      stage: "labs",
      defaultLabsOn: false,
    };
    window.localStorage.removeItem("dicebudget.labsUnlocked.v1");
    window.localStorage.removeItem("dicebudget.labsFeatures.v1");
  });

  afterEach(() => {
    for (const key of Object.keys(FEATURE_REGISTRY)) {
      if (!(key in originalRegistry)) {
        delete (FEATURE_REGISTRY as Record<string, unknown>)[key];
      }
    }
    Object.assign(FEATURE_REGISTRY, originalRegistry);
    Reflect.deleteProperty(globalThis, "window");
  });

  it("labs-Feature aus wenn Labor nicht freigeschaltet", () => {
    assert.equal(isFeatureEnabled(TEST_FEATURE_ID), false);
  });

  it("labs-Feature an wenn freigeschaltet und Toggle an", () => {
    window.localStorage.setItem("dicebudget.labsUnlocked.v1", "1");
    setLabsFeaturePref(TEST_FEATURE_ID, true);
    assert.equal(isFeatureEnabled(TEST_FEATURE_ID), true);
  });

  it("released-Feature immer an", () => {
    (FEATURE_REGISTRY as Record<string, unknown>)[TEST_FEATURE_ID] = {
      id: TEST_FEATURE_ID,
      title: "Test",
      description: "Test",
      stage: "released",
    };
    assert.equal(isFeatureEnabled(TEST_FEATURE_ID), true);
  });
});
