// Keeper guest token — there is no anonymous mode; identity always travels as a
// JWT. The publishable site key (resolved at runtime from the URL, see siteKey.js)
// is exchanged for a short-lived (~30m), tenant-scoped guest JWT that only
// verifies on the intake host.
//
// Token is cached in memory + sessionStorage, keyed by tenantKey — small-biz
// tenants share the shop.com origin, so a flat key would hand one tenant's token
// to another's /s/<slug>. On 401 the HTTP layer calls invalidate() and
// re-exchanges; if the exchange itself 401s (site key deactivated/rotated) we
// drop the cached site key so the next call re-looks-up. A per-tenant in-flight
// promise prevents an exchange storm when several calls 401 at once.
import { intakeConfig } from '../config';
import { resolveTenant } from '@/infra/tenant';
import { getSiteKey, invalidateSiteKey } from './siteKey';

const tokKey = (tenantKey) => `tok:${tenantKey}`;

const cache = new Map();    // tenantKey → token
const inFlight = new Map(); // tenantKey → Promise<string>

async function exchange(tenantKey) {
  const siteKey = await getSiteKey();
  const res = await fetch(`${intakeConfig.keeperUrl}/guest-keys/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ site_key: siteKey }),
  });
  const body = await res.json().catch(() => null);
  const token = body?.data?.token;
  if (!res.ok || !token) {
    // A stale/rotated/deactivated site key fails auth — force a fresh lookup next time.
    if (res.status === 401) invalidateSiteKey();
    throw new Error(body?.error || 'Could not start a session.');
  }
  cache.set(tenantKey, token);
  sessionStorage.setItem(tokKey(tenantKey), token);
  return token;
}

// Returns a valid guest token for the current tenant, exchanging if none cached.
export async function getGuestToken() {
  const { tenantKey } = resolveTenant();

  const cached = cache.get(tenantKey) || sessionStorage.getItem(tokKey(tenantKey));
  if (cached) return cached;

  if (!inFlight.has(tenantKey)) {
    inFlight.set(tenantKey, exchange(tenantKey).finally(() => inFlight.delete(tenantKey)));
  }
  return inFlight.get(tenantKey);
}

// Drop the cached token so the next getGuestToken() re-exchanges (call on 401).
export function invalidateGuestToken() {
  const { tenantKey } = resolveTenant();
  cache.delete(tenantKey);
  sessionStorage.removeItem(tokKey(tenantKey));
}
