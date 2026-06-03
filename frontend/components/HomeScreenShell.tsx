"use client";

import type { ReactNode } from "react";
import { useFixedViewport } from "@/lib/useFixedViewport";

type Props = {
  children: ReactNode;
};

export function HomeScreenShell({ children }: Props) {
  useFixedViewport("home-route");

  return (
    <div className="home-screen app-bg flex min-h-dvh w-full max-w-full flex-col overflow-x-hidden overflow-y-auto">
      {children}
    </div>
  );
}
