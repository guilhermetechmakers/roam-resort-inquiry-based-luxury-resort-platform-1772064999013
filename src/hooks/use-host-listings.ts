import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createListing, updateListing, type CreateListingPayload, type UpdateListingPayload } from '@/api/host-listings'

export function useCreateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateListingPayload) => createListing(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['host', 'listings'] })
      queryClient.invalidateQueries({ queryKey: ['host', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['destinations'] })
    },
  })
}

export function useUpdateListing() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateListingPayload }) =>
      updateListing(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['listing', id] })
      queryClient.invalidateQueries({ queryKey: ['listings'] })
      queryClient.invalidateQueries({ queryKey: ['host', 'listings'] })
      queryClient.invalidateQueries({ queryKey: ['host', 'stats'] })
      queryClient.invalidateQueries({ queryKey: ['destinations'] })
    },
  })
}
