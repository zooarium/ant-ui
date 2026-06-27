import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNotification } from '@aviary-ui/ui';
import { fetchStorefront, saveStorefront } from '@/api/storefront';

export const STOREFRONT_KEY = 'storefront';

// Singleton resource — one cache entry, no filters/list.
export function useStorefront() {
  const queryClient = useQueryClient();
  const { showNotification } = useNotification();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [STOREFRONT_KEY],
    queryFn: fetchStorefront,
    select: (res) => res?.data ?? null,
  });

  const saveMutation = useMutation({
    mutationFn: (payload) => saveStorefront(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [STOREFRONT_KEY] });
      showNotification('Storefront saved.', 'success');
    },
  });

  return {
    storefront: data ?? null,
    isLoading,
    error: error?.message ?? null,
    refetch,
    save: (payload) => saveMutation.mutateAsync(payload),
    isSaving: saveMutation.isPending,
  };
}
