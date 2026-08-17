"use client";

type Props = {
  title: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  nested?: boolean;
  onInfo?: () => void;
};

export function SettingsToggleRow({
  title,
  hint,
  checked,
  onChange,
  disabled,
  nested,
  onInfo,
}: Props) {
  return (
    <div
      className={`settings-toggle-row${nested ? " settings-toggle-row--nested" : ""}${
        disabled ? " settings-toggle-row--disabled" : ""
      }`}
    >
      <div className="settings-toggle-row-copy">
        <p className="settings-toggle-row-title">
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
        {hint && <p className="settings-toggle-row-hint">{hint}</p>}
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
