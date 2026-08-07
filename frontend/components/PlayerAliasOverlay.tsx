"use client";

import { useEffect, useMemo, useState } from "react";
import { playerLabel, shortPlayerId } from "@/lib/playerIdentity";
import {
  linkPlayerToRival,
  loadRivalProfiles,
  rivalLinkedIdsLabel,
  upsertRivalName,
  type RivalProfile,
} from "@/lib/rivalProfiles";

type Props = {
  playerId: string;
  ownPlayerId?: string;
  currentAlias?: string;
  aliases?: Record<string, string>;
  onClose: () => void;
  /** Nach Speichern: aktualisierte Display-Namen (Alias-Map-kompatibel). */
  onSave: (displayNames: Record<string, string>) => void;
};

export function PlayerAliasOverlay({
  playerId,
  ownPlayerId,
  currentAlias,
  aliases,
  onClose,
  onSave,
}: Props) {
  const [aliasInput, setAliasInput] = useState(currentAlias ?? "");
  const [selectedRivalId, setSelectedRivalId] = useState<string | null>(null);
  const [rivals, setRivals] = useState<RivalProfile[]>([]);

  useEffect(() => {
    setAliasInput(currentAlias ?? "");
    setSelectedRivalId(null);
    setRivals(loadRivalProfiles());
  }, [currentAlias, playerId]);

  const sortedRivals = useMemo(() => {
    return [...rivals].sort((a, b) => {
      const aUnlinked = a.playerIds.length === 0 ? 0 : 1;
      const bUnlinked = b.playerIds.length === 0 ? 0 : 1;
      if (aUnlinked !== bUnlinked) return aUnlinked - bUnlinked;
      return a.name.localeCompare(b.name, "de");
    });
  }, [rivals]);

  function pickRival(profile: RivalProfile) {
    setSelectedRivalId(profile.id);
    setAliasInput(profile.name);
  }

  function handleSave() {
    if (selectedRivalId) {
      onSave(linkPlayerToRival(playerId, selectedRivalId));
      return;
    }
    onSave(upsertRivalName(playerId, aliasInput));
  }

  return (
    <div
      className="run-complete-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-alias-title"
    >
      <div className="play-complete-card rival-link-card w-full max-w-sm text-left">
        <p id="player-alias-title" className="play-complete-kicker">
          Rivalen lokal benennen
        </p>
        <p className="text-secondary mt-2 text-sm">
          Aktuell: <strong className="text-strong">{playerLabel(playerId, ownPlayerId, aliases)}</strong>
        </p>
        <p className="text-muted mt-1 text-xs">
          Pseudo-ID {shortPlayerId(playerId)} — wähle einen bestehenden Rivalen oder gib einen
          neuen Namen ein.
        </p>

        {sortedRivals.length > 0 && (
          <div className="rival-link-list mt-3">
            <p className="rival-link-list-label">Bestehenden Rivalen verknüpfen</p>
            <div className="rival-link-chips">
              {sortedRivals.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  className={`rival-link-chip${selectedRivalId === profile.id ? " is-selected" : ""}`}
                  onClick={() => pickRival(profile)}
                >
                  <span className="rival-link-chip-name">{profile.name}</span>
                  <span className="rival-link-chip-meta">{rivalLinkedIdsLabel(profile)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-secondary">Oder neuer Name</span>
          <input
            value={aliasInput}
            onChange={(e) => {
              setAliasInput(e.target.value);
              setSelectedRivalId(null);
            }}
            maxLength={40}
            className="glass-input px-3 py-2 text-base"
            placeholder="z. B. Nicole"
            autoFocus
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary w-full py-2 text-sm">
            Abbrechen
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary w-full py-2 text-sm"
            disabled={!selectedRivalId && !aliasInput.trim()}
          >
            {selectedRivalId ? "Verknüpfen" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
