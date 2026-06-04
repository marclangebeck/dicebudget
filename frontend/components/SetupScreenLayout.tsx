"use client";

import type { ReactNode } from "react";
import { FixedScreenShell } from "@/components/FixedScreenShell";

type Props = {
  children: ReactNode;
  /** false = komplett starr (Einzelspiel); true = nur innerer Bereich scrollt (Lobby) */
  scrollable?: boolean;
};

/** Solo / Multi: fester Viewport ohne Pinch-Zoom. */
export function SetupScreenLayout({ children, scrollable = true }: Props) {
  return (
    <FixedScreenShell routeClass="setup-route">
      <main className="setup-screen-main pt-safe mx-auto flex h-full min-h-0 w-full max-w-lg flex-1 flex-col gap-3 overflow-hidden px-4 py-4">
        <div
          className={`setup-screen-body flex min-h-0 flex-1 flex-col gap-4 overscroll-none ${
            scrollable ? "overflow-y-auto" : "overflow-hidden"
          }`}
        >
          {children}
        </div>
      </main>
    </FixedScreenShell>
  );
}
