"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  variant?: "default" | "labs";
  children: ReactNode;
};

export function SettingsGroup({ title, variant = "default", children }: Props) {
  return (
    <section
      className={`settings-group${variant === "labs" ? " settings-group--labs" : ""}`}
    >
      <h2 className="settings-group-label">{title}</h2>
      <div className="settings-group-panel">{children}</div>
    </section>
  );
}
