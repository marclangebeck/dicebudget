import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  FEATURE_REGISTRY,
  isFeatureEnabled,
  setLabsFeaturePref,
} from "./featureFlags.js";

const TEST_FEATURE_ID = "__testOptionalFeature";

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
      stage: "optional",
      defaultEnabled: false,
    };
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

  it("optional-Feature folgt Default ohne Pref", () => {
    assert.equal(isFeatureEnabled(TEST_FEATURE_ID), false);
  });

  it("optional-Feature an wenn Toggle an", () => {
    setLabsFeaturePref(TEST_FEATURE_ID, true);
    assert.equal(isFeatureEnabled(TEST_FEATURE_ID), true);
  });

  it("optional-Feature mit defaultEnabled true ohne Pref an", () => {
    (FEATURE_REGISTRY as Record<string, unknown>)[TEST_FEATURE_ID] = {
      id: TEST_FEATURE_ID,
      title: "Test",
      description: "Test",
      stage: "optional",
      defaultEnabled: true,
    };
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

  it("Unter-Toggle nur aktiv wenn Parent an", () => {
    const childId = "__testOptionalChild";
    (FEATURE_REGISTRY as Record<string, unknown>)[TEST_FEATURE_ID] = {
      id: TEST_FEATURE_ID,
      title: "Parent",
      description: "Parent",
      stage: "optional",
      defaultEnabled: false,
    };
    (FEATURE_REGISTRY as Record<string, unknown>)[childId] = {
      id: childId,
      title: "Child",
      description: "Child",
      stage: "optional",
      defaultEnabled: true,
      parentId: TEST_FEATURE_ID,
    };
    setLabsFeaturePref(childId, true);
    assert.equal(isFeatureEnabled(childId), false);
    setLabsFeaturePref(TEST_FEATURE_ID, true);
    assert.equal(isFeatureEnabled(childId), true);
  });
});
