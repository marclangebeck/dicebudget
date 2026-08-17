"use client";

type Props = {
  title: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function SettingsStepperRow({
  title,
  hint,
  value,
  min,
  max,
  disabled,
  onChange,
}: Props) {
  function bump(delta: number) {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  }

  return (
    <div
      className={`settings-stepper-row${disabled ? " settings-stepper-row--disabled" : ""}`}
    >
      <div className="settings-toggle-row-copy">
        <p className="settings-toggle-row-title">{title}</p>
        {hint && <p className="settings-toggle-row-hint">{hint}</p>}
      </div>
      <div className="settings-stepper-controls" role="group" aria-label={title}>
        <button
          type="button"
          className="settings-stepper-btn"
          disabled={disabled || value <= min}
          aria-label={`${title} verringern`}
          onClick={() => bump(-1)}
        >
          −
        </button>
        <span className="settings-stepper-value tabular-nums">{value}</span>
        <button
          type="button"
          className="settings-stepper-btn"
          disabled={disabled || value >= max}
          aria-label={`${title} erhöhen`}
          onClick={() => bump(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
