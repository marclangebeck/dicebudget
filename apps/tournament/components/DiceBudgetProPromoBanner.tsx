"use client";

import {
  PARTICIPANT_APP_BADGE,
  PARTICIPANT_APP_FEATURE_BADGE,
  PARTICIPANT_APP_ICON_URL,
  PARTICIPANT_APP_NAME,
  PARTICIPANT_APP_SUBTITLE,
  PARTICIPANT_APP_TAGLINE,
  participantAppPromoCtaLabel,
  participantAppPromoUrl,
} from "@/lib/branding";

export function DiceBudgetProPromoBanner() {
  const href = participantAppPromoUrl();
  const ctaLabel = participantAppPromoCtaLabel();

  return (
    <aside className="t-pro-banner" aria-label={`${PARTICIPANT_APP_NAME} — Werbung`}>
      <div className="t-pro-banner-glow" aria-hidden />
      <div className="t-pro-banner-inner">
        <div className="t-pro-banner-icon-wrap" aria-hidden>
          <img
            className="t-pro-banner-icon"
            src={PARTICIPANT_APP_ICON_URL}
            alt=""
            width={56}
            height={56}
            decoding="async"
          />
        </div>
        <div className="t-pro-banner-copy">
          <div className="t-pro-banner-badges">
            <span className="t-pro-banner-badge">{PARTICIPANT_APP_BADGE}</span>
            <span className="t-pro-banner-badge t-pro-banner-badge--feature">
              {PARTICIPANT_APP_FEATURE_BADGE}
            </span>
          </div>
          <p className="t-pro-banner-title">{PARTICIPANT_APP_NAME}</p>
          <p className="t-pro-banner-subtitle">{PARTICIPANT_APP_SUBTITLE}</p>
          <p className="t-pro-banner-text">{PARTICIPANT_APP_TAGLINE}</p>
        </div>
        <a
          className="t-pro-banner-cta"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {ctaLabel}
          <span className="t-pro-banner-cta-arrow" aria-hidden>
            ↗
          </span>
        </a>
      </div>
    </aside>
  );
}
