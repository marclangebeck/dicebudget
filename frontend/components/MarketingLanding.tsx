import Link from "next/link";
import {
  DICEBUDGET_BETA_MAILTO,
  DICEBUDGET_MARKETING,
} from "@/lib/dicebudgetMarketingCopy";
import { APP_HOME_PATH, IMPRESSUM_PATH, PRIVACY_PATH } from "@/lib/branding";

export function MarketingLanding() {
  const copy = DICEBUDGET_MARKETING;

  return (
    <div className="landing-page">
      <header className="landing-header">
        <img
          src="/apple-touch-icon.png"
          alt=""
          width={56}
          height={56}
          className="landing-logo"
          decoding="async"
        />
        <p className="landing-tagline">{copy.eyebrow}</p>
        <h1 className="landing-title">{copy.headline}</h1>
      </header>

      <p className="landing-lead">{copy.lead}</p>
      <p className="landing-lead">{copy.support}</p>

      <p className="landing-trust">
        <strong>{copy.trust}</strong>
      </p>
      <p className="landing-store-hint">{copy.priceNote}</p>

      <div className="landing-actions landing-cta-row">
        <a href={DICEBUDGET_BETA_MAILTO} className="landing-cta">
          {copy.cta.betaLabel}
        </a>
        <a href={copy.cta.poolHref} className="btn-secondary landing-cta-secondary">
          {copy.cta.poolLabel}
        </a>
      </div>
      <Link href={APP_HOME_PATH} className="btn-secondary landing-cta-secondary landing-web-cta">
        {copy.cta.webAppLabel}
      </Link>
      <p className="landing-store-hint">{copy.statusLine}</p>

      <section id={copy.strategy.id} className="landing-block scroll-mt-24">
        <h2 className="landing-block-title">{copy.strategy.title}</h2>
        <p className="landing-lead landing-block-text">{copy.strategy.text}</p>
        <p className="landing-store-hint landing-block-text">{copy.strategy.micro}</p>
      </section>

      <section className="landing-block">
        <h3 className="landing-block-subtitle">{copy.stammrunde.title}</h3>
        <p className="landing-lead landing-block-text">{copy.stammrunde.text}</p>
      </section>

      <section className="landing-block">
        <h2 className="landing-block-title">{copy.paid.title}</h2>
        <p className="landing-lead landing-block-text">{copy.paid.text}</p>
        <p className="landing-store-hint landing-block-text">{copy.priceNote}</p>
      </section>

      <section id="faq" className="landing-block scroll-mt-24">
        <h2 className="landing-block-title">{copy.faq.title}</h2>
        <dl className="landing-faq">
          {copy.faq.items.map((item) => (
            <div key={item.question}>
              <dt>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="landing-footer">
        <Link href={PRIVACY_PATH} className="landing-footer-link">
          Datenschutzerklärung
        </Link>
        {" · "}
        <Link href={IMPRESSUM_PATH} className="landing-footer-link">
          Impressum
        </Link>
      </footer>
    </div>
  );
}
