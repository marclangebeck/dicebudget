"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BonusCelebrationToggle } from "@/components/BonusCelebrationToggle";
import { StrategyModeToggle } from "@/components/StrategyModeToggle";
import { saveActiveGame } from "@/lib/activeGame";
import { createLocalSoloRun } from "@/lib/localSoloRun";

export function GameSetup() {
  const router = useRouter();
  const [gameCount, setGameCount] = useState(3);
  const [useStrategyRules, setUseStrategyRules] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const run = createLocalSoloRun(gameCount, useStrategyRules);
      saveActiveGame({ type: "solo", runId: run.id });
      router.push(`/play?runId=${run.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Start fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void handleStart();
      }}
      className="setup-host-form"
    >
      <div className="setup-host-card setup-host-card--mode">
        <StrategyModeToggle
          useStrategyRules={useStrategyRules}
          onChange={setUseStrategyRules}
          disabled={loading}
          variant="setup"
        />
      </div>

      <div className="setup-host-card setup-host-card--mode">
        <BonusCelebrationToggle disabled={loading} />
      </div>

      <label className="setup-slider-card setup-slider-card--sky setup-slider-card--wide">
        <span className="setup-slider-label">Spielanzahl</span>
        <span className="setup-slider-value tabular-nums">{gameCount}</span>
        <span className="setup-slider-hint">
          {gameCount === 1 ? "Spiel" : "Spiele"} · {gameCount * 13} Felder
          {useStrategyRules ? (
            <>
              <br />
              max. {gameCount * 39} Würfe (Strategy Edition)
            </>
          ) : (
            <>
              <br />
              DiceBudget Klassisch
            </>
          )}
        </span>
        <input
          type="range"
          min={1}
          max={6}
          value={gameCount}
          disabled={loading}
          onChange={(e) => setGameCount(Number(e.target.value))}
          className="setup-host-range"
        />
      </label>

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="setup-host-submit setup-host-submit--sky w-full disabled:opacity-50"
      >
        {loading ? "Starte …" : "Neues Spiel starten"}
      </button>
    </form>
  );
}
