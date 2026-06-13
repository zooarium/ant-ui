// Google reCAPTCHA v3 — load the script once, execute per write action, send the
// token as the X-Recaptcha-Token header (never in the body).
//
// When no site key is configured (dev), execute() resolves '' and the header is
// omitted — the backend runs with captcha disabled there. Production sets the key
// and flips verification on; no UI change needed.
import { intakeConfig } from '../config';

let loadPromise = null;

function loadScript(siteKey) {
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    s.async = true;
    s.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha));
    s.onerror = () => {
      loadPromise = null;
      reject(new Error('Failed to load reCAPTCHA.'));
    };
    document.head.appendChild(s);
  });
  return loadPromise;
}

// Returns a v3 token for the given action, or '' when no key is configured.
export async function executeRecaptcha(action) {
  const siteKey = intakeConfig.recaptchaSiteKey;
  if (!siteKey) return '';
  try {
    const grecaptcha = await loadScript(siteKey);
    return await grecaptcha.execute(siteKey, { action });
  } catch {
    // Soft-fail: let the request go without a token rather than block ordering.
    return '';
  }
}
