"use client";

import type { ReactNode } from "react";
import { AppLegalFooter } from "@/components/AppLegalFooter";
import { useFixedViewport } from "@/lib/useFixedViewport";

type RouteClass = "home-route" | "setup-route" | "play-route";

type Props = {
  routeClass: RouteClass;
  children: ReactNode;
  /** false = Browser-Zoom erlauben (Settings, Statistik). */
  blockPinchZoom?: boolean;
};

function screenClass(routeClass: RouteClass): string {
  return routeClass.replace("-route", "-screen");
}

/** Vollbild ohne Dokument-Scroll; Pinch-Zoom optional blockiert. */
export function FixedScreenShell({
  routeClass,
  children,
  blockPinchZoom = true,
}: Props) {
  useFixedViewport(routeClass, { blockPinchZoom });
  const showFooter = routeClass !== "play-route";

  return (
    <div
      className={`${screenClass(routeClass)} app-bg relative h-dvh max-h-dvh min-h-0 w-full max-w-full overflow-hidden`}
    >
      {children}
      {showFooter && <AppLegalFooter />}
    </div>
  );
}
