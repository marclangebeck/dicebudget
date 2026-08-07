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

  const typedWinsA = clampNonNegative(winsA);
  const typedWinsB = clampNonNegative(winsB);
  const belowAppFloor = typedWinsA < appWinsA || typedWinsB < appWinsB;
  const hasAppWinsFloor = appWinsA > 0 || appWinsB > 0;

  const handleSave = async () => {
    const totalWinsA = Math.max(appWinsA, typedWinsA);
    const totalWinsB = Math.max(appWinsB, typedWinsB);
    if (belowAppFloor) {
      setWinsA(String(totalWinsA));
      setWinsB(String(totalWinsB));
      setError(
        "Unter App-Siege geht nur über „Server bereinigen“ (Paarung auswählen). " +
          "Gespeichert werden mindestens die App-Siege.",
      );
      return;
    }
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
          Paarung bearbeiten (Admin)
        </p>
        <p className="text-secondary mt-2 text-sm">
          <strong className="text-strong">{labelA}</strong>
          <span className="text-muted mx-1 font-normal">vs.</span>
          <strong className="text-strong">{labelB}</strong>
        </p>
        <p className="text-muted mt-1 text-xs">
          Admin-Workflow: Hier setzt du den <strong>Ziel-Gesamtstand</strong> für
          alle Geräte (absolut, nicht „draufrechnen“). Unter App-Siege nur nach
          „Server bereinigen“. Keine Klarnamen auf dem Server.
        </p>
        {hasAppWinsFloor && (
          <p className="text-muted mt-2 rounded-lg border border-[color:var(--border-subtle,#d4d4d8)] px-3 py-2 text-xs leading-snug">
            App-Siege ({appWinsA}:{appWinsB}) sind die Untergrenze. Niedriger geht
            nur über Statistik → Paarung auswählen →{" "}
            <strong className="text-strong">Server bereinigen</strong> (löscht echte
            App-Runden für alle Geräte).
          </p>
        )}
        {belowAppFloor && (
          <p className="glass-alert-error mt-2 px-3 py-2 text-xs leading-snug">
            Die eingegebenen Siege liegen unter den App-Siegen. Bitte anheben oder
            zuerst Server bereinigen.
          </p>
        )}

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
