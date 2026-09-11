import Link from "next/link";
import { MARKETING_LANDING } from "@/lib/marketingLandingContent";

export function MarketingLanding() {
  const { hero, strategy, stammrunde, paid, faq, footer } = MARKETING_LANDING;

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
        <p className="landing-tagline">{hero.eyebrow}</p>
        <h1 className="landing-title">{hero.headline}</h1>
      </header>

      <p className="landing-lead">{hero.lead}</p>
      <p className="landing-lead">{hero.supportLine}</p>

      <p className="landing-trust">
        <strong>{hero.trustPrice}</strong>
      </p>
      <p className="landing-store-hint">{hero.priceNote}</p>

      <div className="landing-actions landing-cta-row">
        <Link href={hero.primaryCta.href} className="landing-cta">
          {hero.primaryCta.label}
        </Link>
        <a href={hero.secondaryCta.href} className="btn-secondary landing-cta-secondary">
          {hero.secondaryCta.label}
        </a>
      </div>
      <p className="landing-store-hint">{hero.statusLine}</p>

      <section id={strategy.id} className="landing-block scroll-mt-24">
        <h2 className="landing-block-title">{strategy.title}</h2>
        {strategy.paragraphs.map((paragraph) => (
          <p key={paragraph} className="landing-lead landing-block-text">
            {paragraph}
          </p>
        ))}
        <ul className="landing-features">
          {strategy.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="landing-block">
        <h3 className="landing-block-subtitle">{stammrunde.title}</h3>
        {stammrunde.paragraphs.map((paragraph) => (
          <p key={paragraph} className="landing-lead landing-block-text">
            {paragraph}
          </p>
        ))}
        <p className="landing-join-url">
          <a href={stammrunde.joinUrl} className="landing-footer-link">
            {stammrunde.joinLinkLabel}
          </a>
          <br />
          <span className="landing-store-hint">{stammrunde.joinUrl}</span>
        </p>
      </section>

      <section className="landing-block">
        <h2 className="landing-block-title">{paid.title}</h2>
        <p className="landing-trust">
          <strong>{paid.priceLine}</strong>
        </p>
        <p className="landing-store-hint">{paid.note}</p>
      </section>

      <section className="landing-block">
        <h2 className="landing-block-title">{faq.title}</h2>
        <dl className="landing-faq">
          {faq.items.map((item) => (
            <div key={item.question}>
              <dt>{item.question}</dt>
              <dd>{item.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <footer className="landing-footer">
        <Link href={footer.privacyHref} className="landing-footer-link">
          Datenschutzerklärung
        </Link>
        {" · "}
        <Link href={footer.impressumHref} className="landing-footer-link">
          Impressum
        </Link>
      </footer>
    </div>
  );
}
