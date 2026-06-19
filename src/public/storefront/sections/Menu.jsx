import React from 'react';
import { Badge } from '@aviary-ui/ui';

// Menu — categories of dishes with thumbnail, description, price, diet/tag badges.
export default function Menu({ menu }) {
  const categories = menu?.categories ?? [];
  if (!categories.length) return null;

  return (
    <section id="menu" className="sf-section sf-section--muted">
      <div className="container">
        <p className="sf-eyebrow">Our menu</p>
        <h2 className="sf-section__title">A taste of the kitchen</h2>

        {categories.map((cat) => (
          <div key={cat.name} className="sf-menu-cat">
            <h3 className="sf-menu-cat__name">{cat.name}</h3>
            <div className="row g-3">
              {cat.items.map((item) => (
                <div key={item.name} className="col-12 col-md-6">
                  <article className="sf-dish">
                    {item.image && (
                      <img
                        className="sf-dish__img"
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                      />
                    )}
                    <div className="sf-dish__body">
                      <div className="sf-dish__head">
                        <h4 className="sf-dish__name">{item.name}</h4>
                        <span className="sf-dish__price">{item.price}</span>
                      </div>
                      <p className="sf-dish__desc">{item.desc}</p>
                      <div className="sf-dish__tags">
                        {item.tags?.map((t) => (
                          <Badge key={t} className="me-1 text-uppercase">
                            {t}
                          </Badge>
                        ))}
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
