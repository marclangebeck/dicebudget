"use client";

type Props = {
  totalScore: number;
  gameCount: number;
  busy?: boolean;
  onViewSheet: () => void;
  onContinue: () => void;
};

export function RunCompleteOverlay({
  totalScore,
  gameCount,
  busy,
  onViewSheet,
  onContinue,
}: Props) {
  return (
    <div
      className="run-complete-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="run-complete-title"
    >
      <div className="play-complete-card w-full max-w-sm text-center">
        <p id="run-complete-title" className="play-complete-kicker">
          Alle Felder ausgefüllt
        </p>
        <p className="play-complete-score mt-3 tabular-nums">{totalScore}</p>
        <p className="text-secondary mt-2 text-sm">
          Du hast <strong className="text-strong font-bold">{totalScore}</strong> Punkte erzielt.
        </p>
        <p className="text-muted mt-1 text-xs">
          Gesamtergebnis über {gameCount} {gameCount === 1 ? "Spiel" : "Spiele"}
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={onViewSheet}
            className="run-finish-action-btn w-full min-h-10 px-6 text-sm disabled:opacity-50"
          >
            Zettel ansehen
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onContinue}
            className="setup-host-submit w-full disabled:opacity-50"
          >
            {busy ? "Speichere …" : "Ergebnis ansehen"}
          </button>
        </div>
      </div>
    </div>
  );
}
