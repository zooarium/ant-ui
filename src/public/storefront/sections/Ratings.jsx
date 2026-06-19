import React, { useState } from 'react';
import { IconStar, IconStarFilled, IconStarHalfFilled, IconBrandGoogle } from '@tabler/icons-react';

function Stars({ score, size = 18 }) {
  return (
    <span className="sf-stars" aria-label={`${score} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => {
        if (score >= i) return <IconStarFilled key={i} size={size} />;
        if (score >= i - 0.5) return <IconStarHalfFilled key={i} size={size} />;
        return <IconStar key={i} size={size} />;
      })}
    </span>
  );
}

// Brand mark per platform. Google ships a tabler brand icon; Swiggy/Zomato have
// none, so we render a coloured wordmark chip in their brand colour.
const BRAND = {
  swiggy: '#fc8019',
  zomato: '#e23744',
};
function PlatformMark({ platform, size = 26 }) {
  if (platform.id === 'google') return <IconBrandGoogle size={size} />;
  return (
    <span className="sf-platform-mark" style={{ background: BRAND[platform.id] || 'var(--sf-primary)' }}>
      {platform.name}
    </span>
  );
}

// Ratings — per-platform aggregate score + review cards, one tab per platform
// (Google / Swiggy / Zomato). Platforms are synced from each provider by the
// backend and served inside the storefront payload; this component only renders.
export default function Ratings({ ratings }) {
  const platforms = ratings?.platforms ?? [];
  const [active, setActive] = useState(0);
  if (!platforms.length) return null;

  const current = platforms[active] ?? platforms[0];
  const reviews = current.reviews ?? [];

  return (
    <section id="ratings" className="sf-section">
      <div className="container">
        <p className="sf-eyebrow">Reviews</p>
        <h2 className="sf-section__title">Loved by our guests</h2>

        {platforms.length > 1 && (
          <div className="sf-rating-tabs" role="tablist">
            {platforms.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={i === active}
                className={`sf-rating-tab${i === active ? ' sf-rating-tab--active' : ''}`}
                onClick={() => setActive(i)}
              >
                <PlatformMark platform={p} size={18} />
                <span>{p.name}</span>
                <span className="sf-rating-tab__score">{p.score.toFixed(1)}</span>
              </button>
            ))}
          </div>
        )}

        <div className="sf-google-rating">
          <PlatformMark platform={current} />
          <span className="sf-google-rating__score">{current.score.toFixed(1)}</span>
          <Stars score={current.score} size={22} />
          <span className="sf-google-rating__count">
            {current.count.toLocaleString()} {current.name} reviews
          </span>
          {current.url && (
            <a className="btn btn-sm btn-outline-secondary ms-2" href={current.url}
               target="_blank" rel="noreferrer">
              View on {current.name}
            </a>
          )}
        </div>

        {reviews.length > 0 ? (
          <div className="row g-3 mt-2">
            {reviews.map((r) => (
              <div key={r.author} className="col-12 col-md-4">
                <blockquote className="sf-review">
                  <Stars score={r.score} />
                  <p className="sf-review__text">“{r.text}”</p>
                  <footer className="sf-review__author">— {r.author}</footer>
                </blockquote>
              </div>
            ))}
          </div>
        ) : (
          <p className="sf-lead mt-2">No written reviews on {current.name} yet.</p>
        )}
      </div>
    </section>
  );
}
