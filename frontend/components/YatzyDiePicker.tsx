type Props = {
  disabled?: boolean;
  selected?: number | null;
  onPick: (value: number) => void;
  compact?: boolean;
};

export function YatzyDiePicker({ disabled, selected, onPick, compact }: Props) {
  return (
    <div
      className={
        compact
          ? "play-roll-chips play-roll-chips--compact"
          : "play-roll-chips play-roll-chips--large"
      }
    >
      {([1, 2, 3, 4, 5, 6] as const).map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onPick(n)}
          className={`play-roll-chip tabular-nums ${
            compact ? "play-roll-chip--compact" : "play-roll-chip--large"
          } ${selected === n ? "play-roll-chip--selected" : ""} disabled:opacity-40`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
