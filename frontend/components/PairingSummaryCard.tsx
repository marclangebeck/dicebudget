import Link from "next/link";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import { playerLabel } from "@/lib/playerIdentity";

type Props = {
  pairing: PairingSummaryDto;
  ownPlayerId?: string;
  aliases?: Record<string, string>;
  onEditPlayerAlias?: (playerId: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

export function PairingSummaryCard({
  pairing,
  ownPlayerId,
  aliases,
  onEditPlayerAlias,
  selectable,
  selected,
  onToggleSelect,
}: Props) {
  const href = `/stats/pairing?key=${encodeURIComponent(pairing.key)}`;

  return (
    <li>
      <div
        className={`stats-pairing-card${selected ? " stats-pairing-card--selected" : ""}`}
      >
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
          <div className="stats-pairing-card-scores">
            <div className="stats-pairing-card-player">
              <p className="stats-pairing-card-wins tabular-nums">{pairing.playerAWins}</p>
              <p className="stats-pairing-card-label">Siege</p>
              {pairing.playerABonusPoints > 0 && (
                <p className="stats-pairing-card-diff tabular-nums">
                  +{pairing.playerABonusPoints} Δ
                </p>
              )}
            </div>
            <div className="stats-pairing-card-vs text-muted" aria-hidden>
              :
            </div>
            <div className="stats-pairing-card-player stats-pairing-card-player--b">
              <p className="stats-pairing-card-wins tabular-nums">{pairing.playerBWins}</p>
              <p className="stats-pairing-card-label">Siege</p>
              {pairing.playerBBonusPoints > 0 && (
                <p className="stats-pairing-card-diff tabular-nums">
                  +{pairing.playerBBonusPoints} Δ
                </p>
              )}
            </div>
          </div>
          <p className="stats-pairing-card-meta">
            {pairing.ties > 0 && <span>{pairing.ties} Remis · </span>}
            {pairing.appRoundsPlayed > 0 ? (
              <span>
                {pairing.appRoundsPlayed}{" "}
                {pairing.appRoundsPlayed === 1 ? "Runde" : "Runden"} in der App
              </span>
            ) : (
              <span>Noch keine App-Runden</span>
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
