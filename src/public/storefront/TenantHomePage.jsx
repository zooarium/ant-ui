import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Spinner, Alert, Button, IconAlertTriangle } from '@aviary-ui/ui';
import { usePublicStorefront } from './usePublicStorefront';
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

// Tenant-branded landing ("digital presence"). Fed live by GET /apps/lookup
// (keeper) + GET /public/storefront (ant), merged in usePublicStorefront. Every
// field is placeholder-guarded so a sparse tenant profile still renders.
export default function TenantHomePage() {
  const { sf, isLoading, error, refetch } = usePublicStorefront();
  const [scrolled, setScrolled] = useState(false);

  // Browser tab title = tenant name (replaces the static "App" from index.html).
  useEffect(() => {
    if (sf?.name) document.title = sf.name;
  }, [sf?.name]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <Spinner />
      </div>
    );
  }

  if (error || !sf) {
    return (
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-md-6 text-center">
            <Alert type="error" icon={IconAlertTriangle} className="mb-3">
              {error || 'Could not load this store. Please try again.'}
            </Alert>
            <Button onClick={refetch}>Try again</Button>
          </div>
        </div>
      </div>
    );
  }

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
