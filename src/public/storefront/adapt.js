// Merge the two public payloads (keeper PublicApp + ant Storefront) into the
// single shape the section components consume. Pure + defensive: every field
// has a placeholder so a missing/empty source never breaks the page.
import DOMPurify from 'dompurify';

// Neutral fallback hero when the tenant hasn't set one yet.
const PLACEHOLDER_HERO =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=2000&q=80';

const slug = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// keeper Contact.address is a structured object; the UI shows one line.
function joinAddress(a) {
  if (!a) return '';
  if (typeof a === 'string') return a;
  return [a.line1, a.line2, a.city, a.state, a.postal_code, a.country]
    .filter(Boolean)
    .join(', ');
}

// keeper Contact.social is a map { platform: url }; the UI wants an array.
function socialArray(map) {
  if (!map || typeof map !== 'object') return [];
  return Object.entries(map)
    .filter(([, url]) => url)
    .map(([platform, url]) => ({ platform, url }));
}

// Flat products → categories, grouped client-side on the denormalized category
// ref. First-appearance order preserved (CategoryRef has no sort field).
// Uncategorized products fall into a trailing "More" bucket. Backend has no
// description/image/tags on products — name + price only.
function groupMenu(products) {
  const byId = new Map();
  for (const p of products) {
    if (p.status !== 1) continue;
    const cat = p.category || {};
    const key = cat.id ?? 0;
    if (!byId.has(key)) byId.set(key, { id: key, name: cat.name || 'More', items: [] });
    byId.get(key).items.push({ id: p.id, name: p.name || '', price: p.price ?? 0 });
  }
  return [...byId.values()];
}

// app: keeper PublicApp, sf: ant Storefront. Either may be empty.
export function adaptStorefront(app = {}, sf = {}) {
  const contact = app.contact || {};
  const about = app.about || {};

  return {
    name: app.name || 'Your store',
    tagline: app.tagline || '',
    branding: {
      logo: app.logo_url || '',
      // No backend field for brand colour — TenantHomePage falls back to #b8482e.
      primaryColor: '',
      heroImage: sf.hero_image || PLACEHOLDER_HERO,
    },
    about: {
      heading: about.heading || '',
      // body may contain HTML (incl. the highlight chips); sanitize before render.
      bodyHtml: DOMPurify.sanitize(about.body || 'Details coming soon.'),
    },
    menu: { categories: groupMenu(sf.products || []) },
    ratings: {
      platforms: (sf.assessments || []).map((a) => ({
        id: slug(a.name) || 'platform',
        name: a.name || '',
        score: a.rating ?? 0,
        // count, deep-link url, and per-review score have no backend field —
        // the Ratings component guards their absence.
        reviews: (a.reviews || []).map((r) => ({
          author: r.author || '',
          text: r.text || '',
        })),
      })),
    },
    gallery: (sf.gallery || [])
      .slice()
      .sort((x, y) => (x.sort ?? 0) - (y.sort ?? 0))
      .map((g) => ({ src: g.url, alt: g.caption || '' }))
      .filter((g) => g.src),
    contact: {
      address: joinAddress(contact.address),
      phone: contact.phone1 || '',
      email: contact.email || '',
      hours: contact.hours || '', // free-text string; Contact renders as-is
      social: socialArray(contact.social),
    },
  };
}
