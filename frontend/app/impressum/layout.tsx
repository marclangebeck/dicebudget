import type { ReactNode } from "react";
import { LegalScrollShell } from "@/components/LegalScrollShell";

export default function ImpressumLayout({ children }: { children: ReactNode }) {
  return <LegalScrollShell>{children}</LegalScrollShell>;
}
