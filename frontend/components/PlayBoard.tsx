"use client";

import { useCallback, useEffect, useState } from "react";
import { RunCompleteOverlay } from "@/components/RunCompleteOverlay";
import { RunFinishScreen } from "@/components/RunFinishScreen";
import { FitScoreSheet } from "@/components/FitScoreSheet";
import { PlayTopBar } from "@/components/PlayTopBar";
import { ScoreEntryPanel } from "@/components/ScoreEntryPanel";
import { ScoreSheetTable } from "@/components/ScoreSheetTable";
import { clearActiveGame, saveActiveGame } from "@/lib/activeGame";
import { abandonRun, clearLastField, completeField, finishRun, getRun, incrementExtraYatzy } from "@/lib/api";
import { poolDeltaForComplete } from "@/lib/gameRules";
import {
  abandonLocalSoloRun,
  clearLocalSoloField,
  completeLocalSoloField,
  finishLocalSoloRun,
  getLocalSoloRun,
  incrementLocalSoloExtraYatzy,
  isLocalSoloRunId,
} from "@/lib/localSoloRun";
import { ABANDON_RUN_CONFIRM, allFieldsScored, getLastScoredFieldId } from "@/lib/runUtils";
import type { FieldDto, RunDto } from "@/lib/types";

type Props = {
  runId: string;
  /** Nur Multiplayer; Header `X-Player-Secret`. */
  playerSecret?: string;
  inviteCode?: string | null;
};

function defaultRollsUsed(run: RunDto): number {
  return run.useStrategyRules ? 2 : 1;
}

export function PlayBoard({ runId, playerSecret, inviteCode }: Props) {
  const isLocalSolo = !inviteCode && !playerSecret && isLocalSoloRunId(runId);
  const [run, setRun] = useState<RunDto | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [rollsUsed, setRollsUsed] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCompleteOverlay, setShowCompleteOverlay] = useState(false);
  const [sheetReviewAfterComplete, setSheetReviewAfterComplete] = useState(false);

  const resetEntry = useCallback(() => {
    setScoreInput("");
    setRollsUsed(null);
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

  useEffect(() => {
    if (!run) return;
    if (run.status === "FINISHED") {
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
      return;
    }

    resetEntry();
    setRollsUsed(defaultRollsUsed(run));
  }

  async function handleExtraYatzy() {
    if (!run || run.status !== "ACTIVE") return;
    setBusy(true);
    setError(null);
    try {
      const updated = isLocalSolo
        ? incrementLocalSoloExtraYatzy(runId)
        : (await incrementExtraYatzy(runId, playerSecret)).run;
      setRun(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zusatz-Yatzy fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!activeFieldId || !run || scoreInput === "") return;
    const effectiveRolls: number = run.useStrategyRules ? (rollsUsed ?? 0) : (rollsUsed ?? 1);
    if (run.useStrategyRules && rollsUsed === null) return;
    if (effectiveRolls < 1) return;
    const score = Number(scoreInput);
    setBusy(true);
    setError(null);
    try {
      const updated = isLocalSolo
        ? completeLocalSoloField(runId, activeFieldId, score, effectiveRolls)
        : (
            await completeField(
              runId,
              activeFieldId,
              score,
              effectiveRolls,
              playerSecret,
            )
          ).run;
      setRun(updated);
      resetEntry();
      setActiveFieldId(null);
      if (allFieldsScored(updated)) {
        setSheetReviewAfterComplete(false);
        setShowCompleteOverlay(true);
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
      scrollToFinish();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Abschluss fehlgeschlagen");
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

  if (run.status === "FINISHED") {
    return (
      <div className="play-board play-board--finished flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
        <PlayTopBar
          inviteCode={inviteCode}
          useStrategyRules={run.useStrategyRules}
          rollsInPool={run.rollsInPool}
          rollsRemaining={run.rollsRemaining}
        />
        <p className="play-finished-label shrink-0 text-center text-xs">Spiel beendet</p>
        {error && (
          <p className="glass-alert-error shrink-0 px-3 py-2 text-sm">{error}</p>
        )}
        <div className="play-finish-scroll min-h-0 flex-1 overflow-y-auto">
          <RunFinishScreen run={run} inviteCode={inviteCode ?? undefined} />
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
        showAbandon
        abandonBusy={busy}
        onAbandon={() => void handleAbandon()}
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
              onIncrementExtraYatzy={() => void handleExtraYatzy()}
              extraYatzyBusy={busy}
            />
          </FitScoreSheet>
        </div>
      </div>

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
          onPickScoreValue={(v) => setScoreInput(String(v))}
          onRollsUsed={setRollsUsed}
          onSubmit={() => void handleSubmit()}
          onClearLast={() => void handleClearLast()}
          onCancel={cancelEntry}
        />
      )}
    </div>
  );
}
