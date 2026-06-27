import React from 'react';
import { money } from '@/intake/lib/format';

// Menu — products grouped by category (grouped client-side in adapt.js). Backend
// carries name + price only (no image/description/tags), so each dish is a
// single line. Empty menu falls back to a "coming soon" placeholder so the
// #menu nav anchor stays intact.
export default function Menu({ menu }) {
  const categories = (menu?.categories ?? []).filter((c) => c.items.length);

  if (!categories.length) {
    return (
      <section id="menu" className="sf-section sf-section--muted">
        <div className="container text-center">
          <p className="sf-eyebrow">Our menu</p>
          <h2 className="sf-section__title">Menu coming soon</h2>
          <p className="sf-lead mx-auto">Our full menu will be available here shortly.</p>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="sf-section sf-section--muted">
      <div className="container">
        <p className="sf-eyebrow">Our menu</p>
        <h2 className="sf-section__title">A taste of the kitchen</h2>

        {categories.map((cat) => (
          <div key={cat.id} className="sf-menu-cat">
            <h3 className="sf-menu-cat__name">{cat.name}</h3>
            <div className="row g-3">
              {cat.items.map((item) => (
                <div key={item.id} className="col-12 col-md-6">
                  <article className="sf-dish">
                    <div className="sf-dish__body">
                      <div className="sf-dish__head">
                        <h4 className="sf-dish__name">{item.name}</h4>
                        <span className="sf-dish__price">{money(item.price)}</span>
                      </div>
                    </div>
                  </article>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
