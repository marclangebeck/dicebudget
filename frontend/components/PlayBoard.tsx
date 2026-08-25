"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StatsRatingToggle } from "@/components/StatsRatingToggle";
import { AchievementOverlay } from "@/components/AchievementOverlay";
import { RunProgressOverlay } from "@/components/RunProgressOverlay";
import { RuleEventOverlay } from "@/components/RuleEventOverlay";
import { RunCompleteOverlay } from "@/components/RunCompleteOverlay";
import { KoTieBreakOverlay } from "@/components/KoTieBreakOverlay";
import { MatchAnalysisView } from "@/components/MatchAnalysisView";
import { RunFinishScreen } from "@/components/RunFinishScreen";
import { FitScoreSheet } from "@/components/FitScoreSheet";
import { PlayTopBar } from "@/components/PlayTopBar";
import { PoolEndgamePanel } from "@/components/PoolEndgamePanel";
import { ScoreEntryPanel } from "@/components/ScoreEntryPanel";
import { isExtraHouseRulesUiAvailable } from "@/components/HouseRulesTableActions";
import { ScoreSheetTable } from "@/components/ScoreSheetTable";
import { clearActiveGame, saveActiveGame } from "@/lib/activeGame";
import {
  abandonRun,
  applyBurnRoll,
  applyRollSale,
  applyYatzyStreakPenalty,
  clearLastField,
  completeField,
  finalizeSessionStats,
  finishRun,
  getRun,
  getSessionLobby,
  getSessionMatchAnalysis,
  incrementExtraYatzy,
  resolvePoolEndgame,
} from "@/lib/api";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import { poolDeltaForComplete } from "@/lib/gameRules";
import { canBurnHouseRule, countOpenUpperFields, type BurnMode } from "@/lib/houseRules";
import { isFeatureEnabled } from "@/lib/featureFlags";
import { buildAchievementAfterField } from "@/lib/achievementFeedback";
import { useQueuedFeedbackOverlays } from "@/lib/feedbackOverlayQueue";
import {
  buildProgressMilestoneAfterField,
  wouldCrossProgressMilestone,
} from "@/lib/runProgressFeedback";
import {
  playFirstRollRewardSound,
  playSheetGoldFanfareSound,
  shouldPlayFirstRollReward,
  unlockAchievementAudio,
} from "@/lib/achievementSound";
import { getSheetFuseHighlightEnabled } from "@/lib/gameFeedbackPrefs";
import { ruleEventFromDto } from "@/lib/ruleEventFeedback";
import { getOrCreatePlayerId, normalizePublicPlayerId } from "@/lib/playerIdentity";
import {
  detectSheetFuseHighlight,
  SHEET_GOLD_FLASH_MS,
  type SheetFuseHighlight,
} from "@/lib/sheetFuseHighlight";

import { APP_HOME_PATH } from "@/lib/branding";
import {
  abandonLocalSoloRun,
  burnLocalSoloRoll,
  clearLocalSoloField,
  completeLocalSoloField,
  finishLocalSoloRun,
  getLocalSoloRun,
  incrementLocalSoloExtraYatzy,
  isLocalSoloRunId,
} from "@/lib/localSoloRun";
import { buildSoloMatchAnalysis } from "@/lib/matchAnalysis";
import type { MatchAnalysisDto, SessionMatchAnalysisDto } from "@/lib/matchAnalysisTypes";
import {
  ABANDON_RUN_CONFIRM,
  allFieldsScored,
  getLastScoredFieldId,
  isRunEnded,
} from "@/lib/runUtils";
import type { FieldDto, RunDto } from "@/lib/types";

type Props = {
  runId: string;
  /** Nur Multiplayer; Header `X-Player-Secret`. */
  playerSecret?: string;
  inviteCode?: string | null;
};

function defaultRollsUsed(run: RunDto): number {
  return run.useStrategyRules ? 3 : 1;
}

export function PlayBoard({ runId, playerSecret, inviteCode }: Props) {
  const router = useRouter();
  const isLocalSolo = !inviteCode && !playerSecret && isLocalSoloRunId(runId);
  const [run, setRun] = useState<RunDto | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [rollsUsed, setRollsUsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);
  const [sheetReviewAfterComplete, setSheetReviewAfterComplete] = useState(false);
  const {
    achievementOverlay,
    ruleEventOverlay,
    progressOverlay,
    closeAchievementOverlay,
    closeRuleEventOverlay,
    closeProgressOverlay,
    presentFeedbackAfterField,
    clearAllFeedbackOverlays,
  } = useQueuedFeedbackOverlays();
  const shownProgressRef = useRef<Set<number>>(new Set());
  const [opponentPool, setOpponentPool] = useState<number | null>(null);
  const [opponentOpenUpperFields, setOpponentOpenUpperFields] = useState<
    number | null
  >(null);
  const [lobby, setLobby] = useState<SessionLobbyDto | null>(null);
  const [endgameFieldId, setEndgameFieldId] = useState<string | null>(null);
  const [endgameScoreInput, setEndgameScoreInput] = useState("");
  const [yatzyDieValue, setYatzyDieValue] = useState<number | null>(null);
  const [includeInStats, setIncludeInStats] = useState(true);
  const [leavingHome, setLeavingHome] = useState(false);
  const [showKoTieBreakOverlay, setShowKoTieBreakOverlay] = useState(false);
  const [showMatchAnalysis, setShowMatchAnalysis] = useState(false);
  const [matchAnalysis, setMatchAnalysis] = useState<
    MatchAnalysisDto | SessionMatchAnalysisDto | null
  >(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [lobbyRefreshing, setLobbyRefreshing] = useState(false);
  const [fuseHighlight, setFuseHighlight] = useState<SheetFuseHighlight | null>(null);
  const fuseHighlightTimerRef = useRef<number | null>(null);
  const poolEndgamePendingRef = useRef(false);

  function flashSheetFuse(gamesBefore: RunDto["games"], gamesAfter: RunDto["games"]) {
    if (!getSheetFuseHighlightEnabled()) return;
    const next = detectSheetFuseHighlight(gamesBefore, gamesAfter);
    if (!next) return;
    playSheetGoldFanfareSound();
    setFuseHighlight(next);
    if (fuseHighlightTimerRef.current != null) {
      window.clearTimeout(fuseHighlightTimerRef.current);
    }
    fuseHighlightTimerRef.current = window.setTimeout(() => {
      setFuseHighlight(null);
      fuseHighlightTimerRef.current = null;
    }, SHEET_GOLD_FLASH_MS);
  }

  const resetEntry = useCallback(() => {
    setScoreInput("");
    setRollsUsed(null);
    setYatzyDieValue(null);
  }, []);

  const load = useCallback(async () => {
    const data = isLocalSolo
      ? getLocalSoloRun(runId)
      : (await getRun(runId, playerSecret)).run;
    setRun(data);
    setActiveFieldId((current) => {
      if (
        current &&
        data.games.flatMap((g) => g.fields).some((f) => f.id === current)
      ) {
        return current;
      }
      return null;
    });
  }, [runId, playerSecret, isLocalSolo]);

  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "Laden fehlgeschlagen"),
    );
  }, [load]);

  // Lobby nur gezielt nachladen (Start + nach eigener Eintragung + Abschluss), kein Polling.
  const refreshLobby = useCallback(async (options?: { lite?: boolean }) => {
    if (!inviteCode) return null;
    setLobbyRefreshing(true);
    try {
      const { session } = await getSessionLobby(inviteCode, options);
      setLobby(session);
      if (session.showOpponentPool && session.players.length === 2) {
        const myId = normalizePublicPlayerId(getOrCreatePlayerId());
        const opponent = session.players.find(
          (p) => normalizePublicPlayerId(p.playerId) !== myId,
        );
        setOpponentPool(opponent?.rollsInPool ?? null);
        setOpponentOpenUpperFields(
          typeof opponent?.openUpperFields === "number"
            ? opponent.openUpperFields
            : null,
        );
      } else {
        setOpponentPool(null);
        setOpponentOpenUpperFields(null);
      }
      return session;
    } catch {
      // Anzeige ist optional – Fehler hier nicht ins Spiel durchreichen.
      return null;
    } finally {
      setLobbyRefreshing(false);
    }
  }, [inviteCode]);

  useEffect(() => {
    void refreshLobby();
  }, [refreshLobby]);

  const poolEndgamePending =
    run && isRunEnded(run) &&
    !!lobby?.poolEndgameEnabled &&
    !lobby.poolEndgameResolved;

  // Bin ich der Pool-Sieger und darf (noch) ein Feld verbessern? (M33)
  const amPoolEndgameImprover =
    !!lobby &&
    lobby.poolEndgameEnabled &&
    !lobby.poolEndgameResolved &&
    !!lobby.poolEndgameImproverPlayerId &&
    !!inviteCode &&
    normalizePublicPlayerId(lobby.poolEndgameImproverPlayerId) ===
      normalizePublicPlayerId(getOrCreatePlayerId());

  const ownPlayerDbId = lobby?.players.find(
    (p) => normalizePublicPlayerId(p.playerId) === normalizePublicPlayerId(getOrCreatePlayerId()),
  )?.id;

  const ownOpenUpperFields = useMemo(
    () => (run ? countOpenUpperFields(run.games) : 0),
    [run],
  );

  const waitingPoolEndgame =
    poolEndgamePending && !amPoolEndgameImprover && !!inviteCode;

  // Pool-Endspiel (Nicht-Sieger): Session beim Eintritt + Focus/Visibility gezielt
  // nachladen — kein setInterval/Polling (M24 / AGENT_RULES).
  useEffect(() => {
    if (!waitingPoolEndgame) return;
    void refreshLobby();
  }, [waitingPoolEndgame, refreshLobby]);

  useEffect(() => {
    if (!inviteCode) return;
    const onActive = () => {
      if (document.visibilityState !== "visible") return;
      if (run && isRunEnded(run) && lobby?.poolEndgameEnabled && !lobby.poolEndgameResolved) {
        void refreshLobby();
        return;
      }
      void refreshLobby();
    };
    document.addEventListener("visibilitychange", onActive);
    window.addEventListener("focus", onActive);
    return () => {
      document.removeEventListener("visibilitychange", onActive);
      window.removeEventListener("focus", onActive);
    };
  }, [inviteCode, refreshLobby, run?.status, lobby?.poolEndgameEnabled, lobby?.poolEndgameResolved]);

  // Abschluss-Screen: einmal nachladen, wenn Pool-Endspiel gerade aufgelöst wurde.
  useEffect(() => {
    if (run?.status !== "FINISHED") {
      poolEndgamePendingRef.current = false;
      return;
    }
    const pending = !!lobby?.poolEndgameEnabled && !lobby.poolEndgameResolved;
    if (poolEndgamePendingRef.current && !pending && inviteCode) {
      void refreshLobby();
    }
    poolEndgamePendingRef.current = pending;
  }, [
    run?.status,
    lobby?.poolEndgameEnabled,
    lobby?.poolEndgameResolved,
    inviteCode,
    refreshLobby,
  ]);

  useEffect(() => {
    if (!run) return;
    if (isRunEnded(run)) {
      clearActiveGame();
      return;
    }
    if (inviteCode && playerSecret) {
      saveActiveGame({
        type: "multi",
        runId,
        playerSecret,
        inviteCode,
      });
    } else if (!inviteCode) {
      saveActiveGame({ type: "solo", runId });
    }
  }, [run, runId, inviteCode, playerSecret]);

  useEffect(() => {
    shownProgressRef.current = new Set();
  }, [runId]);

  const activeField: FieldDto | undefined = run?.games
    .flatMap((g) => g.fields)
    .find((f) => f.id === activeFieldId);

  const isCorrection = !!activeField && activeField.score !== null;

  const activeGameIndex =
    run?.games.find((g) => g.fields.some((f) => f.id === activeFieldId))?.index ?? null;

  const lastScoredFieldId = run ? getLastScoredFieldId(run) : null;
  const canClearLast =
    !!activeField &&
    !!run &&
    isCorrection &&
    activeField.id === lastScoredFieldId;

  function cancelEntry() {
    setActiveFieldId(null);
    resetEntry();
  }

  function selectField(fieldId: string) {
    const field = run?.games.flatMap((g) => g.fields).find((f) => f.id === fieldId);
    if (!field || !run) return;

    setActiveFieldId(fieldId);

    if (field.score !== null && field.score !== undefined) {
      setScoreInput(String(field.score));
      setRollsUsed(run.useStrategyRules ? field.rollsUsed : 1);
      setYatzyDieValue(field.yatzyDieValue ?? null);
      return;
    }

    resetEntry();
    if (run.rollSaleFreeFillActive) {
      setRollsUsed(0);
    } else {
      setRollsUsed(defaultRollsUsed(run));
    }
  }

  async function handleExtraYatzy(yatzyDieValue: number) {
    if (!run || run.status !== "ACTIVE") return;
    setBusy(true);
    setError(null);
    try {
      const updated = isLocalSolo
        ? incrementLocalSoloExtraYatzy(runId, yatzyDieValue)
        : (await incrementExtraYatzy(runId, yatzyDieValue, playerSecret)).run;
      setRun(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zusatz Alle Fünfe fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  const finalizeStatsIfMulti = useCallback(
    async (includeInPairingStats: boolean) => {
      if (!inviteCode || !playerSecret) {
        throw new Error("Session missing");
      }
      return finalizeSessionStats(inviteCode, includeInPairingStats, playerSecret);
    },
    [inviteCode, playerSecret],
  );

  async function handleViewAnalysis() {
    if (!run) return;
    setAnalysisLoading(true);
    setError(null);
    try {
      if (isLocalSolo) {
        setMatchAnalysis(buildSoloMatchAnalysis(run));
        setShowMatchAnalysis(true);
        return;
      }
      if (inviteCode) {
        const { analysis } = await getSessionMatchAnalysis(
          inviteCode,
          getOrCreatePlayerId(),
          playerSecret,
        );
        setMatchAnalysis(analysis);
        setShowMatchAnalysis(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analyse fehlgeschlagen");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleSubmit() {
    if (!activeFieldId || !run || scoreInput === "") return;
    unlockAchievementAudio();
    const rollSaleEntry = !!run.rollSaleFreeFillActive && !isCorrection;
    const effectiveRolls: number = rollSaleEntry
      ? 0
      : run.useStrategyRules
        ? (rollsUsed ?? 0)
        : (rollsUsed ?? 1);
    if (run.useStrategyRules && !rollSaleEntry && rollsUsed === null) {
      setError("Bitte die Anzahl Würfe für dieses Feld wählen.");
      return;
    }
    if (!rollSaleEntry && effectiveRolls < 1) return;
    const score = Number(scoreInput);
    const activeFieldType = run.games
      .flatMap((g) => g.fields)
      .find((f) => f.id === activeFieldId)?.fieldType;
    const needsYatzyDie = !rollSaleEntry && activeFieldType === "KNIFFEL" && score === 50;
    if (needsYatzyDie && yatzyDieValue === null) {
      setError("Bitte den Würfel für Alle Fünfe (50 Punkte) wählen.");
      return;
    }
    const yatzyArg = needsYatzyDie ? yatzyDieValue! : undefined;
    setBusy(true);
    setError(null);
    try {
      let updated: RunDto;
      let houseEvents: import("@/lib/ruleEventFeedback").HouseRuleAutoEventDto[] = [];
      if (isLocalSolo) {
        updated = completeLocalSoloField(runId, activeFieldId, score, effectiveRolls, yatzyArg);
      } else {
        const result = await completeField(
          runId,
          activeFieldId,
          score,
          effectiveRolls,
          playerSecret,
          yatzyArg,
        );
        updated = result.run;
        houseEvents = result.events ?? [];
      }
      const gameBefore = run.games.find((g) =>
        g.fields.some((f) => f.id === activeFieldId),
      );
      const gameAfter = updated.games.find((g) =>
        g.fields.some((f) => f.id === activeFieldId),
      );
      const achievement =
        activeFieldType && gameBefore && gameAfter
          ? buildAchievementAfterField(
              activeFieldType,
              score,
              gameBefore.fields,
              gameAfter.fields,
              updated.gameCount > 1 ? (gameAfter.index ?? null) : null,
              yatzyArg ?? null,
            )
          : null;
      // Bei Meilenstein: frische Lite-Lobby für Gegner-Feldpunkte (kein totalScore-Fallback).
      let lobbyForProgress = lobby;
      const crossesMilestone =
        !!inviteCode &&
        wouldCrossProgressMilestone(run, updated, shownProgressRef.current) != null;
      if (crossesMilestone) {
        const fresh = await refreshLobby({ lite: true });
        if (fresh) lobbyForProgress = fresh;
      }
      const progress = buildProgressMilestoneAfterField(
        run,
        updated,
        shownProgressRef.current,
        inviteCode && lobbyForProgress && lobbyForProgress.playerCount >= 2
          ? {
              kind: "lobby",
              lobby: lobbyForProgress,
              ownPlayerId: getOrCreatePlayerId(),
            }
          : null,
      );
      const ruleOverlays = houseEvents
        .map((event) => ruleEventFromDto(event))
        .filter((event): event is NonNullable<typeof event> => event != null);
      if (
        shouldPlayFirstRollReward({
          useStrategyRules: run.useStrategyRules,
          rollsUsed: effectiveRolls,
          score,
          isCorrection,
          rollSaleEntry,
          hasAchievement: achievement != null,
        })
      ) {
        playFirstRollRewardSound();
      }
      flashSheetFuse(run.games, updated.games);
      setRun(updated);
      resetEntry();
      setActiveFieldId(null);
      if (allFieldsScored(updated)) {
        if (inviteCode && playerSecret) {
          const finished = (await finishRun(runId, playerSecret)).run;
          clearActiveGame();
          setRun(finished);
          setShowCompleteOverlay(false);
          setSheetReviewAfterComplete(false);
          void refreshLobby();
          return;
        }
        setSheetReviewAfterComplete(false);
        setShowCompleteOverlay(true);
      } else {
        if (progress) {
          shownProgressRef.current.add(progress.percent);
        }
        presentFeedbackAfterField(achievement, progress, ruleOverlays);
      }
      if (!crossesMilestone) {
        void refreshLobby({ lite: true });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eintrag fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleClearLast() {
    if (!activeFieldId || !run) return;
    setBusy(true);
    setError(null);
    try {
      const updated = isLocalSolo
        ? clearLocalSoloField(runId, activeFieldId)
        : (await clearLastField(runId, activeFieldId, playerSecret)).run;
      setRun(updated);
      setActiveFieldId(null);
      resetEntry();
      setShowCompleteOverlay(false);
      setSheetReviewAfterComplete(false);
      clearAllFeedbackOverlays();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  function scrollToFinish() {
    requestAnimationFrame(() => {
      document.getElementById("run-finish-screen")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  async function handleFinish() {
    setBusy(true);
    setError(null);
    try {
      const updated = isLocalSolo
        ? finishLocalSoloRun(runId)
        : (await finishRun(runId, playerSecret)).run;
      clearActiveGame();
      setRun(updated);
      setActiveFieldId(null);
      setShowCompleteOverlay(false);
      void refreshLobby();
      scrollToFinish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Abschluss fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  function selectEndgameField(fieldId: string) {
    const field = run?.games.flatMap((g) => g.fields).find((f) => f.id === fieldId);
    if (!field || field.score === null) return;
    setEndgameFieldId(fieldId);
    setEndgameScoreInput(String(field.score));
  }

  async function handleEndgameSubmit() {
    if (!inviteCode || !endgameFieldId || endgameScoreInput === "") return;
    const score = Number(endgameScoreInput);
    if (Number.isNaN(score)) return;
    setBusy(true);
    setError(null);
    try {
      await resolvePoolEndgame(
        inviteCode,
        { fieldId: endgameFieldId, score },
        playerSecret,
      );
      setEndgameFieldId(null);
      setEndgameScoreInput("");
      setSheetReviewAfterComplete(false);
      const { run: updated } = await getRun(runId, playerSecret);
      setRun(updated);
      await refreshLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verbesserung fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleEndgameKeep() {
    if (!inviteCode) return;
    setBusy(true);
    setError(null);
    try {
      await resolvePoolEndgame(inviteCode, { keep: true }, playerSecret);
      setEndgameFieldId(null);
      setEndgameScoreInput("");
      setSheetReviewAfterComplete(false);
      await refreshLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aktion fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleBurn(fieldId: string, mode: BurnMode) {
    if (!run) return;
    const costLabel = mode === "set_face" ? "2 Pool" : "1 Pool";
    const actionLabel =
      mode === "set_face"
        ? "Würfel daneben legen und Augenzahl selbst wählen"
        : "brennenden Würfel neu würfeln (Rest darf liegen bleiben)";
    if (!window.confirm(`Brennt (−${costLabel}): ${actionLabel}?`)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = isLocalSolo
        ? burnLocalSoloRoll(runId, fieldId, mode)
        : (await applyBurnRoll(runId, fieldId, mode, playerSecret)).run;
      setRun(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Brennt fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleRollSale(
    sellerPlayerId: string,
    buyerPlayerId: string,
    pools: number,
  ) {
    if (!inviteCode || !playerSecret) return;
    setBusy(true);
    setError(null);
    try {
      const result = await applyRollSale(
        inviteCode,
        sellerPlayerId,
        buyerPlayerId,
        pools,
        playerSecret,
      );
      if (result.sellerRun.id === runId) {
        setRun(result.sellerRun);
      } else if (result.buyerRun.id === runId) {
        setRun(result.buyerRun);
      } else {
        await load();
      }
      await refreshLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verkauf fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleYatzyStreak(victimPlayerId: string) {
    if (!playerSecret || !run) return;
    if (
      !window.confirm(
        "Gegner verliert die Hälfte des Pools (abrunden). Strafe jetzt anwenden?",
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await applyYatzyStreakPenalty(runId, victimPlayerId, playerSecret);
      await load();
      await refreshLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Strafe fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleAbandon() {
    if (!window.confirm(ABANDON_RUN_CONFIRM)) return;
    setBusy(true);
    setError(null);
    try {
      const updated = isLocalSolo
        ? abandonLocalSoloRun(runId)
        : (await abandonRun(runId, playerSecret)).run;
      clearActiveGame();
      setRun(updated);
      setActiveFieldId(null);
      resetEntry();
      scrollToFinish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Beenden fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (!run) {
    return <p className="text-muted">Lade Spiel …</p>;
  }

  const allScored = allFieldsScored(run);
  const showEntryPanel = !!activeField && !showCompleteOverlay;

  const sheetLayoutKey = `${run.gameCount}-${showEntryPanel ? "entry" : "idle"}-${showCompleteOverlay ? "overlay" : "sheet"}`;

  const rollsInPoolForEntry =
    isCorrection && activeField && run.useStrategyRules
      ? (() => {
          const oldDelta = poolDeltaForComplete(activeField.rollsUsed, true);
          return run.rollsInPool + oldDelta.poolCost - oldDelta.spareToPool;
        })()
      : run.rollsInPool;

  if (isRunEnded(run)) {
    const analysisAvailable =
      !poolEndgamePending &&
      (isLocalSolo || !inviteCode || lobby == null || lobby.playerCount >= 2);

    if (showMatchAnalysis && matchAnalysis) {
      return (
        <div className="play-board play-board--finished flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {error && (
            <p className="glass-alert-error shrink-0 px-3 py-2 text-sm">{error}</p>
          )}
          <div className="play-finish-scroll min-h-0 flex-1 overflow-y-auto">
            <MatchAnalysisView
              analysis={matchAnalysis}
              ownPlayerId={getOrCreatePlayerId()}
              onBack={() => setShowMatchAnalysis(false)}
              backLabel="Zurück zum Ergebnis"
            />
          </div>
        </div>
      );
    }

    if (sheetReviewAfterComplete) {
      return (
        <div className="play-board play-board--finished flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          {error && (
            <p className="glass-alert-error shrink-0 px-3 py-2 text-sm">{error}</p>
          )}
          <div className="play-board-main flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="play-sheet-card flex min-h-0 flex-1 overflow-hidden">
              <FitScoreSheet layoutKey={`finished-review-${run.gameCount}`}>
                <ScoreSheetTable
                  run={run}
                  activeFieldId={null}
                  onSelectField={() => undefined}
                />
              </FitScoreSheet>
            </div>
          </div>
          {inviteCode && playerSecret && (
            <div className="shrink-0 px-1">
              <StatsRatingToggle
                includeInStats={includeInStats}
                onChange={setIncludeInStats}
                disabled={leavingHome}
              />
            </div>
          )}
          {analysisAvailable && (
            <button
              type="button"
              disabled={analysisLoading}
              onClick={() => void handleViewAnalysis()}
              className="run-finish-action-btn flex min-h-10 shrink-0 items-center justify-center px-6 text-sm disabled:opacity-50"
            >
              {analysisLoading ? "Lade Analyse …" : "Spielanalyse"}
            </button>
          )}
          {inviteCode && playerSecret ? (
            <button
              type="button"
              disabled={leavingHome || showKoTieBreakOverlay}
              onClick={() => {
                setLeavingHome(true);
                void (async () => {
                  try {
                    const res = await finalizeStatsIfMulti(includeInStats);
                    if (res?.session?.koTieBreakPending) {
                      setShowKoTieBreakOverlay(true);
                      return;
                    }
                    router.push(APP_HOME_PATH);
                  } catch (e) {
                    setError(
                      e instanceof Error
                        ? e.message
                        : "Statistik-Speicherung fehlgeschlagen",
                    );
                  } finally {
                    setLeavingHome(false);
                  }
                })();
              }}
              className="setup-host-submit flex min-h-10 shrink-0 items-center justify-center text-center disabled:opacity-50"
            >
              {leavingHome ? "Speichere …" : "Spiel beenden und zur Startseite"}
            </button>
          ) : (
            <Link
              href={APP_HOME_PATH}
              className="setup-host-submit flex min-h-10 shrink-0 items-center justify-center text-center no-underline"
            >
              Spiel beenden und zur Startseite
            </Link>
          )}
          {showKoTieBreakOverlay && inviteCode && playerSecret && (
            <KoTieBreakOverlay
              inviteCode={inviteCode}
              playerSecret={playerSecret}
              initialRolls={
                lobby?.koTieBreakPlayerAId === getOrCreatePlayerId()
                  ? lobby?.koTieBreakPlayerARolls ?? null
                  : lobby?.koTieBreakPlayerBId === getOrCreatePlayerId()
                    ? lobby?.koTieBreakPlayerBRolls ?? null
                    : null
              }
              onResolved={async () => {
                setShowKoTieBreakOverlay(false);
                await finalizeStatsIfMulti(includeInStats);
                router.push(APP_HOME_PATH);
              }}
            />
          )}
        </div>
      );
    }

    if (amPoolEndgameImprover) {
      const endgameField = run.games
        .flatMap((g) => g.fields)
        .find((f) => f.id === endgameFieldId);
      const endgameGameIndex =
        run.games.find((g) => g.fields.some((f) => f.id === endgameFieldId))?.index ??
        null;
      return (
        <div className="play-board relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
          <div className="play-endgame-banner shrink-0">
            <p className="play-endgame-banner-title">Pool-Sieger</p>
            <p className="play-endgame-banner-text">
              Du hattest die meisten Würfe im Pool – wähle ein Feld zum Verbessern
              oder behalte alles.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleEndgameKeep()}
              className="play-endgame-keep-btn disabled:opacity-50"
            >
              {busy ? "…" : "Alten Wert behalten & beenden"}
            </button>
          </div>

          {error && (
            <p className="glass-alert-error shrink-0 px-3 py-2 text-sm">{error}</p>
          )}

          <div className="play-board-main flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="play-sheet-card flex min-h-0 flex-1 overflow-hidden">
              <FitScoreSheet layoutKey={`endgame-${run.gameCount}`}>
                <ScoreSheetTable
                  run={run}
                  activeFieldId={endgameFieldId}
                  onSelectField={selectEndgameField}
                  allowSelectWhenFinished
                />
              </FitScoreSheet>
            </div>
          </div>

          {endgameField && (
            <PoolEndgamePanel
              field={endgameField}
              gameIndex={endgameGameIndex}
              scoreInput={endgameScoreInput}
              busy={busy}
              onPickScoreValue={(v) => setEndgameScoreInput(String(v))}
              onSubmit={() => void handleEndgameSubmit()}
              onCancel={() => {
                setEndgameFieldId(null);
                setEndgameScoreInput("");
              }}
            />
          )}
        </div>
      );
    }

    // Pool-Endspiel aktiviert, aber noch nicht aufgelöst: Sieger steht ggf. noch
    // nicht fest (es sind noch nicht alle fertig) oder verbessert gerade. Ohne
    // Polling kann der bereits fertige Spieler die Improver-Phase verpassen –
    // daher Warte-Hinweis mit gezieltem Aktualisieren (+ Focus-Refresh).
    if (poolEndgamePending) {
      return (
        <div className="play-board play-board--finished flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <div className="play-endgame-banner shrink-0">
            <p className="play-endgame-banner-title">Pool-Endspiel läuft</p>
            <p className="play-endgame-banner-text">
              Sobald alle Mitspieler fertig sind, darf der Spieler mit dem größten
              Wurf-Pool ein Feld verbessern. Die Session aktualisiert sich beim
              Wechsel zurück in die App — oder tippe auf „Aktualisieren“.
            </p>
            {lobbyRefreshing && (
              <p className="play-endgame-refresh-hint" aria-live="polite">
                Session wird aktualisiert…
              </p>
            )}
            <button
              type="button"
              disabled={lobbyRefreshing}
              onClick={() => void refreshLobby()}
              className="play-endgame-keep-btn disabled:opacity-50"
            >
              {lobbyRefreshing ? "…" : "Aktualisieren"}
            </button>
          </div>
          {error && (
            <p className="glass-alert-error shrink-0 px-3 py-2 text-sm">{error}</p>
          )}
        </div>
      );
    }

    return (
      <div className="play-board play-board--finished flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <p className="play-finished-label shrink-0 text-center text-xs">Spiel beendet</p>
        {error && (
          <p className="glass-alert-error shrink-0 px-3 py-2 text-sm">{error}</p>
        )}
        <div className="play-finish-scroll min-h-0 flex-1 overflow-y-auto">
          <RunFinishScreen
            run={run}
            onViewSheet={() => setSheetReviewAfterComplete(true)}
            onViewAnalysis={() => void handleViewAnalysis()}
            analysisAvailable={analysisAvailable}
            analysisLoading={analysisLoading}
            multiplayer={!!inviteCode && !!playerSecret}
            inviteCode={inviteCode ?? null}
            playerSecret={playerSecret}
            onFinalizeStats={
              inviteCode && playerSecret ? finalizeStatsIfMulti : undefined
            }
            lobby={lobby}
            ownPlayerId={getOrCreatePlayerId()}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="play-board relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
      <PlayTopBar
        inviteCode={inviteCode}
        useStrategyRules={run.useStrategyRules}
        rollsInPool={run.rollsInPool}
        rollsRemaining={run.rollsRemaining}
        opponentPool={opponentPool}
        ownOpenUpperFields={ownOpenUpperFields}
        opponentOpenUpperFields={opponentOpenUpperFields}
        showOpponentPoolControl={!!lobby?.showOpponentPool}
        onRefreshOpponentPool={() => void refreshLobby()}
        showAbandon
        abandonBusy={busy}
        onAbandon={() => void handleAbandon()}
        showRollSale={
          isExtraHouseRulesUiAvailable(isLocalSolo, run.useStrategyRules) &&
          isFeatureEnabled("houseRulesRollSale") &&
          !!inviteCode &&
          !!lobby &&
          lobby.playerCount >= 2
        }
        canRollSale={run.status === "ACTIVE" && !run.rollSaleFreeFillActive}
        rollSaleFreeFillActive={!!run.rollSaleFreeFillActive}
        lobby={lobby}
        ownPlayerDbId={ownPlayerDbId}
        onRollSale={(seller, buyer, pools) => void handleRollSale(seller, buyer, pools)}
      />

      {error && (
        <p className="glass-alert-error shrink-0 px-3 py-2 text-sm">{error}</p>
      )}

      {sheetReviewAfterComplete && allScored && !showCompleteOverlay && (
        <div className="play-review-banner shrink-0">
          <p className="play-review-score tabular-nums">{run.totalScore} Punkte</p>
          <div className="play-review-actions">
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowCompleteOverlay(true)}
              className="play-review-btn play-review-btn--secondary disabled:opacity-50"
            >
              Abschluss
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleFinish()}
              className="play-review-btn play-review-btn--primary disabled:opacity-50"
            >
              {busy ? "…" : "Ergebnis"}
            </button>
          </div>
        </div>
      )}

      <div className="play-board-main flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="play-sheet-card flex min-h-0 flex-1 overflow-hidden">
          <FitScoreSheet layoutKey={sheetLayoutKey}>
            <ScoreSheetTable
              run={run}
              activeFieldId={activeFieldId}
              onSelectField={selectField}
              onIncrementExtraYatzy={(yatzyDieValue) => void handleExtraYatzy(yatzyDieValue)}
              extraYatzyBusy={busy}
              fuseHighlight={fuseHighlight}
            />
          </FitScoreSheet>
        </div>
      </div>

      {achievementOverlay && !showCompleteOverlay && (
        <AchievementOverlay
          type={achievementOverlay.type}
          gameIndex={achievementOverlay.gameIndex}
          yatzyDieValue={achievementOverlay.yatzyDieValue}
          onClose={closeAchievementOverlay}
        />
      )}

      {ruleEventOverlay && !showCompleteOverlay && !achievementOverlay && (
        <RuleEventOverlay event={ruleEventOverlay} onClose={closeRuleEventOverlay} />
      )}

      {progressOverlay && !showCompleteOverlay && !achievementOverlay && !ruleEventOverlay && (
        <RunProgressOverlay
          percent={progressOverlay.percent}
          positionHint={progressOverlay.positionHint}
          scoreDelta={progressOverlay.scoreDelta}
          onClose={closeProgressOverlay}
        />
      )}

      {showCompleteOverlay && run && (
        <RunCompleteOverlay
          totalScore={run.totalScore}
          gameCount={run.gameCount}
          busy={busy}
          onViewSheet={() => {
            setShowCompleteOverlay(false);
            setSheetReviewAfterComplete(true);
          }}
          onContinue={() => void handleFinish()}
        />
      )}

      {showEntryPanel && activeField && (
        <ScoreEntryPanel
          id="score-entry-panel"
          run={run}
          gameIndex={activeGameIndex}
          field={activeField}
          scoreInput={scoreInput}
          rollsUsed={rollsUsed}
          busy={busy}
          isCorrection={isCorrection}
          canClearLast={canClearLast}
          rollsInPoolOverride={rollsInPoolForEntry}
          rollSaleMode={!!run.rollSaleFreeFillActive && !isCorrection}
          burnEnabled={
            isFeatureEnabled("houseRulesBurn") &&
            run.useStrategyRules &&
            !isCorrection &&
            !run.rollSaleFreeFillActive
          }
          canBurn={canBurnHouseRule(run, activeFieldId, isCorrection)}
          onBurn={(mode) => activeFieldId && void handleBurn(activeFieldId, mode)}
          inviteCode={inviteCode ?? undefined}
          lobby={lobby}
          isLocalSolo={isLocalSolo}
          ownPlayerDbId={ownPlayerDbId}
          onRollSale={(seller, buyer, pools) => void handleRollSale(seller, buyer, pools)}
          onYatzyStreak={(victimId) => void handleYatzyStreak(victimId)}
          onPickScoreValue={(v) => {
            setScoreInput(String(v));
            if (v !== 50) setYatzyDieValue(null);
          }}
          yatzyDieValue={yatzyDieValue}
          onYatzyDieValue={setYatzyDieValue}
          onRollsUsed={setRollsUsed}
          onSubmit={() => void handleSubmit()}
          onClearLast={() => void handleClearLast()}
          onCancel={cancelEntry}
        />
      )}
    </div>
  );
}
