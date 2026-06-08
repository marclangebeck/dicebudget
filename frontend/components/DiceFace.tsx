/** Würfelpips in 3×3-Anordnung wie auf einem Standardwürfel (1–6). */
const PIP_MASKS: Record<1 | 2 | 3 | 4 | 5 | 6, readonly boolean[]> = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [true, false, false, false, false, false, false, false, true],
  3: [true, false, false, false, true, false, false, false, true],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true],
};

type Props = {
  value: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
  pipClassName?: string;
  /** field = Zettel-Feld (1,25 rem); mini = halbe Größe für Yatzy-Markierung */
  size?: "default" | "field" | "mini";
};

const SIZE_STYLES = {
  default: {
    shell: "h-7 w-7 gap-0.5 p-0.5 md:h-6 md:w-6",
    pip: "size-1.5 md:size-1",
  },
  field: {
    shell: "h-5 w-5 gap-[2px] p-[2px]",
    pip: "size-1",
  },
  mini: {
    shell: "h-2.5 w-2.5 gap-px p-px",
    pip: "size-0.5",
  },
} as const;

export function DiceFace({
  value,
  className = "",
  pipClassName = "bg-slate-700",
  size = "default",
}: Props) {
  const mask = PIP_MASKS[value];
  const styles = SIZE_STYLES[size];

  return (
    <div
      className={`grid shrink-0 grid-cols-3 grid-rows-3 ${styles.shell} ${className}`}
      aria-hidden
    >
      {mask.map((on, i) => (
        <div key={i} className="flex items-center justify-center">
          {on ? (
            <span
              className={`${styles.pip} shrink-0 rounded-full ${pipClassName}`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
