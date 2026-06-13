// Minimal cookie helpers for small UI-preference values (no deps).

export function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// Defaults to a 1-year, root-path, Lax cookie — fine for non-sensitive UI prefs.
export function setCookie(name, value, { days = 365, path = '/', sameSite = 'Lax' } = {}) {
  const maxAge = days * 24 * 60 * 60;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=${path}; SameSite=${sameSite}`;
}
