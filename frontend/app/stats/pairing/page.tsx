"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getPairingDetail, getPairingSummaries } from "@/lib/api";
import type { PairingDetailDto } from "@/lib/pairingTypes";
import {
  isMergedPairingKey,
  mergePairingDetails,
  mergePairingSummaries,
} from "@/lib/pairingMerge";
import { AppScreenHeader } from "@/components/AppScreenHeader";
import { getOrCreatePlayerId, normalizePublicPlayerId, playerLabel } from "@/lib/playerIdentity";
import { loadPlayerAliases, setPlayerAlias, type PlayerAliasMap } from "@/lib/playerAliases";
import { PlayerAliasOverlay } from "@/components/PlayerAliasOverlay";

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
  const [ownPlayerId, setOwnPlayerId] = useState("");
  const [aliases, setAliases] = useState<PlayerAliasMap>({});
  const [editingPlayerId, setEditingPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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

    const loadMerged = async () => {
      // Quell-Paarungen der zusammengeführten Gruppe ermitteln und kombinieren.
      const { pairings } = await getPairingSummaries();
      const group = mergePairingSummaries(pairings, al, own).find(
        (m) => m.key === key,
      );
      if (!group) throw new Error("Paarung nicht gefunden");
      const details = await Promise.all(
        group.sourceKeys.map((k) => getPairingDetail(k).then((r) => r.pairing)),
      );
      const merged = mergePairingDetails(details, al, own);
      if (!merged) throw new Error("Paarung nicht gefunden");
      return merged;
    };

    const load = isMergedPairingKey(key)
      ? loadMerged()
      : getPairingDetail(key).then(({ pairing: data }) => data);

    void load
      .then((data) => setPairing(data))
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Paarung nicht geladen"),
      )
      .finally(() => setLoading(false));
  }, [key]);

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
          pairing.appRoundsPlayed > 0
            ? `${pairing.appRoundsPlayed} ${pairing.appRoundsPlayed === 1 ? "Runde" : "Runden"} in der App`
            : null,
        ]
          .filter(Boolean)
          .join(" · ")
      : undefined;

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
                +{pairing.playerABonusPoints} Differenz
              </p>
              {pairing.playerAAppWins > 0 && (
                <p className="stats-detail-app-wins">
                  davon {pairing.playerAAppWins} in der App
                </p>
              )}
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
                +{pairing.playerBBonusPoints} Differenz
              </p>
              {pairing.playerBAppWins > 0 && (
                <p className="stats-detail-app-wins">
                  davon {pairing.playerBAppWins} in der App
                </p>
              )}
            </div>
          </section>

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
                  <li
                    key={`${round.inviteCode}-${round.roundNumber}-${round.finishedAt ?? index}`}
                    className="stats-round-card"
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
