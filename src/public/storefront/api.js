// Storefront landing data comes from two public sources, merged by adapt.js:
//   - keeper  GET /apps/lookup?site_key=  → public app profile (name, tagline,
//     logo, about, contact). Public, no auth, rate-limited; mirrors siteKey.js.
//   - ant     GET /public/storefront       → branding, gallery, food tags,
//     platform assessments. Guest-token scoped; fetched via intakeRequest.
import { intakeConfig } from '@/intake/config';
import { intakeRequest } from '@/intake/lib/http';

// Public app profile from keeper. siteKey is the publishable gk_/site key already
// resolved by getSiteKey(). Returns the unwrapped PublicApp object.
export async function fetchPublicApp(siteKey) {
  const url = `${intakeConfig.keeperUrl}/apps/lookup?site_key=${encodeURIComponent(siteKey)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body?.data) {
    throw new Error(body?.error || `Could not load store profile (${res.status}).`);
  }
  return body.data;
}

// Storefront config from ant (guest token). Returns the unwrapped Storefront
// object; the endpoint yields an empty active storefront when none is saved.
export async function fetchPublicStorefront() {
  const res = await intakeRequest('/public/storefront');
  return res?.data ?? {};
}
