"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadActiveGame, playPath } from "@/lib/activeGame";

type Props = {
  inviteCode: string;
};

export function ResumeLobbySheet({ inviteCode }: Props) {
  const [href, setHref] = useState<string | null>(null);

  useEffect(() => {
    const stored = loadActiveGame();
    if (stored?.type === "multi" && stored.inviteCode === inviteCode) {
      setHref(playPath(stored));
    }
  }, [inviteCode]);

  if (!href) return null;

  return (
    <Link
      href={href}
      className="glass-panel-amber block px-3 py-2.5 text-center text-sm font-semibold text-amber-900 transition hover:brightness-[1.02]"
    >
      Meinen Zettel fortsetzen
    </Link>
  );
}
