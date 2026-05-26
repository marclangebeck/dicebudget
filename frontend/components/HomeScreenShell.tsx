"use client";

import type { ReactNode } from "react";
import { FixedScreenShell } from "@/components/FixedScreenShell";

type Props = {
  children: ReactNode;
};

export function HomeScreenShell({ children }: Props) {
  return <FixedScreenShell routeClass="home-route">{children}</FixedScreenShell>;
}
