import { useQuery } from '@tanstack/react-query';
import { fetchHistory } from '../api/public';
import { getDeviceId } from '../lib/deviceId';

export const HISTORY_KEY = 'intake-history';

// Past tabs this device participated in, newest first. device_id is a soft signal.
export function useHistory(filters = {}) {
  const deviceId = getDeviceId();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [HISTORY_KEY, deviceId, filters],
    queryFn: () => fetchHistory(deviceId, filters),
    select: (res) => res?.data ?? [],
  });

  return { tabs: data ?? [], isLoading, error: error?.message ?? null, refetch };
}
