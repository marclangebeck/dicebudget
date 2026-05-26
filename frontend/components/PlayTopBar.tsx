import Link from "next/link";
import { APP_HOME_PATH } from "@/lib/branding";

type Props = {
  inviteCode?: string | null;
  useStrategyRules: boolean;
  rollsInPool: number;
  rollsRemaining: number | null;
};

export function PlayTopBar({
  inviteCode,
  useStrategyRules,
  rollsInPool,
  rollsRemaining,
}: Props) {
  return (
    <div className="play-top-bar shrink-0">
      {inviteCode ? (
        <Link
          href={`/multi/join?code=${encodeURIComponent(inviteCode)}`}
          className="play-top-link"
        >
          ← Lobby
        </Link>
      ) : (
        <Link href={APP_HOME_PATH} className="play-top-link">
          ← Start
        </Link>
      )}
      {useStrategyRules && rollsRemaining !== null && (
        <div className="play-top-chips">
          <span className="play-chip">
            Pool <strong className="tabular-nums">{rollsInPool}</strong>
          </span>
          <span className="play-chip play-chip--sky">
            Rest <strong className="tabular-nums">{rollsRemaining}</strong>
          </span>
        </div>
      )}
    </div>
  );
}
