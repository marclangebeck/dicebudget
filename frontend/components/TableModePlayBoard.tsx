"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatsRatingToggle } from "@/components/StatsRatingToggle";
import { FitScoreSheet } from "@/components/FitScoreSheet";
import { PoolEndgamePanel } from "@/components/PoolEndgamePanel";
import { ScoreEntryPanel } from "@/components/ScoreEntryPanel";
import { ScoreSheetTable } from "@/components/ScoreSheetTable";
import {
  clearLastField,
  completeField,
  finalizeSessionStats,
  finishRun,
  getRun,
  getSessionLobby,
  incrementExtraYatzy,
  resolvePoolEndgame,
} from "@/lib/api";
import { APP_HOME_PATH } from "@/lib/branding";
import { poolDeltaForComplete } from "@/lib/gameRules";
import { upperBonusAchieved } from "@/lib/gameScoring";
import { getBonusCelebrationEnabled } from "@/lib/uiPrefs";
import { allFieldsScored, getLastScoredFieldId } from "@/lib/runUtils";
import {
  loadTableModeSession,
  type TableModePlayer,
  type TableModeSide,
} from "@/lib/tableMode";
import { normalizePublicPlayerId } from "@/lib/playerIdentity";
import type { SessionLobbyDto } from "@/lib/sessionTypes";
import type { FieldDto, RunDto } from "@/lib/types";
import { BonusOverlay } from "@/components/BonusOverlay";

type Props = {
  inviteCode: string;
};

type RunMap = Record<TableModeSide, RunDto | null>;

function defaultRollsUsed(run: RunDto): number {
  return run.useStrategyRules ? 3 : 1;
}

function playerCardClass(side: TableModeSide, activeSide: TableModeSide | null): string {
  return side === activeSide ? "play-table-player play-table-player--active" : "play-table-player";
}

export function TableModePlayBoard({ inviteCode }: Props) {
  const router = useRouter();
  const [players, setPlayers] = useState<[TableModePlayer, TableModePlayer] | null>(null);
  const [runs, setRuns] = useState<RunMap>({ left: null, right: null });
  const [lobby, setLobby] = useState<SessionLobbyDto | null>(null);
  const [activeSide, setActiveSide] = useState<TableModeSide | null>(null);
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [scoreInput, setScoreInput] = useState("");
  const [rollsUsed, setRollsUsed] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endgameFieldId, setEndgameFieldId] = useState<string | null>(null);
  const [endgameScoreInput, setEndgameScoreInput] = useState("");
  const [bonusOverlay, setBonusOverlay] = useState<{
    side: TableModeSide;
    gameIndex: number | null;
  } | null>(null);
  const [yatzyDieValue, setYatzyDieValue] = useState<number | null>(null);
  const [includeInStats, setIncludeInStats] = useState(true);
  const [leavingHome, setLeavingHome] = useState(false);

  const load = useCallback(async () => {
    const stored = loadTableModeSession(inviteCode);
    if (!stored) {
      setPlayers(null);
      setError("Für diesen Raum ist auf diesem Gerät kein iPad-Tischmodus gespeichert.");
      return;
    }
    setPlayers(stored.players);
    const [leftRun, rightRun, lobbyResult] = await Promise.all([
      getRun(stored.players[0].runId, stored.players[0].playerSecret),
      getRun(stored.players[1].runId, stored.players[1].playerSecret),
      getSessionLobby(inviteCode),
    ]);
    setRuns({ left: leftRun.run, right: rightRun.run });
    setLobby(lobbyResult.session);
  }, [inviteCode]);

  useEffect(() => {
    void load().catch((e) =>
      setError(e instanceof Error ? e.message : "Tischspiel konnte nicht geladen werden"),
    );
  }, [load]);

  useEffect(() => {
    if (!bonusOverlay) return;
    const timer = window.setTimeout(() => setBonusOverlay(null), 2500);
    return () => window.clearTimeout(timer);
  }, [bonusOverlay]);

  const activeRun = activeSide ? runs[activeSide] : null;
  const activePlayer = useMemo(
    () => players?.find((p) => p.side === activeSide) ?? null,
    [players, activeSide],
  );
  const activeField: FieldDto | undefined = activeRun?.games
    .flatMap((g) => g.fields)
    .find((f) => f.id === activeFieldId);
  const activeGameIndex =
    activeRun?.games.find((g) => g.fields.some((f) => f.id === activeFieldId))?.index ?? null;
  const isCorrection = !!activeField && activeField.score !== null;
  const canClearLast =
    !!activeField &&
    !!activeRun &&
    isCorrection &&
    activeField.id === getLastScoredFieldId(activeRun);
  const showEntryPanel = !!activeRun && !!activeField;

  const endgamePlayer =
    lobby?.poolEndgameImproverPlayerId && players
      ? players.find(
          (p) =>
            normalizePublicPlayerId(p.playerId) ===
            normalizePublicPlayerId(lobby.poolEndgameImproverPlayerId ?? ""),
        ) ?? null
      : null;
  const endgameSide = endgamePlayer?.side ?? null;
  const endgameRun = endgameSide ? runs[endgameSide] : null;
  const endgameField: FieldDto | undefined = endgameRun?.games
    .flatMap((g) => g.fields)
    .find((f) => f.id === endgameFieldId);
  const endgameGameIndex =
    endgameRun?.games.find((g) => g.fields.some((f) => f.id === endgameFieldId))?.index ??
    null;
  const poolEndgamePending =
    !!lobby?.poolEndgameEnabled && !lobby.poolEndgameResolved && !!endgamePlayer;

  const rollsInPoolForEntry =
    isCorrection && activeField && activeRun?.useStrategyRules
      ? (() => {
          const oldDelta = poolDeltaForComplete(activeField.rollsUsed, true);
          return activeRun.rollsInPool + oldDelta.poolCost - oldDelta.spareToPool;
        })()
      : activeRun?.rollsInPool;

  function resetEntry() {
    setActiveSide(null);
    setActiveFieldId(null);
    setScoreInput("");
    setRollsUsed(null);
    setYatzyDieValue(null);
  }

  function selectField(side: TableModeSide, fieldId: string) {
    const run = runs[side];
    if (!run || run.status !== "ACTIVE") return;
    const field = run.games.flatMap((g) => g.fields).find((f) => f.id === fieldId);
    if (!field) return;
    setActiveSide(side);
    setActiveFieldId(fieldId);
    if (field.score !== null) {
      setScoreInput(String(field.score));
      setRollsUsed(run.useStrategyRules ? field.rollsUsed : 1);
      return;
    }
    setScoreInput("");
    setRollsUsed(defaultRollsUsed(run));
  }

  function selectEndgameField(side: TableModeSide, fieldId: string) {
    if (side !== endgameSide) return;
    const run = runs[side];
    const field = run?.games.flatMap((g) => g.fields).find((f) => f.id === fieldId);
    if (!field || field.score === null) return;
    setEndgameFieldId(fieldId);
    setEndgameScoreInput(String(field.score));
  }

  async function refreshAfterChange(side: TableModeSide, updated: RunDto) {
    setRuns((current) => ({ ...current, [side]: updated }));
    const { session } = await getSessionLobby(inviteCode);
    setLobby(session);
  }

  async function handleSubmit() {
    if (!activeSide || !activePlayer || !activeRun || !activeFieldId || scoreInput === "") return;
    const effectiveRolls = activeRun.useStrategyRules ? (rollsUsed ?? 0) : (rollsUsed ?? 1);
    if (activeRun.useStrategyRules && rollsUsed === null) return;
    if (effectiveRolls < 1) return;
    const score = Number(scoreInput);
    if (Number.isNaN(score)) return;
    const activeFieldType = activeRun.games
      .flatMap((g) => g.fields)
      .find((f) => f.id === activeFieldId)?.fieldType;
    const needsYatzyDie = activeFieldType === "KNIFFEL" && score === 50;
    if (needsYatzyDie && yatzyDieValue === null) return;
    const yatzyArg = needsYatzyDie ? yatzyDieValue! : undefined;

    setBusy(true);
    setError(null);
    try {
      const gameBefore = activeRun.games.find((g) =>
        g.fields.some((f) => f.id === activeFieldId),
      );
      const { run: updated } = await completeField(
        activeRun.id,
        activeFieldId,
        score,
        effectiveRolls,
        activePlayer.playerSecret,
        yatzyArg,
      );
      const gameAfter = updated.games.find((g) =>
        g.fields.some((f) => f.id === activeFieldId),
      );
      const bonusJustAchieved =
        !!gameBefore &&
        !!gameAfter &&
        !upperBonusAchieved(gameBefore.fields) &&
        upperBonusAchieved(gameAfter.fields);
      await refreshAfterChange(activeSide, updated);
      if (bonusJustAchieved && getBonusCelebrationEnabled()) {
        setBonusOverlay({
          side: activeSide,
          gameIndex: updated.gameCount > 1 ? gameAfter?.index ?? null : null,
        });
      }
      resetEntry();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Eintrag fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleClearLast() {
    if (!activeSide || !activePlayer || !activeRun || !activeFieldId) return;
    setBusy(true);
    setError(null);
    try {
      const { run: updated } = await clearLastField(
        activeRun.id,
        activeFieldId,
        activePlayer.playerSecret,
      );
      await refreshAfterChange(activeSide, updated);
      resetEntry();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Löschen fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleExtraYatzy(side: TableModeSide) {
    const player = players?.find((p) => p.side === side);
    const run = runs[side];
    if (!player || !run || run.status !== "ACTIVE") return;
    setBusy(true);
    setError(null);
    try {
      const { run: updated } = await incrementExtraYatzy(run.id, player.playerSecret);
      await refreshAfterChange(side, updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zusatz-Yatzy fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleFinish(side: TableModeSide) {
    const player = players?.find((p) => p.side === side);
    const run = runs[side];
    if (!player || !run) return;
    setBusy(true);
    setError(null);
    try {
      const { run: updated } = await finishRun(run.id, player.playerSecret);
      await refreshAfterChange(side, updated);
      if (activeSide === side) resetEntry();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Abschluss fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function refreshAllRuns(currentPlayers = players) {
    if (!currentPlayers) return;
    const [leftRun, rightRun, lobbyResult] = await Promise.all([
      getRun(currentPlayers[0].runId, currentPlayers[0].playerSecret),
      getRun(currentPlayers[1].runId, currentPlayers[1].playerSecret),
      getSessionLobby(inviteCode),
    ]);
    setRuns({ left: leftRun.run, right: rightRun.run });
    setLobby(lobbyResult.session);
  }

  async function handleEndgameSubmit() {
    if (!endgamePlayer || !endgameFieldId || endgameScoreInput === "") return;
    const score = Number(endgameScoreInput);
    if (Number.isNaN(score)) return;
    setBusy(true);
    setError(null);
    try {
      await resolvePoolEndgame(
        inviteCode,
        { fieldId: endgameFieldId, score },
        endgamePlayer.playerSecret,
      );
      setEndgameFieldId(null);
      setEndgameScoreInput("");
      await refreshAllRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pool-Endspiel fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  async function handleEndgameKeep() {
    if (!endgamePlayer) return;
    setBusy(true);
    setError(null);
    try {
      await resolvePoolEndgame(inviteCode, { keep: true }, endgamePlayer.playerSecret);
      setEndgameFieldId(null);
      setEndgameScoreInput("");
      await refreshAllRuns();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Pool-Endspiel fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  if (!players) {
    return (
      <div className="play-message-card">
        <p className="text-secondary text-sm">
          {error ?? "Lade iPad-Tischmodus …"}
        </p>
        <Link href="/multi" className="play-top-link mt-3 inline-block">
          Raum erstellen
        </Link>
      </div>
    );
  }

  const allFinished = players.every((p) => runs[p.side]?.status === "FINISHED");
  const sessionFinished = allFinished && !poolEndgamePending;

  return (
    <div className="play-table-mode relative flex min-h-0 flex-1 flex-col gap-1.5 overflow-hidden">
      <div className="play-table-mode-header">
        <div>
          <p className="play-table-mode-kicker">iPad-Tischmodus · Code {inviteCode}</p>
          <p className="play-table-mode-title">
            Zwei Zettel auf einem iPad im Querformat
            {lobby ? ` · Runde ${lobby.roundNumber}` : ""}
          </p>
        </div>
        <Link href={APP_HOME_PATH} className="play-top-link">
          Start
        </Link>
      </div>

      <div className="play-table-mode-needs-landscape">
        Bitte drehe das iPad ins Querformat. Der normale iPhone-Spielmodus bleibt unverändert.
      </div>

      {error && <p className="glass-alert-error shrink-0 px-3 py-2 text-sm">{error}</p>}

      {poolEndgamePending && endgamePlayer && (
        <div className="play-endgame-banner shrink-0">
          <p className="play-endgame-banner-title">Pool-Endspiel: {endgamePlayer.label}</p>
          <p className="play-endgame-banner-text">
            {endgamePlayer.label} hatte den größten Wurf-Pool und darf ein Feld verbessern
            oder den alten Wert behalten.
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
      )}

      <div className="play-table-mode-grid">
        {players.map((player) => {
          const run = runs[player.side];
          const completed = !!run && allFieldsScored(run);
          return (
            <section
              key={player.side}
              className={playerCardClass(player.side, activeSide)}
            >
              <div className="play-table-player-head">
                <div>
                  <p className="play-table-player-label">{player.label}</p>
                  {run && (
                    <p className="play-table-player-meta tabular-nums">
                      {run.status === "FINISHED"
                        ? `${run.totalScore} Punkte · fertig`
                        : run.useStrategyRules
                          ? `Pool ${run.rollsInPool}`
                          : "Klassisch"}
                    </p>
                  )}
                </div>
                {completed && run?.status !== "FINISHED" && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleFinish(player.side)}
                    className="play-table-finish-btn disabled:opacity-50"
                  >
                    {busy ? "…" : "Ergebnis"}
                  </button>
                )}
              </div>
              <div className="play-table-sheet-wrap">
                {run ? (
                  <FitScoreSheet
                    layoutKey={`${player.side}-${run.gameCount}-${run.status}-${activeSide === player.side ? activeFieldId ?? "active" : "idle"}`}
                  >
                    <ScoreSheetTable
                      run={run}
                      activeFieldId={
                        endgameSide === player.side && endgameFieldId
                          ? endgameFieldId
                          : activeSide === player.side
                            ? activeFieldId
                            : null
                      }
                      onSelectField={(fieldId) =>
                        poolEndgamePending
                          ? selectEndgameField(player.side, fieldId)
                          : selectField(player.side, fieldId)
                      }
                      onIncrementExtraYatzy={() => void handleExtraYatzy(player.side)}
                      extraYatzyBusy={busy}
                      allowSelectWhenFinished={poolEndgamePending && endgameSide === player.side}
                    />
                  </FitScoreSheet>
                ) : (
                  <p className="play-empty-state">Lade Zettel …</p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {sessionFinished && (
        <div className="play-table-finish-footer shrink-0">
          <p className="text-muted mb-2 text-center text-xs">Paarungs-Statistik</p>
          <StatsRatingToggle
            includeInStats={includeInStats}
            onChange={setIncludeInStats}
            disabled={leavingHome}
          />
          <button
            type="button"
            disabled={leavingHome}
            onClick={() => {
              const stored = loadTableModeSession(inviteCode);
              if (!stored) {
                router.push(APP_HOME_PATH);
                return;
              }
              setLeavingHome(true);
              void finalizeSessionStats(
                inviteCode,
                includeInStats,
                stored.players[0].playerSecret,
              )
                .then(() => router.push(APP_HOME_PATH))
                .catch((e) =>
                  setError(e instanceof Error ? e.message : "Statistik-Speicherung fehlgeschlagen"),
                )
                .finally(() => setLeavingHome(false));
            }}
            className="play-table-ranking-link mt-3 disabled:opacity-50"
          >
            {leavingHome ? "Speichere …" : "Spiel beenden und zur Startseite"}
          </button>
        </div>
      )}

      {bonusOverlay && (
        <BonusOverlay
          gameIndex={bonusOverlay.gameIndex}
          onClose={() => setBonusOverlay(null)}
        />
      )}

      {showEntryPanel && activeRun && activeField && (
        <ScoreEntryPanel
          id="score-entry-panel"
          run={activeRun}
          gameIndex={activeGameIndex}
          field={activeField}
          scoreInput={scoreInput}
          rollsUsed={rollsUsed}
          busy={busy}
          isCorrection={isCorrection}
          canClearLast={canClearLast}
          rollsInPoolOverride={rollsInPoolForEntry}
          onPickScoreValue={(v) => {
            setScoreInput(String(v));
            if (v !== 50) setYatzyDieValue(null);
          }}
          yatzyDieValue={yatzyDieValue}
          onYatzyDieValue={setYatzyDieValue}
          onRollsUsed={setRollsUsed}
          onSubmit={() => void handleSubmit()}
          onClearLast={() => void handleClearLast()}
          onCancel={resetEntry}
        />
      )}

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
