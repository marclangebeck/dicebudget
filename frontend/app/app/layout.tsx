import type { Viewport } from "next";
import type { ReactNode } from "react";
import { HomeScreenShell } from "@/components/HomeScreenShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#cdd6e0",
};

export default function AppHomeLayout({ children }: { children: ReactNode }) {
  return <HomeScreenShell>{children}</HomeScreenShell>;
}
