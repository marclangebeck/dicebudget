import type { Viewport } from "next";
import type { ReactNode } from "react";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { HomeScreenShell } from "@/components/HomeScreenShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#242528",
};

export default function AppHomeLayout({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <HomeScreenShell>{children}</HomeScreenShell>
    </AppErrorBoundary>
  );
}
