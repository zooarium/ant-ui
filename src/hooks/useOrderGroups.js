import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import {
  fetchOrderGroups,
  fetchOrderGroup,
  createOrderGroup,
  updateOrderGroup,
  updateOrderGroupStatus,
  deleteOrderGroup,
} from '@/api/orderGroups';
import { ORDERS_KEY } from '@/hooks/useOrders';

// Export so other hooks can invalidate: queryClient.invalidateQueries({ queryKey: [ORDER_GROUPS_KEY] })
export const ORDER_GROUPS_KEY = 'order-groups';

// filters: { limit, offset, status }. opts.refetchInterval (ms, or false) drives
// auto-refresh — kept OUT of the queryKey so toggling polling reuses the cache.
export function useOrderGroups(filters = {}, opts = {}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ORDER_GROUPS_KEY, 'list', filters],
    queryFn: () => fetchOrderGroups(filters),
    select: (res) => res?.data ?? [],
    refetchInterval: opts.refetchInterval ?? false,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [ORDER_GROUPS_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload) => createOrderGroup(payload),
    onSuccess: () => {
      invalidate();
      showNotification('Group created.', 'success');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateOrderGroup(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Group updated.', 'success');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderGroupStatus(id, status),
    onSuccess: () => {
      invalidate();
      showNotification('Group status updated.', 'success');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteOrderGroup(id),
    onSuccess: () => {
      invalidate();
      showNotification('Group deleted.', 'success');
    },
  });

  return {
    groups: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    setStatus: (id, status) => statusMutation.mutateAsync({ id, status }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}

// Single group with its member orders and combined total.
export function useOrderGroup(id, opts = {}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ORDER_GROUPS_KEY, 'detail', id],
    queryFn: () => fetchOrderGroup(id),
    select: (res) => res?.data ?? null,
    enabled: !!id,
    refetchInterval: opts.refetchInterval ?? false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [ORDER_GROUPS_KEY] });
    queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
  };

  const updateMutation = useMutation({
    mutationFn: (payload) => updateOrderGroup(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Group updated.', 'success');
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status) => updateOrderGroupStatus(id, status),
    onSuccess: () => {
      invalidate();
      showNotification('Group status updated.', 'success');
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteOrderGroup(id),
    onSuccess: () => {
      invalidate();
      showNotification('Group deleted.', 'success');
    },
  });

  return {
    group: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
    update: (payload) => updateMutation.mutateAsync(payload),
    setStatus: (status) => statusMutation.mutateAsync(status),
    remove: () => removeMutation.mutateAsync(),
  };
}
