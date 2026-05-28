"use client";

import { useEffect, useState } from "react";
import { playerLabel, shortPlayerId } from "@/lib/playerIdentity";

type Props = {
  playerId: string;
  ownPlayerId?: string;
  currentAlias?: string;
  aliases?: Record<string, string>;
  onClose: () => void;
  onSave: (alias: string) => void;
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

  useEffect(() => {
    setAliasInput(currentAlias ?? "");
  }, [currentAlias, playerId]);

  return (
    <div
      className="run-complete-overlay fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-alias-title"
    >
      <div className="play-complete-card w-full max-w-sm text-left">
        <p id="player-alias-title" className="play-complete-kicker">
          Gegner lokal benennen
        </p>
        <p className="text-secondary mt-2 text-sm">
          Aktuell: <strong className="text-strong">{playerLabel(playerId, ownPlayerId, aliases)}</strong>
        </p>
        <p className="text-muted mt-1 text-xs">
          Dieser Alias wird nur auf deinem Gerät gespeichert. Serverseitig bleibt es
          bei der Pseudo-ID {shortPlayerId(playerId)}.
        </p>

        <label className="mt-4 flex flex-col gap-1 text-sm">
          <span className="text-secondary">Alias</span>
          <input
            value={aliasInput}
            onChange={(e) => setAliasInput(e.target.value)}
            maxLength={40}
            className="glass-input px-3 py-2"
            placeholder="z. B. Nicole"
          />
        </label>

        <div className="mt-4 flex gap-2">
          <button type="button" onClick={onClose} className="btn-secondary w-full py-2 text-sm">
            Abbrechen
          </button>
          <button
            type="button"
            onClick={() => onSave(aliasInput)}
            className="btn-primary w-full py-2 text-sm"
          >
            Speichern
          </button>
        </div>
      </div>
    </div>
  );
}

