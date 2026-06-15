# Onboarding a SaaS client (single ant-ui build, many tenants)

One static ant-ui build serves every tenant. nginx resolves the tenant from the
request and injects that tenant's **keeper guest site key** into `index.html`.
Adding a client = mint a guest key in keeper + add one line to the nginx tenant
table + reload.

See [`nginx.conf`](./nginx.conf) for the full reference config.

---

## How it works (end to end)

1. Client hits their URL — one of three modes:
   - **dedicated domain** — `acme.com`
   - **subdomain** — `acme.shop.com`
   - **slug** — `shop.com/acme`
2. nginx resolves `$lookup` (host, or first path segment under the shared slug
   host) → looks up `$site_key` in the single tenant table.
3. nginx `sub_filter` injects `<script>window.__TENANT_SITE_KEY__="gk_…"</script>`
   into `index.html`.
4. ant-ui reads `window.__TENANT_SITE_KEY__` (falls back to
   `VITE_GUEST_SITE_KEY` for local dev).
5. ant-ui POSTs the site key to keeper `POST /guest-keys/auth` → receives a
   short-lived guest JWT (claims `app_id` / `division_id` / `user_id`,
   `role=guest`).
6. ant-ui calls ant's **order-intake** secondary listener with that JWT.
   Tenant isolation = the claims, enforced by ant; nginx only routes.

> The site key (`gk_…`) is **publishable** — safe in HTML. The secret is
> keeper's `AUTH.GUEST_JWT_SECRET`, never exposed.

---

## Prerequisites (one time)

- ant-ui `dist` built once and deployed to nginx `root` (e.g. `/var/www/ant-ui`).
- ant-ui reads the injected global. In `src/intake/config.js`:
  ```js
  guestSiteKey: window.__TENANT_SITE_KEY__ ?? import.meta.env.VITE_GUEST_SITE_KEY,
  ```
- nginx built with `ngx_http_sub_module` (default in most builds — verify:
  `nginx -V 2>&1 | grep -o with-http_sub_module`).
- TLS certs: dedicated-domain cert(s) and/or a `*.shop.com` wildcard cert for
  subdomain mode.

---

## Onboard a new client

### Step 1 — Mint a guest key in keeper

The tenant chain: **App → Division → guest User → Guest Key**. The guest key
binds `app_id` + `division_id` (immutable) and a designated guest `user_id`;
those become the guest JWT claims. All endpoints require an admin JWT.

| # | Create | Endpoint | Body | Returns |
|---|--------|----------|------|---------|
| 1 | App (tenant) | `POST /apps` | `{name}` | `app_id` |
| 2 | Division | `POST /divisions` | `{app_id, name}` | `division_id` |
| 3 | Guest user | `POST /users` | `{app_id, division_id, firstname, lastname, email, password, role}` | `user_id` |
| 4 | Guest key | `POST /guest-keys` | `{app_id, division_id, user_id, name}` | **`site_key` (`gk_…`)** |

> Reuse an existing App/Division if the client already exists in keeper — only
> step 4 is strictly required to get a new site key. Give the guest user the
> narrowest role that allows order-intake; it is a real keeper user.

Copy the `site_key` from step 4.

### Step 2 — Add ONE line to the nginx tenant table

Edit the `map $lookup $site_key { … }` block in `nginx.conf`, keyed by mode:

```nginx
# dedicated domain
acme.com         gk_acme_xxxxxxxx;

# subdomain   (needs *.shop.com wildcard cert)
acme.shop.com    gk_acme_xxxxxxxx;

# slug        (served at shop.com/acme)
acme             gk_acme_xxxxxxxx;
```

(For subdomain/dedicated-domain, also ensure the host is covered by a
`server_name` + a valid TLS cert.)

### Step 3 — Validate & reload

```sh
nginx -t && nginx -s reload
```

### Step 4 — Smoke test

```sh
# site key must appear injected in the HTML:
curl -s https://acme.shop.com/ | grep __TENANT_SITE_KEY__

# unknown tenant must 404:
curl -s -o /dev/null -w '%{http_code}\n' https://nope.shop.com/   # → 404
```

Then load the URL in a browser and place a test order through intake.

---

## Off-boarding / rotating

- **Disable a tenant fast:** in keeper set the guest key `status = 0` (deactivate)
  — `POST /guest-keys/auth` then returns 401 for that key immediately. No nginx
  change needed.
- **Remove routing:** delete the tenant's line from the nginx table +
  `nginx -s reload`.
- **Rotate a leaked key:** mint a new guest key in keeper, swap the `gk_…` value
  on the tenant's nginx line, reload. Deactivate the old key.

---

## Mode trade-offs

| Mode | Pros | Cons |
|------|------|------|
| **Subdomain** (`acme.shop.com`) | cleanest; one wildcard cert; root-path SPA (no base juggling) | wildcard cert required |
| **Dedicated domain** (`acme.com`) | client vanity domain; root-path SPA | cert per domain (SAN or ACME automation) |
| **Slug** (`shop.com/acme`) | no new DNS/cert per tenant | SPA router needs a slug-aware `basename`; Vite `base` is build-time, so deep links need care. Avoid unless required. |

Recommendation: prefer **subdomain**, then **dedicated domain**. Use **slug**
only when you cannot provision DNS/certs per tenant.

---

## Gotchas

- **Do not** serve precompressed `index.html` (`gzip_static off` in the inject
  location) — `sub_filter` cannot patch compressed bytes.
- **Do not** inject into `/assets/` — keep bundles untouched for full gzip +
  long cache.
- The tenant table is `http`-level: if certs force multiple `server{}` blocks,
  they all share the one table — the one-line promise still holds.
- Unknown host/slug → `$site_key=""` → `return 404`. Never serves a wrong
  tenant silently.
- Keeper `POST /guest-keys/auth` is rate-limited **10 req/IP/min**. Many tenants
  behind one shared egress IP (corporate NAT/CDN) can collide; the SPA caches
  the token (sessionStorage) so normal per-user traffic is fine.
