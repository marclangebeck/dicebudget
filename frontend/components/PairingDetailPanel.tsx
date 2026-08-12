"use client";

import Link from "next/link";
import { ShareActionBar } from "@/components/ShareActionBar";
import { RivalAvatar } from "@/components/RivalAvatar";
import {
  buildPairingShareText,
  recentPairingForm,
  renderPairingShareImage,
} from "@/lib/matchResultShare";
import type { PairingDetailDto } from "@/lib/pairingTypes";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import { playerLabel } from "@/lib/playerIdentity";
import { findRivalByPlayerId } from "@/lib/rivalProfiles";

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

type Props = {
  pairing: PairingDetailDto;
  pairingKey: string;
  ownPlayerId: string;
  aliases: PlayerAliasMap;
  onEditPlayerAlias: (playerId: string) => void;
  onEditPairing?: () => void;
};

export function PairingDetailPanel({
  pairing,
  pairingKey,
  ownPlayerId,
  aliases,
  onEditPlayerAlias,
  onEditPairing,
}: Props) {
  const netDiff = pairing.playerABonusPoints - pairing.playerBBonusPoints;
  const nameA = playerLabel(pairing.playerA, ownPlayerId, aliases);
  const nameB = playerLabel(pairing.playerB, ownPlayerId, aliases);
  const rivalA = findRivalByPlayerId(pairing.playerA);
  const rivalB = findRivalByPlayerId(pairing.playerB);
  const shareParams = {
    playerAName: nameA,
    playerBName: nameB,
    playerAWins: pairing.playerAWins,
    playerBWins: pairing.playerBWins,
    ties: pairing.ties,
    roundsPlayed: pairing.roundsPlayed,
    netDiff,
    form: recentPairingForm(pairing.rounds, 5),
  };

  return (
    <div className="stats-pairing-detail">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <ShareActionBar
          label="Rivalen-Karte teilen"
          shareSuffix="Rivalen"
          filename="dicebudget-rivalen.png"
          compact
          buildText={() => buildPairingShareText(shareParams)}
          buildImage={() => renderPairingShareImage(shareParams)}
        />
        {onEditPairing && (
          <button type="button" className="btn-chip px-3 py-1 text-xs" onClick={onEditPairing}>
            Siege/Diff (Admin)
          </button>
        )}
      </div>

      <section className="stats-detail-scores">
        <div className="stats-detail-player-card">
          <div className="stats-detail-player-head">
            <RivalAvatar rivalId={rivalA?.id} name={nameA} size="md" />
            <p className="stats-detail-player-name">{nameA}</p>
          </div>
          <button
            type="button"
            className="btn-chip mt-2 px-2 py-0.5 text-xs"
            onClick={() => onEditPlayerAlias(pairing.playerA)}
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
          <div className="stats-detail-player-head">
            <RivalAvatar rivalId={rivalB?.id} name={nameB} size="md" />
            <p className="stats-detail-player-name">{nameB}</p>
          </div>
          <button
            type="button"
            className="btn-chip mt-2 px-2 py-0.5 text-xs"
            onClick={() => onEditPlayerAlias(pairing.playerB)}
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
                  href={`/stats/match-analysis?invite=${encodeURIComponent(round.inviteCode)}&key=${encodeURIComponent(pairingKey)}&perspective=${encodeURIComponent(ownPlayerId)}`}
                  className="stats-round-card stats-round-card--link block no-underline"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-strong text-sm font-semibold">
                        Serie {round.leagueCode} · Runde {round.roundNumber}
                      </p>
                      <p className="text-muted mt-0.5 text-xs">{formatDateTime(round.finishedAt)}</p>
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
    </div>
  );
}
