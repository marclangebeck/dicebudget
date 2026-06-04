import type { Viewport } from "next";
import type { ReactNode } from "react";
import { SetupScreenLayout } from "@/components/SetupScreenLayout";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#d2cabe",
};

export default function MultiLayout({ children }: { children: ReactNode }) {
  return <SetupScreenLayout>{children}</SetupScreenLayout>;
}
