import { useQuery } from '@tanstack/react-query'
import {
  fetchHighlightedDestinations,
  fetchEditorials,
} from '@/api/destinations'

export function useHighlightedDestinations() {
  return useQuery({
    queryKey: ['landing', 'highlighted-destinations'],
    queryFn: fetchHighlightedDestinations,
  })
}

export function useEditorials() {
  return useQuery({
    queryKey: ['landing', 'editorials'],
    queryFn: fetchEditorials,
  })
}
