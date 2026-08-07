import type { Viewport } from "next";
import type { ReactNode } from "react";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { SetupScreenLayout } from "@/components/SetupScreenLayout";

/** Statistik: kein Fokus-/Pinch-Zoom (iOS WebView bleibt auf 1×). */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#242528",
};

export default function StatsLayout({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <SetupScreenLayout scrollable>{children}</SetupScreenLayout>
    </AppErrorBoundary>
  );
}
