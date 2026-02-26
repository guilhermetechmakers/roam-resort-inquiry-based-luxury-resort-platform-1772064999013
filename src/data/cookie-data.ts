/**
 * Cookie Policy - Static content and category definitions
 * V1: No API; categories and policy text are static.
 */

import type { CookieCategory } from '@/types/cookie'

export const COOKIE_CATEGORIES: CookieCategory[] = [
  {
    id: 'essential',
    name: 'Essential Cookies',
    description:
      'These cookies are necessary for the website to function and cannot be switched off. They are usually set in response to actions you take, such as setting your privacy preferences, logging in, or filling in forms. They enable core functionality like security, network management, and account access.',
    required: true,
  },
  {
    id: 'analytics',
    name: 'Analytics Cookies',
    description:
      'These cookies help us understand how visitors interact with our site by collecting and reporting information anonymously. This allows us to improve our website and the Roam Resort experience. You can choose to disable these cookies.',
    required: false,
  },
  {
    id: 'marketing',
    name: 'Marketing Cookies',
    description:
      'These cookies may be set through our site by advertising partners. They may be used to build a profile of your interests and show you relevant content on other sites. They do not store personal information directly but are based on uniquely identifying your browser.',
    required: false,
  },
]

export const DEFAULT_COOKIE_PREFERENCES: Record<string, boolean> = {
  essential: true,
  analytics: false,
  marketing: false,
}

export const COOKIE_STORAGE_KEY = 'roam-resort-cookie-preferences'

export const COOKIE_POLICY_LAST_UPDATED = '2025-02-26'
