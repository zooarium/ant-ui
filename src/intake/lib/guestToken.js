// Keeper guest token — there is no anonymous mode; identity always travels as a
// JWT. The publishable site key is exchanged for a short-lived (~30m), tenant-
// scoped guest JWT that only verifies on the intake host.
//
// Token is cached in memory + sessionStorage (survives reloads within a tab).
// On 401 the HTTP layer calls invalidate() and re-exchanges. A single in-flight
// promise guard prevents an exchange storm when several calls 401 at once.
import { intakeConfig } from '../config';

const KEY = 'intake_guest_token';

let cached = sessionStorage.getItem(KEY) || null;
let inFlight = null;

async function exchange() {
  const res = await fetch(`${intakeConfig.keeperUrl}/guest-keys/auth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ site_key: intakeConfig.guestSiteKey }),
  });
  const body = await res.json().catch(() => null);
  const token = body?.data?.token;
  if (!res.ok || !token) throw new Error(body?.error || 'Could not start a session.');
  cached = token;
  sessionStorage.setItem(KEY, token);
  return token;
}

// Returns a valid guest token, exchanging the site key if none is cached.
export async function getGuestToken() {
  if (cached) return cached;
  if (!inFlight) {
    inFlight = exchange().finally(() => {
      inFlight = null;
    });
  }
  return inFlight;
}

// Drop the cached token so the next getGuestToken() re-exchanges (call on 401).
export function invalidateGuestToken() {
  cached = null;
  sessionStorage.removeItem(KEY);
}
