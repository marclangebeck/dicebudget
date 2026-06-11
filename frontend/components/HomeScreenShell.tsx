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
    <div className="home-screen app-bg relative h-dvh max-h-dvh min-h-0 w-full max-w-full overflow-hidden">
      <a href="#main-content" className="skip-link">
        Zum Inhalt
      </a>
      <div id="main-content" tabIndex={-1} className="min-h-0 flex-1 outline-none">
        {children}
      </div>
      <AppLegalFooter />
    </div>
  );
}
