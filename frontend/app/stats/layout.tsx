import type { ReactNode } from "react";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { SetupScreenLayout } from "@/components/SetupScreenLayout";

export default function StatsLayout({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <SetupScreenLayout scrollable allowPinchZoom>
        {children}
      </SetupScreenLayout>
    </AppErrorBoundary>
  );
}
