// Tenant resolution from the URL — no network. One public build serves many
// tenants across three tiers:
//   Enterprise — own domain        acme.com            → tenantKey "acme.com",        basename "/"
//   Medium     — subdomain          acme.shop.com       → tenantKey "acme.shop.com",   basename "/"
//   Small      — reserved /s/ slug  shop.com/s/acme     → tenantKey "shop.com/s/acme", basename "/s/acme"
//
// The "/s/" namespace is reserved so tenant slugs never collide with app routes
// (/admin lives on its own domain; /intake, etc. are real routes). tenantKey is
// what we send to keeper GET /guest-keys/lookup and what we key all caches by.
const SLUG_PREFIX = 's';

export function resolveTenant(loc = window.location) {
  const host = loc.host.toLowerCase();
  const segs = loc.pathname.split('/').filter(Boolean);

  if (segs[0] === SLUG_PREFIX && segs[1]) {
    const slug = segs[1].toLowerCase();
    return { tenantKey: `${host}/${SLUG_PREFIX}/${slug}`, basename: `/${SLUG_PREFIX}/${slug}` };
  }
  return { tenantKey: host, basename: '/' };
}
