/**
 * Global loading indicator driven by React Query fetch state.
 * Debounced to avoid flash for fast operations.
 */

import { useIsFetching, useIsMutating } from '@tanstack/react-query'
import { GlobalLoadingBar } from './loading-spinner'

export function GlobalLoadingIndicator() {
  const isFetching = useIsFetching()
  const isMutating = useIsMutating()
  const isLoading = isFetching > 0 || isMutating > 0

  return <GlobalLoadingBar isLoading={!!isLoading} delayMs={200} />
}
