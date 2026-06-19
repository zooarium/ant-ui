import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { STOREFRONT } from './data';
import Hero from './sections/Hero';
import About from './sections/About';
import Menu from './sections/Menu';
import Ratings from './sections/Ratings';
import Gallery from './sections/Gallery';
import Contact from './sections/Contact';
import './storefront.css';

const NAV = [
  { id: 'about', label: 'About' },
  { id: 'menu', label: 'Menu' },
  { id: 'ratings', label: 'Reviews' },
  { id: 'gallery', label: 'Gallery' },
  { id: 'contact', label: 'Contact' },
];

// Tenant-branded landing ("digital presence"). Currently fed by dummy data
// (src/public/storefront/data.js); swap to GET /public/storefront when the
// endpoint ships — the shape matches.
export default function TenantHomePage() {
  const sf = STOREFRONT;
  const [scrolled, setScrolled] = useState(false);

  // Browser tab title = tenant name (replaces the static "App" from index.html).
  useEffect(() => {
    if (sf.name) document.title = sf.name;
  }, [sf.name]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="sf" style={{ '--sf-primary': sf.branding?.primaryColor || '#b8482e' }}>
      <nav className={`sf-nav${scrolled ? ' sf-nav--solid' : ''}`}>
        <div className="container sf-nav__inner">
          <a href="#top" className="sf-nav__brand">{sf.name}</a>
          <div className="sf-nav__links">
            {NAV.map((n) => (
              <a key={n.id} href={`#${n.id}`} className="sf-nav__link">{n.label}</a>
            ))}
          </div>
          <Link to="/intake" className="btn btn-sm sf-btn-primary">Order</Link>
        </div>
      </nav>

      <span id="top" />
      <Hero name={sf.name} tagline={sf.tagline} heroImage={sf.branding?.heroImage} />
      <About about={sf.about} />
      <Menu menu={sf.menu} />
      <Ratings ratings={sf.ratings} />
      <Gallery gallery={sf.gallery} />
      <Contact contact={sf.contact} />

      <footer className="sf-footer">
        <div className="container d-flex flex-wrap justify-content-between align-items-center gap-2">
          <span>© {sf.name}</span>
          <Link to="/intake" className="btn btn-sm sf-btn-primary">Order now</Link>
        </div>
      </footer>
    </div>
  );
}
