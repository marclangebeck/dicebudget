"use client";

import { useEffect, useState } from "react";
import {
  getRivalAvatarBlob,
  subscribeRivalAvatars,
} from "@/lib/rivalAvatarStore";
import { findRivalByPlayerId } from "@/lib/rivalProfiles";

type Size = "sm" | "md";

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]!.slice(0, 1)}${parts[1]!.slice(0, 1)}`.toUpperCase();
}

type RivalAvatarProps = {
  rivalId: string | null | undefined;
  name: string;
  size?: Size;
  className?: string;
};

export function RivalAvatar({ rivalId, name, size = "md", className = "" }: RivalAvatarProps) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let revoked: string | null = null;
    let cancelled = false;

    async function load() {
      if (!rivalId) {
        setUrl(null);
        return;
      }
      const blob = await getRivalAvatarBlob(rivalId);
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
  }, [rivalId]);

  const sizeClass = size === "sm" ? "rival-avatar--sm" : "rival-avatar--md";

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
  const profile = findRivalByPlayerId(playerId);
  return (
    <RivalAvatar
      rivalId={profile?.id}
      name={name}
      size={size}
      className={className}
    />
  );
}
