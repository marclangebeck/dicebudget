"use client";

type Option = { value: string; label: string };

type Props = {
  ariaLabel: string;
  value: string;
  options: Option[];
  onChange: (value: string) => void;
};

export function SetupSegmented({ ariaLabel, value, options, onChange }: Props) {
  return (
    <div className="t-segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`t-segmented-option${selected ? " is-selected" : ""}`}
            onClick={() => onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
