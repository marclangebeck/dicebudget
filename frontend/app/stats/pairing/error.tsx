"use client";

import Link from "next/link";

export default function PairingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-xl font-bold">Paarung konnte nicht angezeigt werden</h1>
      <p className="glass-alert-error px-3 py-2 text-sm">
        {error.message || "Ein unerwarteter Fehler ist aufgetreten."}
      </p>
      <div className="flex flex-wrap gap-3 text-sm">
        <button type="button" className="btn-primary px-3 py-2" onClick={() => reset()}>
          Erneut versuchen
        </button>
        <Link href="/stats" className="text-link">
          ← Alle Paarungen
        </Link>
      </div>
    </div>
  );
}
