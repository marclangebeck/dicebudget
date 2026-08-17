"use client";

import { useEffect, useState } from "react";
import { getPlayerPhotoBlob } from "@/lib/playerPhotos";
import { subscribeRivalAvatars } from "@/lib/rivalAvatarStore";

type Size = "sm" | "md" | "banner";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

type RivalAvatarProps = {
  playerId: string | null | undefined;
  name: string;
  size?: Size;
  className?: string;
};

export function RivalAvatar({ playerId, name, size = "md", className = "" }: RivalAvatarProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      if (!playerId) {
        setUrl(null);
        return;
      }
      const blob = await getPlayerPhotoBlob(playerId);
      if (cancelled) return;
      if (!blob) {
        setUrl(null);
        return;
      }
      const objectUrl = URL.createObjectURL(blob);
      revoked = objectUrl;
      setUrl(objectUrl);
    }

    void load();
    const unsub = subscribeRivalAvatars(() => {
      void load();
    });

    return () => {
      cancelled = true;
      unsub();
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [playerId]);

  const sizeClass =
    size === "banner" ? "rival-avatar--banner" : size === "sm" ? "rival-avatar--sm" : "rival-avatar--md";

  return (
    <span
      className={`rival-avatar ${sizeClass}${className ? ` ${className}` : ""}`}
      aria-hidden
      title={name}
    >
      {url ? (
        <img src={url} alt="" className="rival-avatar-img" />
      ) : (
        <span className="rival-avatar-initials">{initialsFromName(name)}</span>
      )}
    </span>
  );
}

type RivalAvatarByPlayerProps = {
  playerId: string;
  name: string;
  size?: Size;
  className?: string;
};

export function RivalAvatarByPlayer({
  playerId,
  name,
  size = "sm",
  className,
}: RivalAvatarByPlayerProps) {
  return (
    <RivalAvatar playerId={playerId} name={name} size={size} className={className} />
  );
}
