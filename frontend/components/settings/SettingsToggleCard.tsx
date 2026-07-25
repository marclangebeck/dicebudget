"use client";

type Props = {
  title: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  onInfo?: () => void;
};

export function SettingsToggleCard({
  title,
  description,
  checked,
  onChange,
  disabled,
  onInfo,
}: Props) {
  return (
    <div
      className={`settings-compact-card settings-compact-card--toggle settings-compact-card--slim${disabled ? " settings-compact-card--disabled" : ""}`}
    >
      <div className="min-w-0">
        <p className="settings-compact-title settings-compact-title--sm settings-rule-title-row">
          <span>{title}</span>
          {onInfo && (
            <button
              type="button"
              className="house-rule-info-btn"
              aria-label={`Info zu ${title}`}
              onClick={onInfo}
            >
              i
            </button>
          )}
        </p>
        <p className="settings-compact-text settings-compact-text--sm">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${title} ${checked ? "deaktivieren" : "aktivieren"}`}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className="app-toggle relative h-7 w-12 shrink-0 rounded-full border-2 transition disabled:opacity-50"
      >
        <span
          className={`absolute top-0.5 block h-5 w-5 rounded-full bg-white shadow-md transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
