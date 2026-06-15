import { useCallback, useEffect, useRef, useState } from "react";
import {
  achievementDurationMs,
  notifyAchievement,
  type AchievementOverlayState,
} from "@/lib/achievementFeedback";
import { playProgressMilestoneSound } from "@/lib/achievementSound";
import type { RunProgressOverlayState } from "@/lib/runProgressFeedback";

/** Erfolgs- und Fortschritts-Overlays nacheinander (Fortschritt wartet hinter Erfolg). */
export function useQueuedFeedbackOverlays() {
  const [achievementOverlay, setAchievementOverlay] = useState<AchievementOverlayState | null>(
    null,
  );
  const [progressOverlay, setProgressOverlay] = useState<RunProgressOverlayState | null>(null);
  const pendingProgressRef = useRef<RunProgressOverlayState | null>(null);

  const flushPendingProgress = useCallback(() => {
    const pending = pendingProgressRef.current;
    if (!pending) return;
    pendingProgressRef.current = null;
    playProgressMilestoneSound(pending.percent);
    setProgressOverlay(pending);
  }, []);

  const closeAchievementOverlay = useCallback(() => {
    setAchievementOverlay(null);
    flushPendingProgress();
  }, [flushPendingProgress]);

  useEffect(() => {
    if (!achievementOverlay) return;
    const timer = window.setTimeout(
      closeAchievementOverlay,
      achievementDurationMs(achievementOverlay.type),
    );
    return () => window.clearTimeout(timer);
  }, [achievementOverlay, closeAchievementOverlay]);

  const presentFeedbackAfterField = useCallback(
    (achievement: AchievementOverlayState | null, progress: RunProgressOverlayState | null) => {
      if (achievement) {
        notifyAchievement(achievement);
        setAchievementOverlay(achievement);
        if (progress) {
          pendingProgressRef.current = progress;
        }
        return;
      }
      if (progress) {
        playProgressMilestoneSound(progress.percent);
        setProgressOverlay(progress);
      }
    },
    [],
  );

  const closeProgressOverlay = useCallback(() => {
    setProgressOverlay(null);
  }, []);

  const clearAllFeedbackOverlays = useCallback(() => {
    setAchievementOverlay(null);
    setProgressOverlay(null);
    pendingProgressRef.current = null;
  }, []);

  return {
    achievementOverlay,
    progressOverlay,
    closeAchievementOverlay,
    closeProgressOverlay,
    presentFeedbackAfterField,
    clearAllFeedbackOverlays,
  };
}
