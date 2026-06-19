import React from 'react';
import { Link } from 'react-router-dom';
import { IconToolsKitchen2, IconChevronDown } from '@tabler/icons-react';

// Full-bleed hero — tenant name, tagline, HD background, primary order CTA.
export default function Hero({ name, tagline, heroImage }) {
  return (
    <header className="sf-hero" style={{ backgroundImage: `url(${heroImage})` }}>
      <div className="sf-hero__scrim" />
      <div className="sf-hero__content container text-center text-white">
        <div className="sf-hero__badge">
          <IconToolsKitchen2 size={18} /> <span>Authentic · Fresh · Daily</span>
        </div>
        <h1 className="sf-hero__title">{name}</h1>
        <p className="sf-hero__tagline">{tagline}</p>
        <div className="sf-hero__cta">
          <Link to="/intake" className="btn btn-lg sf-btn-primary">
            Order now
          </Link>
          <a href="#menu" className="btn btn-lg btn-outline-light">
            View menu
          </a>
        </div>
      </div>
      <a href="#about" className="sf-hero__scroll" aria-label="Scroll to content">
        <IconChevronDown size={28} />
      </a>
    </header>
  );
}
