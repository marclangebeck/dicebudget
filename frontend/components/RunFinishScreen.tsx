"use client";

import Link from "next/link";
import { useEffect } from "react";
import { BackToHome } from "@/components/BackToHome";
import { clearActiveGame } from "@/lib/activeGame";
import { runHasOpenFields } from "@/lib/runUtils";
import type { RunDto } from "@/lib/types";

type Props = {
  run: RunDto;
  inviteCode?: string | null;
};

export function RunFinishScreen({ run, inviteCode }: Props) {
  useEffect(() => {
    clearActiveGame();
  }, []);

  const abandoned = runHasOpenFields(run);
  const maxRolls = run.useStrategyRules ? run.gameCount * 39 : null;
  const finishedLabel = run.finishedAt
    ? new Date(run.finishedAt).toLocaleString("de-DE", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <section id="run-finish-screen" className="play-finish-card px-4 py-5 text-center">
      <p className="text-accent text-sm font-semibold">
        {abandoned ? "Spiel beendet (vorzeitig)" : "Run abgeschlossen"}
      </p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-emerald-900 md:text-5xl">
        {run.totalScore}
      </p>
      <p className="text-muted mt-1 text-xs">
        Gesamtpunkte · {run.gameCount} {run.gameCount === 1 ? "Spiel" : "Spiele"}
      </p>
      {finishedLabel && <p className="text-subtle mt-1 text-[11px]">{finishedLabel}</p>}

      <ul className="mt-6 space-y-1.5 text-left">
        {run.games.map((game) => (
          <li
            key={game.id}
            className="play-finish-game-row flex items-center justify-between px-3 py-2 text-sm"
          >
            <span className="text-muted">Sp{game.index}</span>
            <span className="text-strong font-semibold tabular-nums">
              {game.summary.gameTotal}
            </span>
          </li>
        ))}
      </ul>

      {run.useStrategyRules && maxRolls !== null && run.rollsRemaining !== null && (
        <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-emerald-800/20 pt-4 text-xs">
          <div>
            <dt className="text-muted">Würfe genutzt</dt>
            <dd className="text-strong mt-0.5 font-semibold tabular-nums">
              {run.totalRollsUsed}
              <span className="text-muted"> / {maxRolls}</span>
            </dd>
          </div>
          <div>
            <dt className="text-muted">Im Pool</dt>
            <dd className="text-strong mt-0.5 font-semibold tabular-nums">{run.rollsInPool}</dd>
          </div>
          <div>
            <dt className="text-muted">Übrig</dt>
            <dd className="text-strong mt-0.5 font-semibold tabular-nums">{run.rollsRemaining}</dd>
          </div>
        </dl>
      )}

      <div className="mt-4 flex flex-col gap-2">
        <BackToHome className="btn-primary !w-full justify-center" />
        {inviteCode && (
          <Link
            href={`/multi/join?code=${encodeURIComponent(inviteCode)}`}
            className="btn-secondary inline-flex min-h-10 items-center justify-center px-6 text-sm"
          >
            Lobby & Rangliste
          </Link>
        )}
      </div>
    </section>
  );
}
