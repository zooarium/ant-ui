import React from 'react';

// Gallery — responsive HD image grid. Images lazy-load below the fold.
export default function Gallery({ gallery = [] }) {
  if (!gallery.length) return null;
  return (
    <section id="gallery" className="sf-section sf-section--muted">
      <div className="container">
        <p className="sf-eyebrow">Gallery</p>
        <h2 className="sf-section__title">Step inside</h2>
        <div className="sf-gallery">
          {gallery.map((g, i) => (
            <figure key={g.src} className={`sf-gallery__item${i % 5 === 0 ? ' sf-gallery__item--wide' : ''}`}>
              <img src={g.src} alt={g.alt || ''} loading="lazy" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
