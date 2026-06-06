"use client";

type Props = {
  includeInStats: boolean;
  onChange: (includeInStats: boolean) => void;
  disabled?: boolean;
};

/** An = Werten, Aus = Nicht werten — gleiches Switch-Design wie in den Einstellungen. */
export function StatsRatingToggle({ includeInStats, onChange, disabled }: Props) {
  return (
    <div className="settings-compact-card settings-compact-card--toggle stats-rating-switch">
      <div className="min-w-0">
        <p className="settings-compact-title">
          {includeInStats ? "Werten" : "Nicht werten"}
        </p>
        <p className="settings-compact-text">
          {includeInStats
            ? "Dieses Spiel zählt in die Paarungs-Statistik."
            : "Dieses Spiel zählt nicht in die Paarungs-Statistik."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={includeInStats}
        aria-label={
          includeInStats
            ? "Auf Nicht werten umschalten"
            : "Auf Werten umschalten"
        }
        disabled={disabled}
        onClick={() => onChange(!includeInStats)}
        className="app-toggle relative h-8 w-14 shrink-0 rounded-full border-2 transition disabled:opacity-50"
      >
        <span
          className={`absolute top-0.5 block h-6 w-6 rounded-full bg-white shadow-md transition-transform ${
            includeInStats ? "translate-x-6" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
