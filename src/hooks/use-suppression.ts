import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchSuppressions, addToSuppression, removeFromSuppression } from '@/api/suppression'

export const suppressionKeys = {
  all: ['suppression'] as const,
  list: (params?: { search?: string; limit?: number }) =>
    [...suppressionKeys.all, 'list', params] as const,
}

export function useSuppressions(params?: { search?: string; limit?: number }) {
  return useQuery({
    queryKey: suppressionKeys.list(params),
    queryFn: () => fetchSuppressions(params),
  })
}

export function useAddToSuppression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ email, reason }: { email: string; reason?: string }) =>
      addToSuppression(email, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: suppressionKeys.all }),
  })
}

export function useRemoveFromSuppression() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => removeFromSuppression(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: suppressionKeys.all }),
  })
}
