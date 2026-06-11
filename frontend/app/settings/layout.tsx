import type { ReactNode } from "react";
import { SetupScreenLayout } from "@/components/SetupScreenLayout";

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return <SetupScreenLayout>{children}</SetupScreenLayout>;
}
