"use client";

type Props = {
  title: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export function SetupToggleRow({ title, hint, checked, onChange }: Props) {
  return (
    <div className="t-setting-row">
      <div className="t-setting-copy">
        <p className="t-setting-title">{title}</p>
        {hint && <p className="t-setting-hint">{hint}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={`${title} ${checked ? "deaktivieren" : "aktivieren"}`}
        className={`t-switch${checked ? " is-on" : ""}`}
        onClick={() => onChange(!checked)}
      >
        <span className="t-switch-knob" />
      </button>
    </div>
  );
}
