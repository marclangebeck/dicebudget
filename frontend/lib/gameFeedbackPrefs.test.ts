import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_GAME_FEEDBACK_PREFS,
  feedbackPrefsSummary,
  setGameFeedbackPrefs,
} from "./gameFeedbackPrefs.js";

describe("gameFeedbackPrefs sheetFuse", () => {
  it("Default enthält sheetFuseHighlightEnabled", () => {
    assert.equal(DEFAULT_GAME_FEEDBACK_PREFS.sheetFuseHighlightEnabled, true);
  });

  it("Summary listet Lauffeuer", () => {
    const label = feedbackPrefsSummary({
      animationsEnabled: true,
      sheetFuseHighlightEnabled: true,
      soundsEnabled: false,
      progressHintsEnabled: false,
    });
    assert.equal(label, "Animationen · Lauffeuer");
  });

  it("setGameFeedbackPrefs behält sheetFuse", () => {
    const next = setGameFeedbackPrefs({
      animationsEnabled: true,
      sheetFuseHighlightEnabled: false,
      soundsEnabled: true,
      progressHintsEnabled: true,
    });
    assert.equal(next.sheetFuseHighlightEnabled, false);
  });
});
