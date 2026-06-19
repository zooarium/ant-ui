# Multi-tenant SaaS — one build, many tenants

`ant-ui` ships **one public build** that serves every SaaS tenant. The tenant is
resolved at **runtime from the URL** — there is no per-tenant build, no per-tenant
env var, and no nginx change to onboard a customer. Admin ships as a **separate
build on its own domain** and is never part of tenant resolution.

---

## Contents

- [Tenant tiers](#tenant-tiers)
- [How resolution works](#how-resolution-works)
- [The lookup endpoint](#the-lookup-endpoint)
- [Caching](#caching)
- [Admin / public split](#admin--public-split)
- [Onboarding a tenant](#onboarding-a-tenant)
- [Local development](#local-development)
- [Code map](#code-map)
- [Error handling](#error-handling)
- [Security notes](#security-notes)

---

## Tenant tiers

| Tier | URL shape | Example | DNS / TLS |
|------|-----------|---------|-----------|
| **Enterprise** | own domain | `acme.com` | customer points DNS at us; cert per domain (ACME/SAN) |
| **Medium** | subdomain | `acme.shop.com` | one `*.shop.com` wildcard cert covers all |
| **Small** | reserved slug | `shop.com/s/acme` | none — reuses `shop.com` cert |

The `/s/` segment is a **reserved namespace** for small-biz slugs. It keeps tenant
slugs from ever colliding with application routes (`/intake`, etc.) or with admin
(which lives on its own domain). A tenant can never be named such that
`shop.com/admin` or `shop.com/intake` is ambiguous.

---

## How resolution works

Every request is decomposed into **`[tenant key] + [in-app route]`**.

```
acme.com/intake            → tenantKey "acme.com"          · basename "/"        · route "/intake"
acme.shop.com/intake       → tenantKey "acme.shop.com"     · basename "/"        · route "/intake"
shop.com/s/acme/intake     → tenantKey "shop.com/s/acme"   · basename "/s/acme"  · route "/intake"
shop.com/s/acme            → tenantKey "shop.com/s/acme"   · basename "/s/acme"  · route "/"
```

- **Enterprise / Medium** — identity is the **host**. `basename` stays `/`, so
  every path under that host is automatically the tenant's.
- **Small** — identity is `host + /s/<slug>`. The router `basename` is
  `/s/<slug>`, which strips the prefix so in-app routes (`/`, `/intake`) stay
  stable. Deep links and refreshes work because the basename is recomputed from
  the URL on every load.

`resolveTenant()` does this with **no network call** — it only reads
`window.location`. The result feeds the router `basename` and the cache keys.

Boot sequence for a guest surface:

```
1. resolveTenant()                         → { tenantKey, basename }   (sync)
2. GET  {keeper}/guest-keys/lookup?url=<tenantKey>   → { site_key }     (cached)
3. POST {keeper}/guest-keys/auth { site_key }        → { token }        (cached)
4. intake calls → Bearer <token> → ant order-intake listener
```

Steps 2–3 run once and are cached (see [Caching](#caching)); the token exchange
is lazy (fires on the first intake API call).

---

## The lookup endpoint

Provided by **keeper** (no ant-ui or backend change needed here):

```
GET /guest-keys/lookup?url=<tenantKey>
```

- **Public**, no auth, **hard rate-limited** (returns `429` when exceeded).
- The `url` is normalized server-side: scheme and **port stripped**, host
  lowercased, matched as `host` or `host[+path]`, **exact match**.
- Returns only the publishable site key — never the tenant binding:

```json
{ "data": { "site_key": "gk_…" } }
```

Responses the UI branches on:

| Status | Meaning | UI behavior |
|--------|---------|-------------|
| `200` | site key found | proceed to auth → intake |
| `404` | no active key for this URL | render soft **Store not found** page (HTTP 200, not a hard browser 404) |
| `429` | rate limited | show transient error + **Try again** |
| `5xx` | server/transient | show transient error + **Try again** |

The guest key's `domain` field (set at creation) is unique, so one URL resolves
to exactly one tenant. There is no way to override the tenant per request.

---

## Caching

Resolution + token are cached so the two boot round-trips happen once.

**Cache keys are namespaced by `tenantKey`. This is mandatory** — small-biz
tenants all share the `shop.com` origin, so a flat key (e.g. `"site_key"`) would
hand one tenant's key/token to another tenant's `/s/<slug>` in the same browser.

| Cache | Storage | Key | Lifetime | Why |
|-------|---------|-----|----------|-----|
| site key | `localStorage` | `sk:<tenantKey>` | long (URL→key is stable) | publishable; avoids a lookup every visit |
| guest JWT | `sessionStorage` | `tok:<tenantKey>` | short (~30m, until `expires_at`) | bearer credential — smaller XSS window, clears on tab close |

**Invalidation** (handled automatically):
- `401` from auth or intake → drop the cached **token**, re-exchange once.
- If the re-exchange itself `401`s (key deactivated / rotated / offboarded) →
  drop the cached **site key** too, forcing a fresh lookup on the next call.

---

## Admin / public split

Two Vite entries, two bundles, two domains:

| | Public app | Admin app |
|---|-----------|-----------|
| Entry | `index.html` → `src/main.jsx` | `admin.html` → `src/admin-main.jsx` |
| Router | `PublicRouter` (`/`, `/intake`) | `AdminRouter` (`/admin/*`) |
| Domain | tenant domain / subdomain / `shop.com/s/<slug>` | `admin.shop.com` |
| Tenant identity | resolved from URL (site-key lookup) | from **login JWT** (`app_id` / `division_id` claims) |
| Auth | keeper guest token | admin JWT (`@aviary-ui/core`, refresh flow) |

Admin needs **no** site-key lookup and **no** URL tenant resolution — one admin app
serves all tenants, each recognized from their login. Because admin is a separate
bundle, admin code never ships to tenant users, and the public router carries no
`/admin` routes (so the `/s/<slug>` basename wraps the public app cleanly).

Deploy: a single `vite build` emits `dist/index.html` (+ `main-*` chunk) and
`dist/admin.html` (+ `admin-*` chunk). Serve `admin.html` on `admin.shop.com`;
serve `index.html` (SPA fallback) on every tenant host.

---

## Onboarding a tenant

After this lands, onboarding a customer is **one keeper write** — no env, no
rebuild, no nginx, no deploy:

```
POST /guest-keys
{
  "app_id":      <tenant app>,
  "division_id": <tenant division>,
  "user_id":     <designated guest user>,
  "name":        "Acme storefront",
  "domain":      "<see below>"
}
```

| Tier | `domain` value |
|------|----------------|
| Enterprise | `acme.com` |
| Medium | `acme.shop.com` |
| Small | `shop.com/s/acme` |

Prerequisite: the tenant's **App → Division → guest User** must already exist in
keeper (the guest key binds an existing user). Per-tier infra still applies:
Enterprise needs the customer's DNS + a TLS cert; Medium needs a subdomain DNS row
(or rely on wildcard DNS); Small needs nothing.

Off-board / suspend: set the guest key `status = 0` in keeper — `lookup`/`auth`
then fail and the cached token expires, with no UI change. Rotate a leaked key:
mint a new key for the same `domain`, deactivate the old one.

---

## Local development

The site key is resolved from the URL, so dev needs a keeper guest key whose
`domain` matches your dev host. The server strips the port, so `localhost:5173`
normalizes to `localhost`.

1. Register a keeper guest key (admin JWT required):

   ```
   POST /guest-keys
   { "app_id": 1, "division_id": 1, "user_id": <guest user>, "name": "dev", "domain": "localhost" }
   ```

   For a slug tenant in dev, also register `"domain": "localhost/s/acme"`.

2. Run the public app:

   ```sh
   npm run dev
   ```

3. Open the surface:

   | URL | Resolves as |
   |-----|-------------|
   | `http://localhost:5173/intake` | tenantKey `localhost` (host mode) |
   | `http://localhost:5173/s/acme/intake` | tenantKey `localhost/s/acme` (slug mode, basename `/s/acme`) |

   The Network tab should show `GET /guest-keys/lookup?url=localhost` → `200`,
   then `POST /guest-keys/auth` → `200`, then `/public/*` intake calls.

There is **no `VITE_GUEST_SITE_KEY`** — do not add one. `VITE_KEEPER_URL` and
`VITE_INTAKE_URL` are still required (they point the UI at keeper and the ant
order-intake listener).

---

## Code map

| Concern | File |
|---------|------|
| URL → tenant key + basename (app-wide) | `src/infra/tenant.js` (`resolveTenant`) |
| Site-key lookup + cache | `src/intake/lib/siteKey.js` (`getSiteKey`, `invalidateSiteKey`, `TenantNotFound`) |
| Guest token exchange + cache | `src/intake/lib/guestToken.js` (`getGuestToken`, `invalidateGuestToken`) |
| Intake HTTP client (Bearer + 401 retry) | `src/intake/lib/http.js` |
| Gate the intake surface | `src/intake/components/TenantGate.jsx` |
| Soft not-found page | `src/intake/pages/TenantNotFoundPage.jsx` |
| Tenant landing page + sections | `src/public/storefront/` (`TenantHomePage.jsx`, `sections/`, `data.js`) |
| Public router (tenant basename) | `src/infra/router/PublicRouter.jsx` |
| Admin router (separate domain) | `src/infra/router/AdminRouter.jsx` |
| Public entry | `index.html` → `src/main.jsx` |
| Admin entry | `admin.html` → `src/admin-main.jsx` |
| Two-entry build | `vite.config.js` (`build.rollupOptions.input`) |

---

## Tenant storefront (landing page)

Each tenant gets a branded single-page **digital presence** at the public root
(`/`, or `/s/<slug>/` for small-biz), rendered by
`src/public/storefront/TenantHomePage.jsx`. Sections: **Hero + order CTA, About
Us, Menu, Ratings, Gallery, Contact** (working hours + social links). The order
CTA links to `/intake` via a react-router `Link`, so the tenant basename is
preserved (`/s/acme/` → `/s/acme/intake`).

**Status:** the page currently renders from dummy data
(`src/public/storefront/data.js`), shaped exactly like the future endpoint so the
swap is a one-line data-source change.

**Future endpoint** — `GET /public/storefront` (ant order-intake listener,
guest-token scoped, tenant from JWT claims; add to the listener allow-list):

```jsonc
{ "data": {
  "name": "...", "tagline": "...",
  "branding": { "logo": "url", "primaryColor": "#.." },
  "about":   { "heading": "...", "body": "...", "highlights": [ { "label":"..", "detail":".." } ] },
  "menu":    { "categories": [ { "name": "Starters",
                 "items": [ { "name":"..", "desc":"..", "price":"..", "tags":["veg"], "image":"url" } ] } ] },
  "ratings": { "google": { "score": 4.7, "count": 1284, "url": "https://..." },
               "reviews": [ { "author":"..", "score":5, "text":".." } ] },
  "gallery": [ { "src":"url", "alt":".." } ],
  "contact": { "address":"..", "phone":"..", "email":"..",
               "hours":  [ { "day":"Mon", "open":"12:00", "close":"22:00" } ],
               "social": [ { "platform":"instagram", "url":"https://..." } ] } } }
```

- **Ratings** are kept fresh by a backend job that syncs the Google Places rating
  into `ratings.google`; the UI only renders the served value.
- **Images** in the mock use Unsplash hotlinks; the live endpoint returns
  tenant-supplied asset URLs.

## Error handling

- The keeper `404` from `lookup` is **data**, not a navigation. The SPA always
  serves `200 text/html` and **renders** a branded "Store not found" component.
  Never a hard browser 404.
- `TenantGate` distinguishes:
  - `404` (`TenantNotFound`) → `TenantNotFoundPage` — "no such store".
  - `429` / `5xx` / network → transient error with **Try again**.
- Bare `shop.com` with no `/s/<slug>` is **not a tenant** — those are
  platform-level routes (marketing, platform admin), separate from any customer.

---

## Security notes

- The site key (`gk_…`) is **publishable** — safe to expose in the browser and in
  `localStorage`. Tenant isolation lives in the **guest JWT claims**
  (`app_id` / `division_id`), enforced by ant, not in the UI.
- The guest token is a bearer credential — kept in `sessionStorage` (clears on tab
  close), never `localStorage`.
- Cache keys **must** be namespaced by `tenantKey` (shared-origin leak otherwise).
- `lookup` and `auth` are both rate-limited; the UI caches aggressively so normal
  per-user traffic never approaches the limits.
