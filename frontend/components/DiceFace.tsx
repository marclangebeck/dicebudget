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
};

export function DiceFace({
  value,
  className = "",
  pipClassName = "bg-slate-700",
}: Props) {
  const mask = PIP_MASKS[value];

  return (
    <div
      className={`grid h-7 w-7 grid-cols-3 grid-rows-3 gap-0.5 p-0.5 md:h-6 md:w-6 ${className}`}
      aria-hidden
    >
      {mask.map((on, i) => (
        <div key={i} className="flex items-center justify-center">
          {on ? (
            <span
              className={`h-1.5 w-1.5 rounded-full md:h-1 md:w-1 ${pipClassName}`}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}
