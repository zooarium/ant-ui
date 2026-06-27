import { useQuery } from '@tanstack/react-query';
import { getSiteKey } from '@/intake/lib/siteKey';
import { fetchPublicApp, fetchPublicStorefront } from './api';
import { adaptStorefront } from './adapt';

export const PUBLIC_STOREFRONT_KEY = 'public-storefront';

// Loads the tenant landing data: resolve the site key, fetch keeper's public app
// profile and ant's storefront config in parallel, then merge into the section
// shape. TenantGate has already resolved the site key, so getSiteKey() is a cache
// hit here. Returns an adapted object that is always render-safe.
export function usePublicStorefront() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [PUBLIC_STOREFRONT_KEY],
    queryFn: async () => {
      const siteKey = await getSiteKey();
      const [app, sf] = await Promise.all([
        fetchPublicApp(siteKey),
        fetchPublicStorefront(),
      ]);
      return adaptStorefront(app, sf);
    },
  });

  return {
    sf: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
  };
}
