import { useCallback, useEffect, useRef, useState } from "react";
import {
  achievementDurationMs,
  notifyAchievement,
  type AchievementOverlayState,
} from "@/lib/achievementFeedback";
import { playProgressMilestoneSound } from "@/lib/achievementSound";
import type { RunProgressOverlayState } from "@/lib/runProgressFeedback";
import type { RuleEventOverlayState } from "@/lib/ruleEventFeedback";

/** Erfolgs-, Regel- und Fortschritts-Overlays nacheinander. */
export function useQueuedFeedbackOverlays() {
  const [achievementOverlay, setAchievementOverlay] = useState<AchievementOverlayState | null>(
    null,
  );
  const [ruleEventOverlay, setRuleEventOverlay] = useState<RuleEventOverlayState | null>(null);
  const [progressOverlay, setProgressOverlay] = useState<RunProgressOverlayState | null>(null);
  const pendingRuleEventsRef = useRef<RuleEventOverlayState[]>([]);
  const pendingProgressRef = useRef<RunProgressOverlayState | null>(null);

  const flushPendingProgress = useCallback(() => {
    const pending = pendingProgressRef.current;
    if (!pending) return;
    pendingProgressRef.current = null;
    playProgressMilestoneSound(pending.percent);
    setProgressOverlay(pending);
  }, []);

  const flushNextRuleOrProgress = useCallback(() => {
    const next = pendingRuleEventsRef.current.shift();
    if (next) {
      setRuleEventOverlay(next);
      return;
    }
    flushPendingProgress();
  }, [flushPendingProgress]);

  const closeAchievementOverlay = useCallback(() => {
    setAchievementOverlay(null);
    flushNextRuleOrProgress();
  }, [flushNextRuleOrProgress]);

  const closeRuleEventOverlay = useCallback(() => {
    setRuleEventOverlay(null);
    flushNextRuleOrProgress();
  }, [flushNextRuleOrProgress]);

  useEffect(() => {
    if (!achievementOverlay) return;
    const timer = window.setTimeout(
      closeAchievementOverlay,
      achievementDurationMs(achievementOverlay.type),
    );
    return () => window.clearTimeout(timer);
  }, [achievementOverlay, closeAchievementOverlay]);

  const presentFeedbackAfterField = useCallback(
    (
      achievement: AchievementOverlayState | null,
      progress: RunProgressOverlayState | null,
      ruleEvents: RuleEventOverlayState[] = [],
    ) => {
      pendingRuleEventsRef.current = [...ruleEvents];
      if (achievement) {
        notifyAchievement(achievement);
        setAchievementOverlay(achievement);
        if (progress) {
          pendingProgressRef.current = progress;
        }
        return;
      }
      if (ruleEvents.length > 0) {
        if (progress) {
          pendingProgressRef.current = progress;
        }
        flushNextRuleOrProgress();
        return;
      }
      if (progress) {
        playProgressMilestoneSound(progress.percent);
        setProgressOverlay(progress);
      }
    },
    [flushNextRuleOrProgress],
  );

  const closeProgressOverlay = useCallback(() => {
    setProgressOverlay(null);
  }, []);

  const clearAllFeedbackOverlays = useCallback(() => {
    setAchievementOverlay(null);
    setRuleEventOverlay(null);
    setProgressOverlay(null);
    pendingRuleEventsRef.current = [];
    pendingProgressRef.current = null;
  }, []);

  return {
    achievementOverlay,
    ruleEventOverlay,
    progressOverlay,
    closeAchievementOverlay,
    closeRuleEventOverlay,
    closeProgressOverlay,
    presentFeedbackAfterField,
    clearAllFeedbackOverlays,
  };
}
