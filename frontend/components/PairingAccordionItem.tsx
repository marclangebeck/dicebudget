"use client";

import { useEffect, useState } from "react";
import { PairingDetailPanel } from "@/components/PairingDetailPanel";
import { loadMergedPairingDetail } from "@/lib/loadMergedPairingDetail";
import type { MergedPairingSummary } from "@/lib/pairingMerge";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import type { PlayerAliasMap } from "@/lib/playerAliases";
import { playerLabel } from "@/lib/playerIdentity";
import type { PairingHighlightTone } from "@/lib/statsPairingInsights";
import { RivalAvatarByPlayer } from "@/components/RivalAvatar";

type Props = {
  pairing: PairingSummaryDto;
  ownPlayerId: string;
  aliases: PlayerAliasMap;
  /** Nur für Stats-Merge; ohne Server-Namen. Default: aliases */
  mergeAliases?: PlayerAliasMap;
  open: boolean;
  onToggle: () => void;
  onEditPlayerAlias?: (playerId: string) => void;
  onEditPairing?: (payload: {
    group: MergedPairingSummary;
    sources: PairingSummaryDto[];
  }) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  badge?: string | null;
  badgeTone?: PairingHighlightTone | null;
  featured?: boolean;
  duelShareA?: number;
  reloadToken?: number;
};

function badgeClass(tone: PairingHighlightTone | null | undefined): string {
  if (tone === "lead") return "stats-pairing-badge--lead";
  if (tone === "chase") return "stats-pairing-badge--chase";
  if (tone === "tie") return "stats-pairing-badge--tie";
  if (tone === "even") return "stats-pairing-badge--even";
  return "";
}

export function PairingAccordionItem({
  pairing,
  ownPlayerId,
  aliases,
  mergeAliases,
  open,
  onToggle,
  onEditPlayerAlias,
  onEditPairing,
  selectable,
  selected,
  onToggleSelect,
  badge,
  badgeTone,
  featured,
  duelShareA = 50,
  reloadToken = 0,
}: Props) {
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof loadMergedPairingDetail>> | null>(
    null,
  );

  const netDiff = pairing.playerABonusPoints - pairing.playerBBonusPoints;
  const shareB = 100 - duelShareA;
  const panelId = `stats-pairing-${pairing.key}`;

  const summaryParts = [
    `${pairing.playerAWins}:${pairing.playerBWins} Siege`,
    pairing.ties > 0 ? `${pairing.ties} Remis` : null,
    pairing.roundsPlayed > 0
      ? `${pairing.roundsPlayed} ${pairing.roundsPlayed === 1 ? "Runde" : "Runden"}`
      : "Noch keine Runden",
  ].filter(Boolean);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);

    void loadMergedPairingDetail(pairing.key, mergeAliases ?? aliases, ownPlayerId)
      .then((result) => {
        if (cancelled) return;
        setDetail(result);
        setDetailKey(pairing.key);
      })
      .catch((e) => {
        if (cancelled) return;
        setDetailError(e instanceof Error ? e.message : "Paarung nicht geladen");
        setDetail(null);
        setDetailKey(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, pairing.key, aliases, mergeAliases, ownPlayerId, reloadToken]);

  const showDetail = open && detail && detailKey === pairing.key;

  return (
    <li>
      <section
        className={`stats-section ${open ? "is-open" : ""}${featured ? " stats-section--featured" : ""}${selected ? " stats-section--selected" : ""}${badge ? " stats-section--badged" : ""}`}
      >
        {badge && (
          <span className={`stats-pairing-badge stats-section-badge ${badgeClass(badgeTone)}`}>
            {badge}
          </span>
        )}
        <button
          type="button"
          className="stats-section-trigger"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {selectable && (
            <label
              className="stats-pairing-select stats-section-select"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                checked={!!selected}
                onChange={onToggleSelect}
                aria-label="Paarung zum Zurücksetzen auswählen"
              />
              <span>Auswählen</span>
            </label>
          )}
          <span className="stats-section-trigger-body">
            <span className="stats-section-trigger-head">
              <span className="stats-section-trigger-title stats-section-trigger-title--avatars">
                <RivalAvatarByPlayer
                  playerId={pairing.playerA}
                  name={playerLabel(pairing.playerA, ownPlayerId, aliases)}
                  size="sm"
                />
                {playerLabel(pairing.playerA, ownPlayerId, aliases)}
                <span className="stats-section-trigger-vs"> vs. </span>
                <RivalAvatarByPlayer
                  playerId={pairing.playerB}
                  name={playerLabel(pairing.playerB, ownPlayerId, aliases)}
                  size="sm"
                />
                {playerLabel(pairing.playerB, ownPlayerId, aliases)}
              </span>
              <span className="stats-section-trigger-summary">{summaryParts.join(" · ")}</span>
            </span>
            <div className="stats-pairing-duel-bar stats-section-duel-bar" aria-hidden>
              <span className="stats-pairing-duel-bar-a" style={{ width: `${duelShareA}%` }} />
              <span className="stats-pairing-duel-bar-b" style={{ width: `${shareB}%` }} />
            </div>
            {!open && (
              <div className="stats-section-trigger-scores" aria-hidden>
                <span className="tabular-nums">{pairing.playerAWins}</span>
                <span className="stats-section-trigger-scores-sep">:</span>
                <span className="tabular-nums">{pairing.playerBWins}</span>
                {netDiff !== 0 && (
                  <span className="stats-section-trigger-diff tabular-nums">
                    {netDiff > 0 ? `+${netDiff}` : netDiff} Δ
                  </span>
                )}
              </div>
            )}
          </span>
          <span className="stats-section-trigger-chevron" aria-hidden />
        </button>

        <div id={panelId} className="stats-section-panel" aria-hidden={!open}>
          <div className="stats-section-panel-inner">
            {open && detailLoading && (
              <p className="stats-empty-state stats-empty-state--inline">Lade Details …</p>
            )}
            {open && detailError && (
              <p className="glass-alert-error px-3 py-2 text-sm">{detailError}</p>
            )}
            {showDetail && (
              <PairingDetailPanel
                pairing={detail.detail}
                pairingKey={pairing.key}
                ownPlayerId={ownPlayerId}
                aliases={aliases}
                onEditPlayerAlias={onEditPlayerAlias ?? (() => {})}
                onEditPairing={
                  onEditPairing
                    ? () =>
                        onEditPairing({
                          group: detail.group,
                          sources: detail.sources,
                        })
                    : undefined
                }
              />
            )}
          </div>
        </div>
      </section>
    </li>
  );
}
