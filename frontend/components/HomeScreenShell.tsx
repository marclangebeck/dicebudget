"use client";

import type { ReactNode } from "react";
import { AppLegalFooter } from "@/components/AppLegalFooter";
import { useFixedViewport } from "@/lib/useFixedViewport";

type Props = {
  children: ReactNode;
};

export function HomeScreenShell({ children }: Props) {
  useFixedViewport("home-route");

  return (
    <div className="home-screen app-bg h-dvh max-h-dvh min-h-0 w-full max-w-full overflow-hidden">
      {children}
      <AppLegalFooter />
    </div>
  );
}
