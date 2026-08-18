"use client";

type Props = {
  title: string;
  hint?: string;
  checked: boolean;
  nested?: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
};

export function SetupToggleRow({
  title,
  hint,
  checked,
  nested = false,
  disabled = false,
  onChange,
}: Props) {
  return (
    <div className={`t-setting-row${nested ? " t-setting-row--nested" : ""}`}>
      <div className="t-setting-copy">
        <p className="t-setting-title">{title}</p>
        {hint && <p className="t-setting-hint">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        disabled={disabled}
        aria-label={`${title} ${checked ? "deaktivieren" : "aktivieren"}`}
        className={`t-switch${checked ? " is-on" : ""}`}
        onClick={() => {
          if (!disabled) onChange(!checked);
        }}
      >
        <span className="t-switch-knob" />
      </button>
    </div>
  );
}
