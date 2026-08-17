import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import {
  APP_TOUR_STEPS,
  APP_TOUR_STEPS_BY_CHAPTER,
  getAppTourSteps,
  nextAppTourChapter,
  parseAppTourChapterParam,
} from "./appTourSteps.js";
import {
  consumePendingAppTour,
  DEFAULT_APP_TOUR_PREFS,
  getAppTourPrefs,
  requestAppTour,
  setAppTourPrefs,
  shouldAutoStartAppTour,
} from "./appTourPrefs.js";

function installBrowserMocks(): void {
  const storage: Record<string, string> = {};
  const session: Record<string, string> = {};
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
      sessionStorage: {
        getItem: (key: string) => session[key] ?? null,
        setItem: (key: string, value: string) => {
          session[key] = value;
        },
        removeItem: (key: string) => {
          delete session[key];
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
    window.sessionStorage.removeItem("dicebudget.appTour.pending");
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

  it("requestAppTour setzt Pending zum Konsumieren", () => {
    requestAppTour("all");
    assert.equal(consumePendingAppTour(), "all");
    assert.equal(consumePendingAppTour(), null);
  });
});

describe("appTourSteps", () => {
  it("hat drei Kapitel mit Strategy- und Statistik-Inhalt", () => {
    assert.equal(Object.keys(APP_TOUR_STEPS_BY_CHAPTER).length, 3);
    assert.ok(getAppTourSteps("start").length >= 4);
    assert.ok(getAppTourSteps("strategy").length >= 6);
    assert.ok(getAppTourSteps("rivals").length >= 3);
    assert.ok(APP_TOUR_STEPS.some((step) => step.id === "pool-build"));
    assert.ok(APP_TOUR_STEPS.some((step) => step.id === "pool-spend"));
    assert.ok(APP_TOUR_STEPS.some((step) => step.id === "stats-photos"));
    assert.ok(APP_TOUR_STEPS.some((step) => step.id === "house-rules"));
  });

  it("verkettet Kapitel A → B → C", () => {
    assert.equal(nextAppTourChapter("start"), "strategy");
    assert.equal(nextAppTourChapter("strategy"), "rivals");
    assert.equal(nextAppTourChapter("rivals"), null);
  });

  it("parst URL-Parameter", () => {
    assert.equal(parseAppTourChapterParam("1"), "all");
    assert.equal(parseAppTourChapterParam("all"), "all");
    assert.equal(parseAppTourChapterParam("strategy"), "strategy");
    assert.equal(parseAppTourChapterParam("nope"), null);
  });
});
