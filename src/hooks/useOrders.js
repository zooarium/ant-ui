import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  setOrderGroup,
  deleteOrder,
} from '@/api/orders';

// Export so other hooks can invalidate: queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] })
export const ORDERS_KEY = 'orders';
// Literal to avoid a circular import with useOrderGroups (which imports ORDERS_KEY).
const ORDER_GROUPS_KEY = 'order-groups';

// filters: { limit, offset, status }. opts.refetchInterval (ms, or false) drives
// auto-refresh — kept OUT of the queryKey so toggling polling reuses the cache.
export function useOrders(filters = {}, opts = {}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ORDERS_KEY, 'list', filters],
    queryFn: () => fetchOrders(filters),
    select: (res) => res?.data ?? [],
    refetchInterval: opts.refetchInterval ?? false,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });
    queryClient.invalidateQueries({ queryKey: [ORDER_GROUPS_KEY] });
  };

  const createMutation = useMutation({
    mutationFn: (payload) => createOrder(payload),
    onSuccess: () => {
      invalidate();
      showNotification('Order created.', 'success');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateOrder(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Order updated.', 'success');
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateOrderStatus(id, status),
    onSuccess: () => {
      invalidate();
      showNotification('Order status updated.', 'success');
    },
  });

  const groupMutation = useMutation({
    mutationFn: ({ id, groupId }) => setOrderGroup(id, groupId),
    onSuccess: () => {
      invalidate();
      showNotification('Order moved.', 'success');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteOrder(id),
    onSuccess: () => {
      invalidate();
      showNotification('Order deleted.', 'success');
    },
  });

  return {
    orders: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    setStatus: (id, status) => statusMutation.mutateAsync({ id, status }),
    setGroup: (id, groupId) => groupMutation.mutateAsync({ id, groupId }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}

// Single order with its items. opts.refetchInterval (ms, or false) drives auto-refresh.
export function useOrder(id, opts = {}) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ORDERS_KEY, 'detail', id],
    queryFn: () => fetchOrder(id),
    select: (res) => res?.data ?? null,
    enabled: !!id,
    refetchInterval: opts.refetchInterval ?? false,
  });

  return { order: data ?? null, isLoading, error: error?.message ?? null, refetch };
}
