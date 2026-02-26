/**
 * Terms API - static content for Terms of Service page.
 * Future: GET /api/terms?locale=xx -> TermsPageContent
 * No live API calls required for current static implementation.
 */

import type { TermsPageContent } from '@/types/terms'
import { api } from '@/lib/api'

/** Response shape from GET /api/terms */
export interface TermsApiResponse {
  locale?: string
  lastUpdated?: string
  sections?: TermsPageContent['sections']
}

/**
 * Fetch Terms page content from API (future CMS integration).
 * Returns normalized sections with safe defaults.
 */
export async function fetchTermsContent(
  locale: string = 'en'
): Promise<TermsPageContent> {
  try {
    const res = await api.get<TermsApiResponse>(`/terms?locale=${locale}`)
    const data = res ?? {}
    const sections = Array.isArray(data?.sections) ? data.sections : []
    const lastUpdated =
      typeof data?.lastUpdated === 'string' ? data.lastUpdated : ''
    const loc = typeof data?.locale === 'string' ? data.locale : locale

    return {
      locale: loc,
      lastUpdated: lastUpdated || new Date().toISOString().slice(0, 10),
      sections,
    }
  } catch {
    return {
      locale,
      lastUpdated: new Date().toISOString().slice(0, 10),
      sections: [],
    }
  }
}
