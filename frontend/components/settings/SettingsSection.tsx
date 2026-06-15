"use client";

import type { ReactNode } from "react";

type Props = {
  id: string;
  title: string;
  summary?: string;
  variant?: "default" | "labs";
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function SettingsSection({
  id,
  title,
  summary,
  variant = "default",
  open,
  onToggle,
  children,
}: Props) {
  const panelId = `settings-section-${id}`;

  return (
    <section
      className={`settings-section ${open ? "is-open" : ""} ${variant === "labs" ? "settings-section--labs" : ""}`}
    >
      <button
        type="button"
        className="settings-section-trigger"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span className="settings-section-trigger-copy">
          <span className="settings-section-trigger-title">{title}</span>
          {summary && <span className="settings-section-trigger-summary">{summary}</span>}
        </span>
        <span className="settings-section-trigger-chevron" aria-hidden />
      </button>
      <div id={panelId} className="settings-section-panel" aria-hidden={!open}>
        <div className="settings-section-panel-inner">{children}</div>
      </div>
    </section>
  );
}
