"use client";

import { useEffect, useRef, useState } from "react";
import { RivalAvatarByPlayer } from "@/components/RivalAvatar";
import {
  compressRivalAvatarFile,
  subscribeRivalAvatars,
} from "@/lib/rivalAvatarStore";
import {
  deletePlayerPhoto,
  getPlayerPhotoBlob,
  setPlayerPhotoBlob,
} from "@/lib/playerPhotos";

type Size = "sm" | "md" | "banner";

type Props = {
  playerId: string;
  name: string;
  size?: Size;
};

export function PlayerPhotoEditor({ playerId, name, size = "banner" }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [hasPhoto, setHasPhoto] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function check() {
      const blob = await getPlayerPhotoBlob(playerId);
      if (!cancelled) setHasPhoto(blob != null);
    }
    void check();
    const unsub = subscribeRivalAvatars(() => {
      void check();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, [playerId]);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const blob = await compressRivalAvatarFile(file);
      await setPlayerPhotoBlob(playerId, blob);
    } catch {
      /* ignore */
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await deletePlayerPhoto(playerId);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="player-photo-editor">
      <button
        type="button"
        className="player-photo-editor-hit"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        aria-label={`${name}: Foto wählen`}
      >
        <RivalAvatarByPlayer playerId={playerId} name={name} size={size} />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void onFile(e.target.files?.[0])}
      />
      <div className="player-photo-editor-actions">
        <button
          type="button"
          className="btn-chip px-2 py-0.5 text-xs"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
        >
          {hasPhoto ? "Foto ändern" : "Foto"}
        </button>
        {hasPhoto && (
          <button
            type="button"
            className="btn-chip px-2 py-0.5 text-xs"
            disabled={busy}
            onClick={() => void remove()}
          >
            Entfernen
          </button>
        )}
      </div>
    </div>
  );
}
