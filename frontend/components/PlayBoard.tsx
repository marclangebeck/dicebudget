"use client";

import { useCallback, useEffect, useState } from "react";
import { BonusOverlay } from "@/components/BonusOverlay";
import { RunCompleteOverlay } from "@/components/RunCompleteOverlay";
import { RunFinishScreen } from "@/components/RunFinishScreen";
import { FitScoreSheet } from "@/components/FitScoreSheet";
import { PlayTopBar } from "@/components/PlayTopBar";
import { PoolEndgamePanel } from "@/components/PoolEndgamePanel";
import { ScoreEntryPanel } from "@/components/ScoreEntryPanel";
import { ScoreSheetTable } from "@/components/ScoreSheetTable";
import { clearActiveGame, saveActiveGame } from "@/lib/activeGame";
import {
  abandonRun,
  clearLastField,
  completeField,
  finishRun,
  getRun,
  getSessionLobby,
  incrementExtraYatzy,
  resolvePoolEndgame,
} from "@/lib/api";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import { poolDeltaForComplete } from "@/lib/gameRules";
import { upperBonusAchieved } from "@/lib/gameScoring";
import { getOrCreatePlayerId, normalizePublicPlayerId } from "@/lib/playerIdentity";
import { getBonusCelebrationEnabled } from "@/lib/uiPrefs";
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
  return run.useStrategyRules ? 3 : 1;
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
  const [bonusOverlayGame, setBonusOverlayGame] = useState<number | null>(null);
  const [opponentPool, setOpponentPool] = useState<number | null>(null);
  const [lobby, setLobby] = useState<SessionLobbyDto | null>(null);
  const [endgameFieldId, setEndgameFieldId] = useState<string | null>(null);
  const [endgameScoreInput, setEndgameScoreInput] = useState("");

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

  // Lobby nur gezielt nachladen (Start + nach eigener Eintragung + Abschluss), kein Polling.
  const refreshLobby = useCallback(async () => {
    if (!inviteCode) return;
    try {
      const { session } = await getSessionLobby(inviteCode);
      setLobby(session);
      if (session.showOpponentPool && session.players.length === 2) {
        const myId = normalizePublicPlayerId(getOrCreatePlayerId());
        const opponent = session.players.find(
          (p) => normalizePublicPlayerId(p.playerId) !== myId,
        );
        setOpponentPool(opponent?.rollsInPool ?? null);
      } else {
        setOpponentPool(null);
      }
    } catch {
      // Anzeige ist optional – Fehler hier nicht ins Spiel durchreichen.
    }
  }, [inviteCode]);

  useEffect(() => {
    void refreshLobby();
  }, [refreshLobby]);

  // Gegner-Pool ohne Polling aktualisieren: einzelner Lobby-Request, wenn die App
  // wieder in den Vordergrund kommt (Geräte-/App-Wechsel). Kein Dauerprozess.
  useEffect(() => {
    if (!inviteCode) return;
    const onActive = () => {
      if (document.visibilityState === "visible") void refreshLobby();
    };
    document.addEventListener("visibilitychange", onActive);
    window.addEventListener("focus", onActive);
    return () => {
      document.removeEventListener("visibilitychange", onActive);
      window.removeEventListener("focus", onActive);
    };
  }, [inviteCode, refreshLobby]);

  // Bin ich der Pool-Sieger und darf (noch) ein Feld verbessern? (M33)
  const amPoolEndgameImprover =
    !!lobby &&
    lobby.poolEndgameEnabled &&
    !lobby.poolEndgameResolved &&
    !!lobby.poolEndgameImproverPlayerId &&
    !!inviteCode &&
    normalizePublicPlayerId(lobby.poolEndgameImproverPlayerId) ===
      normalizePublicPlayerId(getOrCreatePlayerId());

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

  useEffect(() => {
    if (bonusOverlayGame === null) return;
    const timer = window.setTimeout(() => setBonusOverlayGame(null), 2500);
    return () => window.clearTimeout(timer);
  }, [bonusOverlayGame]);

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
      const gameBefore = run.games.find((g) =>
        g.fields.some((f) => f.id === activeFieldId),
      );
      const gameAfter = updated.games.find((g) =>
        g.fields.some((f) => f.id === activeFieldId),
      );
      const bonusJustAchieved =
        !!gameBefore &&
        !!gameAfter &&
        !upperBonusAchieved(gameBefore.fields) &&
        upperBonusAchieved(gameAfter.fields);
      setRun(updated);
      resetEntry();
      setActiveFieldId(null);
      if (allFieldsScored(updated)) {
        setSheetReviewAfterComplete(false);
        setShowCompleteOverlay(true);
      } else if (bonusJustAchieved && getBonusCelebrationEnabled()) {
        setBonusOverlayGame(gameAfter?.index ?? null);
      }
      void refreshLobby();
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
      setBonusOverlayGame(null);
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
      await refreshLobby();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Aktion fehlgeschlagen");
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
    if (amPoolEndgameImprover) {
      const endgameField = run.games
        .flatMap((g) => g.fields)
        .find((f) => f.id === endgameFieldId);
      const endgameGameIndex =
        run.games.find((g) => g.fields.some((f) => f.id === endgameFieldId))?.index ??
        null;
      return (
        <div className="play-board relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
          <PlayTopBar
            inviteCode={inviteCode}
            useStrategyRules={run.useStrategyRules}
            rollsInPool={run.rollsInPool}
            rollsRemaining={run.rollsRemaining}
          />

          <div className="play-endgame-banner shrink-0">
            <p className="play-endgame-banner-title">🎲 Pool-Sieger!</p>
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
        opponentPool={opponentPool}
        showOpponentPoolControl={!!lobby?.showOpponentPool}
        onRefreshOpponentPool={() => void refreshLobby()}
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

      {bonusOverlayGame !== null && !showCompleteOverlay && (
        <BonusOverlay
          gameIndex={run.gameCount > 1 ? bonusOverlayGame : null}
          onClose={() => setBonusOverlayGame(null)}
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
