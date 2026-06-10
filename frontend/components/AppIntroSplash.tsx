"use client";

import { APP_NAME } from "@/lib/branding";

type Props = {
  progress: number;
};

export function AppIntroSplash({ progress }: Props) {
  const clamped = Math.max(0, Math.min(100, progress));
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="app-intro-splash fixed inset-0 z-50 flex items-center justify-center p-6">
      <div className="app-intro-shell">
        <img
          src="/logo-source.png"
          alt=""
          width={88}
          height={88}
          className="app-intro-logo"
          decoding="async"
        />
        <p className="app-intro-title">{APP_NAME}</p>
        <p className="app-intro-subtitle">Strategy Edition</p>

        <div className="app-intro-progress-wrap">
          <svg viewBox="0 0 120 120" className="app-intro-progress-ring">
            <circle cx="60" cy="60" r={radius} className="app-intro-progress-track" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              className="app-intro-progress-value"
              style={{
                strokeDasharray: `${circumference}px`,
                strokeDashoffset: `${offset}px`,
              }}
            />
          </svg>
          <span className="app-intro-progress-text tabular-nums">{Math.round(clamped)}%</span>
        </div>
      </div>
    </div>
  );
}
