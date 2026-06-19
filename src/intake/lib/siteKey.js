// Runtime site-key resolution. Replaces the old build-time VITE_GUEST_SITE_KEY:
// one build serves many tenants, each resolved from the URL via keeper's public
// GET /guest-keys/lookup?url=<tenantKey> → { site_key }.
//
// Cache is keyed by tenantKey — critical, because small-biz tenants share the
// shop.com origin, so a flat key would leak one tenant's site key to another's
// /s/<slug>. site_key is publishable, so localStorage is fine (long-lived; the
// domain→key mapping is stable). An in-flight guard de-dups concurrent lookups.
import { intakeConfig } from '../config';
import { resolveTenant } from '@/infra/tenant';

// Thrown when keeper has no active key for this URL (404). Callers render a soft
// "store not found" page (HTTP 200), never a hard browser 404.
export class TenantNotFound extends Error {
  constructor(tenantKey) {
    super(`No tenant registered for "${tenantKey}".`);
    this.name = 'TenantNotFound';
    this.tenantKey = tenantKey;
  }
}

const skKey = (tenantKey) => `sk:${tenantKey}`;

const inFlight = new Map(); // tenantKey → Promise<string>

async function lookup(tenantKey) {
  const url = `${intakeConfig.keeperUrl}/guest-keys/lookup?url=${encodeURIComponent(tenantKey)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });

  if (res.status === 404) throw new TenantNotFound(tenantKey);
  const body = await res.json().catch(() => null);
  const siteKey = body?.data?.site_key;
  if (!res.ok || !siteKey) {
    throw new Error(body?.error || `Could not resolve this store (${res.status}).`);
  }

  localStorage.setItem(skKey(tenantKey), siteKey);
  return siteKey;
}

// Resolve the publishable site key for the current URL. Returns a cached value
// when present; otherwise looks it up (de-duped across concurrent callers).
export async function getSiteKey() {
  const { tenantKey } = resolveTenant();

  const cachedKey = localStorage.getItem(skKey(tenantKey));
  if (cachedKey) return cachedKey;

  if (!inFlight.has(tenantKey)) {
    inFlight.set(tenantKey, lookup(tenantKey).finally(() => inFlight.delete(tenantKey)));
  }
  return inFlight.get(tenantKey);
}

// Drop the cached site key so the next getSiteKey() re-looks-up. Called when a
// guest-token exchange keeps failing (key deactivated/rotated/offboarded).
export function invalidateSiteKey() {
  const { tenantKey } = resolveTenant();
  localStorage.removeItem(skKey(tenantKey));
}
