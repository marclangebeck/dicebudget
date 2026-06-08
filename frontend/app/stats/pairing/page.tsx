"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPairingDetail, getPairingSummaries } from "@/lib/api";
import type { PairingDetailDto, PairingSummaryDto } from "@/lib/pairingTypes";
import {
  isMergedPairingKey,
  mergePairingDetails,
  mergePairingSummaries,
  type MergedPairingSummary,
} from "@/lib/pairingMerge";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { ShareActionBar } from "@/components/ShareActionBar";
import { getOrCreatePlayerId, normalizePublicPlayerId, playerLabel } from "@/lib/playerIdentity";
import { loadPlayerAliases, setPlayerAlias, type PlayerAliasMap } from "@/lib/playerAliases";
import { PlayerAliasOverlay } from "@/components/PlayerAliasOverlay";
import { PairingEditOverlay } from "@/components/PairingEditOverlay";
import {
  buildPairingShareText,
  renderPairingShareImage,
  type PairingShareParams,
} from "@/lib/matchResultShare";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("de-DE", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function winnerLabel(
  round: PairingDetailDto["rounds"][number],
  pairing: PairingDetailDto,
  ownPlayerId: string,
  aliases: PlayerAliasMap,
): string {
  if (round.winner === "tie") return "Remis";
  if (round.winner === "A") return playerLabel(pairing.playerA, ownPlayerId, aliases);
  return playerLabel(pairing.playerB, ownPlayerId, aliases);
}

function PairingDetailInner() {
  const searchParams = useSearchParams();
  const key = (searchParams.get("key") ?? "").trim();

  const [pairing, setPairing] = useState<PairingDetailDto | null>(null);
  const [group, setGroup] = useState<MergedPairingSummary | null>(null);
  const [sourceSummaries, setSourceSummaries] = useState<PairingSummaryDto[]>([]);
  const [ownPlayerId, setOwnPlayerId] = useState("");
  const [aliases, setAliases] = useState<PlayerAliasMap>({});
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [editingPairing, setEditingPairing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      setError("Keine Paarung ausgewählt.");
      return;
    }

    const own = getOrCreatePlayerId();
    const al = loadPlayerAliases();
    setOwnPlayerId(own);
    setAliases(al);

    setLoading(true);
    setError(null);

    const load = async () => {
      // Zusammengeführte Gruppe (Alias-gleiche Personen) auflösen.
      const { pairings } = await getPairingSummaries();
      const mergedList = mergePairingSummaries(pairings, al, own);
      const matched = isMergedPairingKey(key)
        ? mergedList.find((m) => m.key === key)
        : mergedList.find((m) => m.sourceKeys.includes(key));
      if (!matched) throw new Error("Paarung nicht gefunden");
      const sources = pairings.filter((p) => matched.sourceKeys.includes(p.key));
      const details = await Promise.all(
        matched.sourceKeys.map((k) => getPairingDetail(k).then((r) => r.pairing)),
      );
      const merged = mergePairingDetails(details, al, own);
      if (!merged) throw new Error("Paarung nicht gefunden");
      return { detail: merged, matched, sources };
    };

    void load()
      .then(({ detail, matched, sources }) => {
        setPairing(detail);
        setGroup(matched);
        setSourceSummaries(sources);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Paarung nicht geladen"),
      )
      .finally(() => setLoading(false));
  }, [key, reloadToken]);

  if (!key) {
    return (
      <div className="stats-screen flex flex-col gap-3">
        <AppScreenHeader section="Statistik" title="Paarung" />
        <p className="stats-empty-state">
          Keine Paarung ausgewählt.{" "}
          <Link href="/stats" className="text-link">
            Zur Übersicht
          </Link>
        </p>
      </div>
    );
  }

  const headerTitle =
    pairing != null
      ? `${playerLabel(pairing.playerA, ownPlayerId, aliases)} vs. ${playerLabel(pairing.playerB, ownPlayerId, aliases)}`
      : "Paarung";

  const headerSubtitle =
    pairing != null
      ? [
          `Siege ${pairing.playerAWins}:${pairing.playerBWins}`,
          pairing.ties > 0 ? `${pairing.ties} Remis` : null,
          pairing.roundsPlayed > 0
            ? `${pairing.roundsPlayed} ${pairing.roundsPlayed === 1 ? "Runde" : "Runden"} gesamt`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;

  const netDiff = pairing ? pairing.playerABonusPoints - pairing.playerBBonusPoints : 0;

  const pairingShareParams: PairingShareParams | null = pairing
    ? {
        playerAName: playerLabel(pairing.playerA, ownPlayerId, aliases),
        playerBName: playerLabel(pairing.playerB, ownPlayerId, aliases),
        playerAWins: pairing.playerAWins,
        playerBWins: pairing.playerBWins,
        ties: pairing.ties,
        roundsPlayed: pairing.roundsPlayed,
      }
    : null;

  const buildPairingShare = () =>
    pairingShareParams ? buildPairingShareText(pairingShareParams) : "";
  const renderPairingShare = () => {
    if (!pairingShareParams) throw new Error("Paarung nicht geladen");
    return renderPairingShareImage(pairingShareParams);
  };

  return (
    <div className="stats-screen flex flex-col gap-3 pb-2">
      <AppScreenHeader
        section="Statistik"
        title={headerTitle}
        subtitle={headerSubtitle}
      />

      {error && <p className="glass-alert-error px-3 py-2 text-sm">{error}</p>}
      {loading && !error && <p className="stats-empty-state">Lade …</p>}

      {pairing && (
        <>
          {group && (
            <div className="flex justify-end">
              <button
                type="button"
                className="btn-chip px-3 py-1 text-xs"
                onClick={() => setEditingPairing(true)}
              >
                ✏️ Paarung bearbeiten
              </button>
            </div>
          )}

          <section className="stats-detail-scores">
            <div className="stats-detail-player-card">
              <p className="stats-detail-player-name">
                {playerLabel(pairing.playerA, ownPlayerId, aliases)}
              </p>
              <button
                type="button"
                className="btn-chip mt-2 px-2 py-0.5 text-xs"
                onClick={() => setEditingPlayerId(pairing.playerA)}
              >
                ✏️ Alias
              </button>
              <p className="stats-detail-wins tabular-nums">{pairing.playerAWins}</p>
              <p className="stats-detail-metric-label">Siege</p>
              <p className="stats-detail-diff tabular-nums">
                {netDiff > 0 ? `+${netDiff} Differenz` : "\u00a0"}
              </p>
            </div>
            <div className="stats-detail-player-card stats-detail-player-card--b">
              <p className="stats-detail-player-name">
                {playerLabel(pairing.playerB, ownPlayerId, aliases)}
              </p>
              <button
                type="button"
                className="btn-chip mt-2 px-2 py-0.5 text-xs"
                onClick={() => setEditingPlayerId(pairing.playerB)}
              >
                ✏️ Alias
              </button>
              <p className="stats-detail-wins tabular-nums">{pairing.playerBWins}</p>
              <p className="stats-detail-metric-label">Siege</p>
              <p className="stats-detail-diff tabular-nums">
                {netDiff < 0 ? `+${-netDiff} Differenz` : "\u00a0"}
              </p>
            </div>
          </section>

          {pairingShareParams && (
            <ShareActionBar
              label="Bilanz teilen"
              shareSuffix="Paarung"
              filename="dicebudget-paarung.png"
              buildText={buildPairingShare}
              buildImage={renderPairingShare}
              prominent
            />
          )}

          <section>
            <h2 className="stats-section-title">
              Runden in der App
              <span className="text-muted font-normal"> ({pairing.appRoundsPlayed})</span>
            </h2>
            {pairing.appRoundsPlayed === 0 ? (
              <p className="stats-empty-state stats-empty-state--inline">
                Noch keine App-Runden vorhanden.
              </p>
            ) : (
              <ul className="stats-round-list">
                {pairing.rounds.map((round, index) => (
                  <li key={`${round.inviteCode}-${round.roundNumber}-${round.finishedAt ?? index}`}>
                    <Link
                      href={`/stats/match-analysis?invite=${encodeURIComponent(round.inviteCode)}&key=${encodeURIComponent(key)}&perspective=${encodeURIComponent(ownPlayerId)}`}
                      className="stats-round-card stats-round-card--link block no-underline"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-strong text-sm font-semibold">
                            Serie {round.leagueCode} · Runde {round.roundNumber}
                          </p>
                          <p className="text-muted mt-0.5 text-xs">
                            {formatDateTime(round.finishedAt)}
                          </p>
                        </div>
                        <p className="text-accent shrink-0 text-right text-xs font-semibold">
                          {winnerLabel(round, pairing, ownPlayerId, aliases)}
                          {round.winner !== "tie" && (
                            <span className="text-muted block font-normal tabular-nums">
                              +{round.scoreDiff}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="stats-round-scores tabular-nums">
                        <span
                          className={
                            round.winner === "A" ? "text-strong font-semibold" : "text-muted"
                          }
                        >
                          {playerLabel(pairing.playerA, ownPlayerId, aliases)}: {round.playerAScore}
                        </span>
                        <span
                          className={
                            round.winner === "B" ? "text-strong font-semibold" : "text-muted"
                          }
                        >
                          {playerLabel(pairing.playerB, ownPlayerId, aliases)}: {round.playerBScore}
                        </span>
                      </div>
                      <p className="text-muted mt-2 text-[11px]">Spielanalyse ansehen →</p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      {editingPlayerId && (
        <PlayerAliasOverlay
          playerId={editingPlayerId}
          ownPlayerId={ownPlayerId}
          aliases={aliases}
          currentAlias={aliases[normalizePublicPlayerId(editingPlayerId)]}
          onClose={() => setEditingPlayerId(null)}
          onSave={(alias) => {
            setAliases(setPlayerAlias(editingPlayerId, alias));
            setEditingPlayerId(null);
          }}
        />
      )}

      {editingPairing && group && (
        <PairingEditOverlay
          merged={group}
          sourceSummaries={sourceSummaries}
          ownPlayerId={ownPlayerId}
          aliases={aliases}
          onClose={() => setEditingPairing(false)}
          onSaved={() => {
            setEditingPairing(false);
            setReloadToken((t) => t + 1);
          }}
        />
      )}
    </div>
  );
}

export default function PairingDetailPage() {
  return (
    <Suspense fallback={<p className="stats-empty-state">Lade …</p>}>
      <PairingDetailInner />
    </Suspense>
  );
}
