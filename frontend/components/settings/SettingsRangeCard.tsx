"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  hint: ReactNode;
  value: number;
  min: number;
  max: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function SettingsRangeCard({
  title,
  hint,
  value,
  min,
  max,
  disabled,
  onChange,
}: Props) {
  return (
    <label
      className={`settings-compact-card settings-compact-card--range settings-compact-card--slim${disabled ? " settings-compact-card--disabled" : ""}`}
    >
      <div className="settings-range-header">
        <p className="settings-compact-title settings-compact-title--sm">{title}</p>
        <span className="settings-compact-value-inline tabular-nums">{value}</span>
      </div>
      <p className="settings-compact-text settings-compact-text--sm text-left">{hint}</p>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="setup-host-range"
      />
    </label>
  );
}
