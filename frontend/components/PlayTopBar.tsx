import Link from "next/link";
import { APP_HOME_PATH } from "@/lib/branding";

type Props = {
  inviteCode?: string | null;
  useStrategyRules: boolean;
  rollsInPool: number;
  rollsRemaining: number | null;
  /** Wurf-Pool des Gegners (nur 2 Spieler + Host hat es erlaubt); sonst null. */
  opponentPool?: number | null;
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
  showAbandon,
  abandonBusy,
  onAbandon,
}: Props) {
  return (
    <div className="play-top-bar shrink-0">
      {inviteCode ? (
        <Link
          href={`/multi/join?code=${encodeURIComponent(inviteCode)}`}
          className="app-nav-btn"
        >
          <span aria-hidden className="app-nav-btn-icon">
            ←
          </span>
          <span>Zur Lobby</span>
        </Link>
      ) : (
        <Link href={APP_HOME_PATH} className="app-nav-btn">
          <span aria-hidden className="app-nav-btn-icon">
            ←
          </span>
          <span>Startseite</span>
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
