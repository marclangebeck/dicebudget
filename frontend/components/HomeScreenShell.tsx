"use client";

import type { ReactNode } from "react";
import { useFixedViewport } from "@/lib/useFixedViewport";

type Props = {
  children: ReactNode;
};

export function HomeScreenShell({ children }: Props) {
  useFixedViewport("home-route");

  return (
    <div className="home-screen app-bg flex h-dvh max-h-dvh min-h-0 w-full max-w-full flex-col overflow-hidden">
      {children}
    </div>
  );
}
