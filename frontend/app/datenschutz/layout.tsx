import type { ReactNode } from "react";
import { LegalScrollShell } from "@/components/LegalScrollShell";

export default function DatenschutzLayout({ children }: { children: ReactNode }) {
  return <LegalScrollShell>{children}</LegalScrollShell>;
}
