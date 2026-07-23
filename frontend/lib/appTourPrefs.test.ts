import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { APP_TOUR_STEPS } from "./appTourSteps.js";
import {
  DEFAULT_APP_TOUR_PREFS,
  getAppTourPrefs,
  setAppTourPrefs,
  shouldAutoStartAppTour,
} from "./appTourPrefs.js";

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

describe("appTourPrefs", () => {
  beforeEach(() => {
    installBrowserMocks();
    window.localStorage.removeItem("dicebudget.appTour.v1");
  });

  afterEach(() => {
    Reflect.deleteProperty(globalThis, "window");
  });

  it("startet Tour standardmäßig", () => {
    assert.deepEqual(getAppTourPrefs(), DEFAULT_APP_TOUR_PREFS);
    assert.equal(shouldAutoStartAppTour(), true);
  });

  it("dontShowAgain verhindert Auto-Start", () => {
    setAppTourPrefs({ dontShowAgain: true });
    assert.equal(shouldAutoStartAppTour(), false);
    setAppTourPrefs({ dontShowAgain: false });
    assert.equal(shouldAutoStartAppTour(), true);
  });
});

describe("appTourSteps", () => {
  it("enthält Pool-Schritt und mind. 5 Schritte", () => {
    assert.ok(APP_TOUR_STEPS.length >= 5);
    assert.ok(APP_TOUR_STEPS.some((step) => step.id === "pool"));
  });
});
