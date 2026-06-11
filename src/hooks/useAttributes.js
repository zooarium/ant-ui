import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import {
  fetchAttributes,
  fetchAttribute,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from '@/api/attributes';

// Export so other hooks can invalidate: queryClient.invalidateQueries({ queryKey: [ATTRIBUTES_KEY] })
export const ATTRIBUTES_KEY = 'attributes';

// filters: { limit, offset, status }. Different filter combos = separate cache entries.
export function useAttributes(filters = {}) {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ATTRIBUTES_KEY, 'list', filters],
    queryFn: () => fetchAttributes(filters),
    select: (res) => res?.data ?? [],
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [ATTRIBUTES_KEY] });

  const createMutation = useMutation({
    mutationFn: (payload) => createAttribute(payload),
    onSuccess: () => {
      invalidate();
      showNotification('Attribute created.', 'success');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }) => updateAttribute(id, payload),
    onSuccess: () => {
      invalidate();
      showNotification('Attribute updated.', 'success');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => deleteAttribute(id),
    onSuccess: () => {
      invalidate();
      showNotification('Attribute deleted.', 'success');
    },
  });

  return {
    attributes: data ?? [],
    isLoading,
    error: error?.message ?? null,
    refetch,
    create: (payload) => createMutation.mutateAsync(payload),
    update: (id, payload) => updateMutation.mutateAsync({ id, payload }),
    remove: (id) => removeMutation.mutateAsync(id),
  };
}

// Single attribute with its options.
export function useAttribute(id) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [ATTRIBUTES_KEY, 'detail', id],
    queryFn: () => fetchAttribute(id),
    select: (res) => res?.data ?? null,
    enabled: !!id,
  });

  return { attribute: data ?? null, isLoading, error: error?.message ?? null, refetch };
}
