"use client";

import type { ReactNode } from "react";
import { useFixedViewport } from "@/lib/useFixedViewport";

type RouteClass = "home-route" | "setup-route" | "play-route";

type Props = {
  routeClass: RouteClass;
  children: ReactNode;
};

function screenClass(routeClass: RouteClass): string {
  return routeClass.replace("-route", "-screen");
}

/** Vollbild ohne Dokument-Scroll und ohne Pinch-Zoom. */
export function FixedScreenShell({ routeClass, children }: Props) {
  useFixedViewport(routeClass);

  return (
    <div
      className={`${screenClass(routeClass)} app-bg flex h-dvh max-h-dvh min-h-0 w-full max-w-full flex-col overflow-hidden`}
    >
      {children}
    </div>
  );
}
