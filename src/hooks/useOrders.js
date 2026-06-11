import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import {
  fetchOrders,
  fetchOrder,
  createOrder,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
} from '@/api/orders';

// Export so other hooks can invalidate: queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] })
export const ORDERS_KEY = 'orders';

// filters: { limit, offset, status }. Different filter combos = separate cache entries.
export function useOrders(filters = {}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ORDERS_KEY, 'list', filters],
    queryFn: () => fetchOrders(filters),
    select: (res) => res?.data ?? [],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [ORDERS_KEY] });

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
    remove: (id) => removeMutation.mutateAsync(id),
  };
}

// Single order with its items.
export function useOrder(id) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ORDERS_KEY, 'detail', id],
    queryFn: () => fetchOrder(id),
    select: (res) => res?.data ?? null,
    enabled: !!id,
  });

  return { order: data ?? null, isLoading, error: error?.message ?? null, refetch };
}
