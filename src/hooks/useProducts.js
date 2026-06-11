import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import {
  fetchProducts,
  fetchProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} from '@/api/products';

// Export so other hooks can invalidate: queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] })
export const PRODUCTS_KEY = 'products';

// filters: { limit, offset, status }. Different filter combos = separate cache entries.
export function useProducts(filters = {}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [PRODUCTS_KEY, 'list', filters],
    queryFn: () => fetchProducts(filters),
    select: (res) => res?.data ?? [],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload) => createProduct(payload),
    onSuccess: () => {
      invalidate();
      showNotification('Product created.', 'success');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateProduct(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Product updated.', 'success');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteProduct(id),
    onSuccess: () => {
      invalidate();
      showNotification('Product deleted.', 'success');
    },
  });

  return {
    products: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}

// Single product with its assigned attributes and their options.
export function useProduct(id) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [PRODUCTS_KEY, 'detail', id],
    queryFn: () => fetchProduct(id),
    select: (res) => res?.data ?? null,
    enabled: !!id,
  });

  return { product: data ?? null, isLoading, error: error?.message ?? null, refetch };
}
