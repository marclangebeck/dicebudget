"use client";

import { useEffect, useMemo, useState } from "react";
import { getSessionLobby, submitKoTieBreak } from "@/lib/api";
import { YatzyDiePicker } from "@/components/YatzyDiePicker";

type Props = {
  inviteCode: string;
  playerSecret: string;
  initialRolls?: number[] | null;
  onResolved: () => Promise<void>;
};

export function KoTieBreakOverlay({
  inviteCode,
  playerSecret,
  initialRolls,
  onResolved,
}: Props) {
  const [rolls, setRolls] = useState<[number | null, number | null, number | null]>(() => [
    initialRolls?.[0] ?? null,
    initialRolls?.[1] ?? null,
    initialRolls?.[2] ?? null,
  ]);
  const [busy, setBusy] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allSelected = useMemo(() => rolls.every((r) => r != null), [rolls]);

  async function pollUntilResolved() {
    setWaiting(true);
    const started = Date.now();
    try {
      while (true) {
        if (Date.now() - started > 10 * 60 * 1000) {
          throw new Error("Timeout beim Warten auf Gegenspieler");
        }
        const res = await getSessionLobby(inviteCode);
        if (res.session.koTieBreakPending === false) break;
        await new Promise((r) => setTimeout(r, 2000));
      }
      await onResolved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Warten fehlgeschlagen");
    } finally {
      setWaiting(false);
    }
  }

  async function handleSubmit() {
    if (!allSelected || busy || waiting) return;
    const payload: [number, number, number] = [rolls[0]!, rolls[1]!, rolls[2]!];
    setBusy(true);
    setError(null);
    try {
      const res = await submitKoTieBreak(inviteCode, payload, playerSecret);
      if (res.session.koTieBreakPending === false) {
        await onResolved();
        return;
      }
      await pollUntilResolved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Tie-Break speichern fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    setRolls([
      initialRolls?.[0] ?? null,
      initialRolls?.[1] ?? null,
      initialRolls?.[2] ?? null,
    ]);
  }, [initialRolls]);

  return (
    <div
      className="run-progress-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ko-tie-break-title"
    >
      <button
        type="button"
        className="run-progress-overlay-backdrop"
        aria-label="Hinweis schließen"
        disabled
      />
      <div className="run-progress-card relative z-10 text-center w-full max-w-sm">
        <p id="ko-tie-break-title" className="run-progress-kicker">
          KO-Tie-Break
        </p>
        <p className="run-progress-value tabular-nums">3 Würfe</p>
        <p className="run-progress-title mt-2">Je Wurf: höher gewinnt</p>

        <div className="mt-4 flex flex-col gap-4">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="text-left">
              <p className="text-xs text-muted mb-2">Wurf {idx + 1}</p>
              <YatzyDiePicker
                disabled={busy || waiting}
                compact
                selected={rolls[idx]}
                onPick={(v) =>
                  setRolls((prev) => {
                    const next = [...prev] as [
                      number | null,
                      number | null,
                      number | null,
                    ];
                    next[idx] = v;
                    return next;
                  })
                }
              />
            </div>
          ))}
        </div>

        {error && <p className="glass-alert-error mt-3 text-sm">{error}</p>}

        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            disabled={busy || !allSelected || waiting}
            onClick={() => void handleSubmit()}
            className="glass-button min-h-10 px-5 text-sm font-semibold disabled:opacity-50"
          >
            {waiting ? "Warte auf Gegenspieler …" : busy ? "Speichere …" : "Tie-Break speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}

