"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { abandonRun, getRun } from "@/lib/api";
import { clearActiveGame, loadActiveGame, playPath, type ActiveGameState } from "@/lib/activeGame";
import { ABANDON_RUN_CONFIRM } from "@/lib/runUtils";

type Props = {
  variant?: "default" | "bento";
};

export function ResumeActiveGame({ variant = "default" }: Props) {
  const [game, setGame] = useState<ActiveGameState | null>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = loadActiveGame();
    if (!stored) return;

    void (async () => {
      try {
        const secret = stored.type === "multi" ? stored.playerSecret : undefined;
        const { run } = await getRun(stored.runId, secret);
        if (run.status !== "ACTIVE") {
          clearActiveGame();
          return;
        }
        setGame(stored);
        const mode =
          stored.type === "multi"
            ? `Multiplayer · Code ${stored.inviteCode}`
            : "Einzelspieler";
        setLabel(`${mode} · ${run.gameCount} ${run.gameCount === 1 ? "Spiel" : "Spiele"}`);
      } catch {
        clearActiveGame();
      }
    })();
  }, []);

  async function handleAbandon() {
    if (!game || !window.confirm(ABANDON_RUN_CONFIRM)) return;
    setBusy(true);
    try {
      const secret = game.type === "multi" ? game.playerSecret : undefined;
      await abandonRun(game.runId, secret);
      clearActiveGame();
      setGame(null);
      setLabel(null);
    } catch {
      clearActiveGame();
      setGame(null);
      setLabel(null);
    } finally {
      setBusy(false);
    }
  }

  if (!game || !label) return null;

  const compact = variant === "bento";

  return (
    <div
      className={
        compact
          ? "home-bento-resume shrink-0 px-3 py-2.5"
          : "glass-panel-amber px-4 py-4"
      }
    >
      <p
        className={
          compact
            ? "text-xs font-semibold text-amber-900"
            : "text-sm font-semibold text-amber-900"
        }
      >
        Laufendes Spiel
      </p>
      <p className="text-muted mt-0.5 text-[11px]">{label}</p>
      <div
        className={
          compact
            ? "mt-2 flex gap-2"
            : "mt-3 flex flex-col gap-2 sm:flex-row"
        }
      >
        <Link
          href={playPath(game)}
          className={`btn-primary inline-flex flex-1 items-center justify-center px-3 text-sm ${
            compact ? "min-h-9" : "min-h-10 px-4"
          }`}
        >
          Fortsetzen
        </Link>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleAbandon()}
          className={`btn-secondary inline-flex flex-1 items-center justify-center px-3 text-sm disabled:opacity-50 ${
            compact ? "min-h-9" : "min-h-10 px-4"
          }`}
        >
          {busy ? "…" : "Spiel beenden"}
        </button>
      </div>
    </div>
  );
}
