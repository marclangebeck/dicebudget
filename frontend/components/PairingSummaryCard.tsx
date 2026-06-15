import Link from "next/link";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import type { PairingHighlightTone } from "@/lib/statsPairingInsights";
import { playerLabel } from "@/lib/playerIdentity";

type Props = {
  pairing: PairingSummaryDto;
  ownPlayerId?: string;
  aliases?: Record<string, string>;
  onEditPlayerAlias?: (playerId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
  badge?: string | null;
  badgeTone?: PairingHighlightTone | null;
  featured?: boolean;
  duelShareA?: number;
};

function badgeClass(tone: PairingHighlightTone | null | undefined): string {
  if (tone === "lead") return "stats-pairing-badge--lead";
  if (tone === "chase") return "stats-pairing-badge--chase";
  if (tone === "tie") return "stats-pairing-badge--tie";
  if (tone === "even") return "stats-pairing-badge--even";
  return "";
}

export function PairingSummaryCard({
  pairing,
  ownPlayerId,
  aliases,
  onEditPlayerAlias,
  selectable,
  selected,
  onToggleSelect,
  badge,
  badgeTone,
  featured,
  duelShareA = 50,
}: Props) {
  const href = `/stats/pairing?key=${encodeURIComponent(pairing.key)}`;
  const netDiff = pairing.playerABonusPoints - pairing.playerBBonusPoints;
  const shareB = 100 - duelShareA;

  return (
    <li>
      <div
        className={`stats-pairing-card${selected ? " stats-pairing-card--selected" : ""}${featured ? " stats-pairing-card--featured" : ""}`}
      >
        {badge && (
          <span className={`stats-pairing-badge ${badgeClass(badgeTone)}`}>{badge}</span>
        )}
        {selectable && (
          <label className="stats-pairing-select">
            <input
              type="checkbox"
              checked={!!selected}
              onChange={onToggleSelect}
              aria-label="Paarung zum Zurücksetzen auswählen"
            />
            <span>Auswählen</span>
          </label>
        )}
        <span className="stats-pairing-card-arrow" aria-hidden>
          →
        </span>
        <Link href={href} className="no-underline">
          <p className="stats-pairing-card-title">
            <span className="text-strong">
              {playerLabel(pairing.playerA, ownPlayerId, aliases)}
            </span>
            <span className="text-muted mx-1.5 font-normal">vs.</span>
            <span className="text-strong">
              {playerLabel(pairing.playerB, ownPlayerId, aliases)}
            </span>
          </p>

          <div className="stats-pairing-duel-bar" aria-hidden>
            <span className="stats-pairing-duel-bar-a" style={{ width: `${duelShareA}%` }} />
            <span className="stats-pairing-duel-bar-b" style={{ width: `${shareB}%` }} />
          </div>

          <div className="stats-pairing-card-scores">
            <div className="stats-pairing-card-player">
              <p className="stats-pairing-card-wins tabular-nums">{pairing.playerAWins}</p>
              <p className="stats-pairing-card-label">Siege</p>
              {netDiff > 0 && (
                <p className="stats-pairing-card-diff tabular-nums">+{netDiff} Δ</p>
              )}
            </div>
            <div className="stats-pairing-card-vs text-muted" aria-hidden>
              :
            </div>
            <div className="stats-pairing-card-player stats-pairing-card-player--b">
              <p className="stats-pairing-card-wins tabular-nums">{pairing.playerBWins}</p>
              <p className="stats-pairing-card-label">Siege</p>
              {netDiff < 0 && (
                <p className="stats-pairing-card-diff tabular-nums">+{-netDiff} Δ</p>
              )}
            </div>
          </div>
          <p className="stats-pairing-card-meta">
            {pairing.ties > 0 && <span>{pairing.ties} Remis · </span>}
            {pairing.roundsPlayed > 0 ? (
              <span>
                {pairing.roundsPlayed}{" "}
                {pairing.roundsPlayed === 1 ? "Runde" : "Runden"} gesamt
              </span>
            ) : (
              <span>Noch keine Runden</span>
            )}
          </p>
        </Link>
        {onEditPlayerAlias && (
          <div className="mt-2 flex justify-center gap-2">
            <button
              type="button"
              className="btn-chip px-2 py-0.5 text-xs"
              onClick={() => onEditPlayerAlias(pairing.playerA)}
              aria-label="Alias für Spieler A setzen"
            >
              ✏️ {playerLabel(pairing.playerA, ownPlayerId, aliases)}
            </button>
            <button
              type="button"
              className="btn-chip px-2 py-0.5 text-xs"
              onClick={() => onEditPlayerAlias(pairing.playerB)}
              aria-label="Alias für Spieler B setzen"
            >
              ✏️ {playerLabel(pairing.playerB, ownPlayerId, aliases)}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
