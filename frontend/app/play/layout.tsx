import type { Viewport } from "next";
import type { ReactNode } from "react";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { PlayScreenShell } from "@/components/PlayScreenShell";

/** Spielseite: kein Pinch-Zoom, feste Skalierung. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#242528",
};

export default function PlayLayout({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <PlayScreenShell>{children}</PlayScreenShell>
    </AppErrorBoundary>
  );
}
