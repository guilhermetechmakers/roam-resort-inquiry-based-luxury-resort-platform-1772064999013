import type { Destination } from '@/types'

/**
 * Get the detail URL for a destination.
 */
export function getDetailUrl(destination: Destination): string {
  const slug = destination.slug ?? destination.id
  return `/destinations/${slug}`
}
