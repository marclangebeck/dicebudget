import type { Viewport } from "next";
import type { ReactNode } from "react";
import { PlayerNameGate } from "@/components/PlayerNameGate";
import { SetupScreenLayout } from "@/components/SetupScreenLayout";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#242528",
};

export default function MultiLayout({ children }: { children: ReactNode }) {
  return (
    <SetupScreenLayout>
      <PlayerNameGate>{children}</PlayerNameGate>
    </SetupScreenLayout>
  );
}
