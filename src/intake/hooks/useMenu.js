import { useQuery } from '@tanstack/react-query';
import { fetchProducts } from '../api/public';

export const MENU_KEY = 'intake-menu';

// Active products only (status 1) — inactive ones are filtered out for the menu.
export function useMenu(filters = {}) {
  const { data, isLoading, error } = useQuery({
    queryKey: [MENU_KEY, filters],
    queryFn: () => fetchProducts(filters),
    select: (res) => (res?.data ?? []).filter((p) => p.status === 1),
  });

  return { products: data ?? [], isLoading, error: error?.message ?? null };
}
