"use client";

type Props = {
  title: string;
  hint?: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export function SetupStepperRow({ title, hint, value, min, max, onChange }: Props) {
  function bump(delta: number) {
    const next = Math.min(max, Math.max(min, value + delta));
    if (next !== value) onChange(next);
  }

  return (
    <div className="t-setting-row">
      <div className="t-setting-copy">
        <p className="t-setting-title">{title}</p>
        {hint && <p className="t-setting-hint">{hint}</p>}
      </div>
      <div className="t-stepper" role="group" aria-label={title}>
        <button
          type="button"
          className="t-stepper-btn"
          disabled={value <= min}
          aria-label={`${title} verringern`}
          onClick={() => bump(-1)}
        >
          −
        </button>
        <span className="t-stepper-value">{value}</span>
        <button
          type="button"
          className="t-stepper-btn"
          disabled={value >= max}
          aria-label={`${title} erhöhen`}
          onClick={() => bump(1)}
        >
          +
        </button>
      </div>
    </div>
  );
}
