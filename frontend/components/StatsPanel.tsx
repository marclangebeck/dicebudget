"use client";

import { useEffect, useState } from "react";
import { getStats } from "@/lib/api";
import type { StatsDto } from "@/lib/statsTypes";

type Props = {
  compact?: boolean;
};

export function StatsPanel({ compact = false }: Props) {
  const [stats, setStats] = useState<StatsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getStats()
      .then(({ stats: data }) => setStats(data))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Statistiken nicht geladen"),
      );
  }, []);

  return (
    <section
      className={`glass-panel flex min-h-0 flex-col ${compact ? "shrink gap-2 p-3" : "gap-3 p-4"}`}
    >
      <h2 className="text-secondary text-center text-sm font-semibold">Bestes Gesamtergebnis</h2>

      {error && <p className="glass-alert-error text-sm">{error}</p>}

      {!stats && !error && <p className="text-muted text-sm">Lade …</p>}

      {stats && stats.finishedRuns === 0 && (
        <p className={`text-muted ${compact ? "text-xs" : "text-sm"}`}>
          {compact
            ? "Noch kein abgeschlossener Lauf."
            : "Noch kein abgeschlossener Lauf. Spiele alle Felder aus – dann erscheint hier dein bestes Gesamtergebnis."}
        </p>
      )}

      {stats && stats.finishedRuns > 0 && stats.bestTotalScore !== null && (
        <div
          className={`glass-stat-highlight text-center ${compact ? "px-3 py-3" : "px-4 py-5"}`}
        >
          <p
            className={`font-bold tabular-nums tracking-tight text-emerald-900 ${compact ? "text-3xl" : "text-4xl"}`}
          >
            {stats.bestTotalScore}
          </p>
        </div>
      )}
    </section>
  );
}
