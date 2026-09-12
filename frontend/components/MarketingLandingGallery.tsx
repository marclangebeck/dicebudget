"use client";

import { useState } from "react";
import { GalleryLightbox } from "@/components/GalleryLightbox";
import { DICEBUDGET_MARKETING } from "@/lib/dicebudgetMarketingCopy";

export function MarketingLandingGallery() {
  const { gallery } = DICEBUDGET_MARKETING;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  return (
    <section className="landing-block landing-gallery" aria-labelledby="landing-gallery-title">
      <h2 id="landing-gallery-title" className="landing-block-title">
        {gallery.title}
      </h2>
      <p className="landing-lead landing-block-text">{gallery.lead}</p>
      <ul className="landing-gallery-grid">
        {gallery.items.map((item, index) => (
          <li key={item.src} className="landing-gallery-item">
            <figure className="landing-gallery-figure">
              <button
                type="button"
                className="landing-gallery-trigger"
                onClick={() => setActiveIndex(index)}
                aria-label={`Vergrößern: ${item.caption}`}
              >
                <span className="landing-gallery-frame">
                  <img
                    src={item.src}
                    alt=""
                    width={390}
                    height={844}
                    className="landing-gallery-image"
                    loading="lazy"
                    decoding="async"
                  />
                </span>
              </button>
              <figcaption className="landing-gallery-caption">{item.caption}</figcaption>
            </figure>
          </li>
        ))}
      </ul>

      <GalleryLightbox
        items={gallery.items}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onActiveIndexChange={setActiveIndex}
      />
    </section>
  );
}
