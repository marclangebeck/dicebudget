import type { Viewport } from "next";
import type { ReactNode } from "react";
import { PlayScreenShell } from "@/components/PlayScreenShell";

/** Spielseite: kein Pinch-Zoom, feste Skalierung. */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#d5c5ad",
};

export default function PlayLayout({ children }: { children: ReactNode }) {
  return <PlayScreenShell>{children}</PlayScreenShell>;
}
