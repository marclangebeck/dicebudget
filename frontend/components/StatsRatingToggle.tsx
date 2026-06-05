"use client";

type Props = {
  includeInStats: boolean;
  onChange: (includeInStats: boolean) => void;
  disabled?: boolean;
};

/** Links „Werten“, rechts „Nicht werten“ – für Multiplayer-Abschluss. */
export function StatsRatingToggle({ includeInStats, onChange, disabled }: Props) {
  return (
    <div className="stats-rating-toggle" role="group" aria-label="Spiel in Statistik aufnehmen">
      <button
        type="button"
        disabled={disabled}
        aria-pressed={includeInStats}
        onClick={() => onChange(true)}
        className={`stats-rating-toggle-btn ${includeInStats ? "stats-rating-toggle-btn--active" : ""}`}
      >
        Werten
      </button>
      <button
        type="button"
        disabled={disabled}
        aria-pressed={!includeInStats}
        onClick={() => onChange(false)}
        className={`stats-rating-toggle-btn ${!includeInStats ? "stats-rating-toggle-btn--active stats-rating-toggle-btn--off" : ""}`}
      >
        Nicht werten
      </button>
    </div>
  );
}
