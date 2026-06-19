import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import {
  fetchCategories,
  fetchCategory,
  createCategory,
  updateCategory,
  moveCategory,
  deleteCategory,
} from '@/api/categories';

export const CATEGORIES_KEY = 'categories';

// filters: { parent_id, status, limit, offset } — keyed so each filter combo
// caches independently.
export function useCategories(filters = {}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [CATEGORIES_KEY, 'list', filters],
    queryFn: () => fetchCategories(filters),
    select: (res) => res?.data ?? [],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload) => createCategory(payload),
    onSuccess: () => {
      invalidate();
      showNotification('Category created.', 'success');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateCategory(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Category updated.', 'success');
    },
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, payload }) => moveCategory(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Category moved.', 'success');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteCategory(id),
    onSuccess: () => {
      invalidate();
      showNotification('Category deleted.', 'success');
    },
  });

  return {
    categories: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    move: (id, payload) => moveMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}

export function useCategory(id) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [CATEGORIES_KEY, 'detail', id],
    queryFn: () => fetchCategory(id),
    select: (res) => res?.data ?? null,
    enabled: !!id,
  });

  return { category: data ?? null, isLoading, error: error?.message ?? null, refetch };
}
