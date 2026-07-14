import { useQuery, useMutation, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPut, apiPost, apiDelete } from '@/lib/api';
import type { PaginatedResponse } from '@/types';

// Normalize backend response shape: { users: [...], total } → { data: [...], total }
// Also handles raw arrays (e.g. GET /artists returns Artist[])
function normalizePaginated<T>(raw: unknown): PaginatedResponse<T> {
  // Raw array response
  if (Array.isArray(raw)) {
    return {
      data: raw as T[],
      total: raw.length,
      page: 1,
      limit: raw.length,
    };
  }

  const obj = raw as Record<string, unknown>;
  // Backend returns the array under resource-specific keys (users, events, shifts, etc.)
  // Find the array field that isn't a pagination meta field
  const metaKeys = new Set(['total', 'page', 'limit', 'totalPages']);
  let data: T[] = [];
  if (Array.isArray(obj.data)) {
    data = obj.data;
  } else {
    for (const [k, v] of Object.entries(obj)) {
      if (!metaKeys.has(k) && Array.isArray(v)) {
        data = v as T[];
        break;
      }
    }
  }
  return {
    data,
    total: (obj.total as number) ?? data.length,
    page: (obj.page as number) ?? 1,
    limit: (obj.limit as number) ?? 20,
  };
}

// Generic paginated query hook
export function usePaginatedQuery<T>(
  key: string[],
  path: string,
  params?: Record<string, string | number | undefined>,
  options?: Omit<UseQueryOptions<PaginatedResponse<T>>, 'queryKey' | 'queryFn'>
) {
  return useQuery<PaginatedResponse<T>>({
    queryKey: [...key, params],
    queryFn: async () => {
      const raw = await apiGet<unknown>(path, params);
      return normalizePaginated<T>(raw);
    },
    ...options,
  });
}

// Generic query hook
export function useApiQuery<T>(
  key: string[],
  path: string,
  params?: Record<string, string | number | undefined>,
  options?: Omit<UseQueryOptions<T>, 'queryKey' | 'queryFn'>
) {
  return useQuery<T>({
    queryKey: [...key, params],
    queryFn: () => apiGet<T>(path, params),
    ...options,
  });
}

// Optimistic patch mutation with undo
export function useOptimisticPatch<T extends { id: string }>(
  queryKey: string[],
  basePath: string,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiPatch<T>(`${basePath}/${id}`, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey });
      const prev = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old: PaginatedResponse<T> | undefined) => {
        if (!old) return old;
        return {
          ...old,
          data: old.data.map((item) =>
            item.id === id ? { ...item, ...data } : item
          ),
        };
      });
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) queryClient.setQueryData(queryKey, context.prev);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

// Create mutation
export function useCreateMutation<T>(queryKey: string[], path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => apiPost<T>(path, data),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

// Delete mutation
export function useDeleteMutation(queryKey: string[], basePath: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiDelete(`${basePath}/${id}`),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}

// Create artist
export function useCreateArtist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; slug: string; bio?: string; genres?: string[]; imageUrl?: string }) =>
      apiPost<unknown>('/artists', data as unknown as Record<string, unknown>),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['artists'] }),
  });
}

// Update artist by slug
export function useUpdateArtist() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, data }: { slug: string; data: Record<string, unknown> }) =>
      apiPatch<unknown>(`/artists/${slug}`, data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['artists'] }),
  });
}

// Create event
export function useCreateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiPost<unknown>('/events', data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}

// Update event by id (backend uses PUT)
export function useUpdateEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      apiPut<unknown>(`/events/${id}`, data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['events'] }),
  });
}
