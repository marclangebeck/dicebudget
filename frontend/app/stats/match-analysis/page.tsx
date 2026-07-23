"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { MatchAnalysisView } from "@/components/MatchAnalysisView";
import { getSessionMatchAnalysis } from "@/lib/api";
import { loadActiveGame } from "@/lib/activeGame";
import { loadDisplayNames } from "@/lib/rivalProfiles";
import type { SessionMatchAnalysisDto } from "@/lib/matchAnalysisTypes";
import { getOrCreatePlayerId } from "@/lib/playerIdentity";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MatchAnalysisInner() {
  const searchParams = useSearchParams();
  const invite = (searchParams.get("invite") ?? "").trim().toUpperCase();
  const pairingKey = (searchParams.get("key") ?? "").trim();
  const perspectiveParam = (searchParams.get("perspective") ?? "").trim();

  const [analysis, setAnalysis] = useState<SessionMatchAnalysisDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!invite) {
      setLoading(false);
      setError("Kein Spielcode angegeben.");
      return;
    }

    const viewerId = perspectiveParam || getOrCreatePlayerId();
    const stored = loadActiveGame();
    const playerSecret =
      stored?.type === "multi" && stored.inviteCode.toUpperCase() === invite
        ? stored.playerSecret
        : undefined;
    setLoading(true);
    setError(null);
    void getSessionMatchAnalysis(invite, viewerId, playerSecret)
      .then(({ analysis: data }) => setAnalysis(data))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Analyse konnte nicht geladen werden."),
      )
      .finally(() => setLoading(false));
  }, [invite, perspectiveParam]);

  const backHref = pairingKey
    ? `/stats?pairing=${encodeURIComponent(pairingKey)}`
    : "/stats";

  return (
    <div className="stats-screen flex flex-col gap-3 pb-2">
      <Link href={backHref} className="play-top-link text-sm no-underline">
        ← Zurück
      </Link>
      <AppScreenHeader section="Statistik" title="Spielanalyse" />

      {loading && <p className="stats-empty-state">Lade Analyse …</p>}
      {!loading && error && (
        <p className="stats-empty-state stats-empty-state--error">{error}</p>
      )}
      {!loading && analysis && (
        <MatchAnalysisView
          analysis={analysis}
          ownPlayerId={perspectiveParam || getOrCreatePlayerId()}
          aliases={loadDisplayNames()}
          subtitle={
            analysis.finishedAt
              ? `Gespielt am ${formatDateTime(analysis.finishedAt)}`
              : null
          }
        />
      )}
      {!loading && !error && !analysis && (
        <p className="stats-empty-state">Keine Analyse verfügbar.</p>
      )}
    </div>
  );
}

export default function MatchAnalysisPage() {
  return (
    <Suspense fallback={<p className="stats-empty-state">Lade …</p>}>
      <MatchAnalysisInner />
    </Suspense>
  );
}
