// App-specific config only.
// HTTP client config (apiBase, authBase, refreshPath) is in main.jsx via configure().
// No import.meta.env.* outside this file and main.jsx.
export const config = {
  appName: import.meta.env.VITE_APP_NAME ?? 'App',
  isDev: import.meta.env.DEV,

  // Public order-intake flow (/intake). Self-contained — read via src/intake/config.js,
  // never touched by the admin HTTP client.
  intake: {
    keeperUrl: import.meta.env.VITE_KEEPER_URL ?? '',
    intakeUrl: import.meta.env.VITE_INTAKE_URL ?? '',
    guestSiteKey: import.meta.env.VITE_GUEST_SITE_KEY ?? '',
    recaptchaSiteKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY ?? '',
  },
};
