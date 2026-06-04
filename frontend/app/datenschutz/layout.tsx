import type { Viewport } from "next";
import type { ReactNode } from "react";
import { LegalScrollShell } from "@/components/LegalScrollShell";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#d5c5ad",
};

export default function DatenschutzLayout({ children }: { children: ReactNode }) {
  return <LegalScrollShell>{children}</LegalScrollShell>;
}
