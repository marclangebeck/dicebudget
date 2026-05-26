"use client";

import type { ReactNode } from "react";
import { FixedScreenShell } from "@/components/FixedScreenShell";

type Props = {
  children: ReactNode;
};

/** Vollbild-Spielansicht: blockiert Seiten-Scroll und Pinch-Zoom (iOS PWA). */
export function PlayScreenShell({ children }: Props) {
  return (
    <FixedScreenShell routeClass="play-route">
      <div className="play-screen flex h-full min-h-0 w-full max-w-full flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </FixedScreenShell>
  );
}
