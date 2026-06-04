import Link from "next/link";

type Props = {
  inviteCode?: string | null;
  useStrategyRules: boolean;
  rollsInPool: number;
  rollsRemaining: number | null;
  /** Wurf-Pool des Gegners (nur 2 Spieler + Host hat es erlaubt); sonst null. */
  opponentPool?: number | null;
  /** Host hat „Gegner-Pool sichtbar" aktiviert → Aktualisieren-Tap anzeigen. */
  showOpponentPoolControl?: boolean;
  /** Einzelner Lobby-Request auf Tippen (kein Polling). */
  onRefreshOpponentPool?: () => void;
  showAbandon?: boolean;
  abandonBusy?: boolean;
  onAbandon?: () => void;
};

export function PlayTopBar({
  inviteCode,
  useStrategyRules,
  rollsInPool,
  rollsRemaining,
  opponentPool,
  showOpponentPoolControl,
  onRefreshOpponentPool,
  showAbandon,
  abandonBusy,
  onAbandon,
}: Props) {
  return (
    <div className="play-top-bar shrink-0">
      {inviteCode && (
        <Link
          href={`/multi/join?code=${encodeURIComponent(inviteCode)}`}
          className="app-nav-btn"
        >
          <span aria-hidden className="app-nav-btn-icon">
            ←
          </span>
          <span>Zur Lobby</span>
        </Link>
      )}

      <div className="play-top-bar-end">
        {useStrategyRules && rollsRemaining !== null && (
          <div className="play-top-chips">
            <span className="play-chip">
              Pool <strong className="tabular-nums">{rollsInPool}</strong>
            </span>
            {opponentPool !== null && opponentPool !== undefined && (
              <span className="play-chip play-chip--sky">
                Gegner <strong className="tabular-nums">{opponentPool}</strong>
              </span>
            )}
            {showOpponentPoolControl && onRefreshOpponentPool && (
              <button
                type="button"
                onClick={onRefreshOpponentPool}
                className="play-chip-refresh"
                aria-label="Gegner-Pool aktualisieren"
                title="Gegner-Pool aktualisieren"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="play-chip-refresh-icon"
                  aria-hidden
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 12a8 8 0 0 1 13.66-5.66L20 8M20 4v4h-4M20 12a8 8 0 0 1-13.66 5.66L4 16M4 20v-4h4"
                  />
                </svg>
              </button>
            )}
          </div>
        )}
        {showAbandon && onAbandon && (
          <button
            type="button"
            disabled={abandonBusy}
            onClick={onAbandon}
            className="play-abandon-btn disabled:opacity-50"
            title="Spiel beenden"
            aria-label="Spiel beenden"
          >
            <svg
              viewBox="0 0 24 24"
              className="play-abandon-icon"
              aria-hidden
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 6l12 12M18 6L6 18"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
