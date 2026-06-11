import type { ReactNode } from "react";
import { SetupScreenLayout } from "@/components/SetupScreenLayout";

export default function StatsLayout({ children }: { children: ReactNode }) {
  return <SetupScreenLayout scrollable>{children}</SetupScreenLayout>;
}
