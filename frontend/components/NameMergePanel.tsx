"use client";

type Props = {
  onChanged?: () => void;
  variant?: "default" | "stats";
};

export function NameMergePanel({ variant = "default" }: Props) {
  const panelClass =
    variant === "stats"
      ? "stats-merge-panel flex flex-col gap-3"
      : "glass-panel flex flex-col gap-3 p-4";

  return (
    <section className={panelClass}>
      <div>
        <h2
          className={
            variant === "stats"
              ? "stats-section-title"
              : "text-secondary text-sm font-semibold"
          }
        >
          Datenschutz-Update
        </h2>
        <p className="text-muted mt-1 text-xs">
          Die serverseitige Namens-Zusammenführung wurde im Rahmen von Milestone 22 deaktiviert.
          Multiplayer-Statistiken laufen jetzt über pseudonyme Spieler-IDs.
        </p>
      </div>
    </section>
  );
}
