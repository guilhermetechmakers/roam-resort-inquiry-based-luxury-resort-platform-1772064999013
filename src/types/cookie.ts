/**
 * Cookie Policy - Type definitions
 * V1: Static content; future: API integration for preferences persistence.
 */

export type CookieCategoryId = 'essential' | 'analytics' | 'marketing'

export interface CookieCategory {
  id: CookieCategoryId
  name: string
  description: string
  required: boolean
}

/** User preference for a single category */
export interface CookiePreference {
  category: string
  allowed: boolean
  updatedAt: string
}

/** Map of category ID to enabled state */
export type CookiePreferencesMap = Record<string, boolean>
