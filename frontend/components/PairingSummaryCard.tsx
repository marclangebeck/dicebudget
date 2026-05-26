import type { PairingSummaryDto } from "@/lib/pairingTypes";

type Props = {
  pairing: PairingSummaryDto;
};

export function PairingSummaryCard({ pairing }: Props) {
  const href = `/stats/pairing?key=${encodeURIComponent(pairing.key)}`;

  return (
    <li>
      <a href={href} className="stats-pairing-card no-underline">
        <span className="stats-pairing-card-arrow" aria-hidden>
          →
        </span>
        <p className="stats-pairing-card-title">
          <span className="text-strong">{pairing.playerA}</span>
          <span className="text-muted mx-1.5 font-normal">vs.</span>
          <span className="text-strong">{pairing.playerB}</span>
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
            <span>Nur historische Werte</span>
          )}
          {pairing.manualBaselineNote && (
            <span className="stats-pairing-card-note"> · inkl. Vor-App</span>
          )}
        </p>
      </a>
    </li>
  );
}
