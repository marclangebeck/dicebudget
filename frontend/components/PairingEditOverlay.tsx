"use client";

import { useMemo, useState } from "react";
import { upsertPairingBaselines } from "@/lib/api";
import { playerLabel } from "@/lib/playerIdentity";
import {
  buildBaselineWrites,
  type MergedPairingSummary,
} from "@/lib/pairingMerge";
import type { PairingSummaryDto } from "@/lib/pairingTypes";
import type { PlayerAliasMap } from "@/lib/playerAliases";

type Props = {
  merged: MergedPairingSummary;
  sourceSummaries: PairingSummaryDto[];
  ownPlayerId: string;
  aliases: PlayerAliasMap;
  onClose: () => void;
  onSaved: () => void;
};

type FavorSide = "A" | "B" | "none";

function clampNonNegative(value: string): number {
  const n = Math.trunc(Number(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function PairingEditOverlay({
  merged,
  sourceSummaries,
  ownPlayerId,
  aliases,
  onClose,
  onSaved,
}: Props) {
  const labelA = playerLabel(merged.playerA, ownPlayerId, aliases);
  const labelB = playerLabel(merged.playerB, ownPlayerId, aliases);

  const initialNet = merged.playerABonusPoints - merged.playerBBonusPoints;

  const [winsA, setWinsA] = useState(String(merged.playerAWins));
  const [winsB, setWinsB] = useState(String(merged.playerBWins));
  const [diff, setDiff] = useState(String(Math.abs(initialNet)));
  const [favor, setFavor] = useState<FavorSide>(
    initialNet > 0 ? "A" : initialNet < 0 ? "B" : "none",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appWinsA = merged.playerAAppWins;
  const appWinsB = merged.playerBAppWins;

  const previewNet = useMemo(() => {
    const magnitude = clampNonNegative(diff);
    if (favor === "A") return magnitude;
    if (favor === "B") return -magnitude;
    return 0;
  }, [diff, favor]);

  const handleSave = async () => {
    const totalWinsA = Math.max(appWinsA, clampNonNegative(winsA));
    const totalWinsB = Math.max(appWinsB, clampNonNegative(winsB));
    const writes = buildBaselineWrites(
      merged,
      sourceSummaries,
      aliases,
      ownPlayerId,
      { totalWinsA, totalWinsB, netDiff: previewNet },
    );
    if (writes.length === 0) {
      setError("Diese Paarung kann nicht bearbeitet werden.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertPairingBaselines(writes);
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="run-complete-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pairing-edit-title"
    >
      <div className="play-complete-card w-full max-w-sm text-left">
        <p id="pairing-edit-title" className="play-complete-kicker">
          Paarung bearbeiten
        </p>
        <p className="text-secondary mt-2 text-sm">
          <strong className="text-strong">{labelA}</strong>
          <span className="text-muted mx-1 font-normal">vs.</span>
          <strong className="text-strong">{labelB}</strong>
        </p>
        <p className="text-muted mt-1 text-xs">
          Gesamtwerte inkl. Runden außerhalb der App. Wird auf allen Geräten
          gespeichert.
        </p>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Siege {labelA}</span>
            <input
              type="number"
              inputMode="numeric"
              min={appWinsA}
              value={winsA}
              onChange={(e) => setWinsA(e.target.value)}
              className="glass-input px-3 py-2 tabular-nums"
            />
            {appWinsA > 0 && (
              <span className="text-muted text-[11px]">
                min. {appWinsA} (in der App)
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-secondary">Siege {labelB}</span>
            <input
              type="number"
              inputMode="numeric"
              min={appWinsB}
              value={winsB}
              onChange={(e) => setWinsB(e.target.value)}
              className="glass-input px-3 py-2 tabular-nums"
            />
            {appWinsB > 0 && (
              <span className="text-muted text-[11px]">
                min. {appWinsB} (in der App)
              </span>
            )}
          </label>
        </div>

        <div className="mt-3 flex flex-col gap-1 text-sm">
          <span className="text-secondary">Punktedifferenz (netto)</span>
          <div className="flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={diff}
              onChange={(e) => setDiff(e.target.value)}
              className="glass-input w-24 px-3 py-2 tabular-nums"
            />
            <select
              value={favor}
              onChange={(e) => setFavor(e.target.value as FavorSide)}
              className="glass-input flex-1 px-2 py-2"
              aria-label="Differenz zugunsten"
            >
              <option value="A">zugunsten {labelA}</option>
              <option value="B">zugunsten {labelB}</option>
              <option value="none">Gleichstand</option>
            </select>
          </div>
          <span className="text-muted text-[11px]">
            {previewNet > 0
              ? `${labelA} liegt mit +${previewNet} vorn.`
              : previewNet < 0
                ? `${labelB} liegt mit +${-previewNet} vorn.`
                : "Kein Vorsprung."}
          </span>
        </div>

        {error && <p className="glass-alert-error mt-3 px-3 py-2 text-sm">{error}</p>}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="btn-secondary w-full py-2 text-sm"
          >
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={saving}
            className="btn-primary w-full py-2 text-sm"
          >
            {saving ? "Speichert …" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
