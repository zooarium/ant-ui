import { useQuery } from '@tanstack/react-query';
import { fetchTab } from '../api/public';

export const TAB_KEY = 'intake-tab';

// Shared-tab view by token. Polls every 15s so family members' new orders and
// reception status changes show up without a manual refresh.
export function useTab(token, opts = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [TAB_KEY, token],
    queryFn: () => fetchTab(token),
    select: (res) => res?.data ?? null,
    enabled: !!token,
    refetchInterval: opts.refetchInterval ?? 15_000,
  });

  return { tab: data ?? null, isLoading, error: error?.message ?? null, refetch };
}
