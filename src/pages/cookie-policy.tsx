import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { HeroBar } from '@/components/terms/hero-bar'
import { FooterLinks } from '@/components/terms/footer-links'
import { AccessibilityToolbar } from '@/components/terms/accessibility-toolbar'
import { CookieCategoryCard, ConsentModal } from '@/components/cookie'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import {
  COOKIE_CATEGORIES,
  DEFAULT_COOKIE_PREFERENCES,
  COOKIE_POLICY_LAST_UPDATED,
  COOKIE_STORAGE_KEY,
} from '@/data/cookie-data'
import type { CookieCategory } from '@/types/cookie'

const META_DESCRIPTION =
  'Roam Resort Cookie Policy. Learn about the cookies we use, their purposes, and how to manage your preferences.'

const FOOTER_LINKS = [
  { text: 'Privacy Policy', href: '/privacy' },
  { text: 'Terms of Service', href: '/terms' },
  { text: 'Contact', href: '/contact' },
]

function loadStoredPreferences(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(COOKIE_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_COOKIE_PREFERENCES }
    const parsed = JSON.parse(raw) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const result: Record<string, boolean> = { ...DEFAULT_COOKIE_PREFERENCES }
      const keys = Object.keys(parsed)
      for (const k of keys) {
        if (typeof (parsed as Record<string, unknown>)[k] === 'boolean') {
          result[k] = (parsed as Record<string, boolean>)[k]
        }
      }
      result.essential = true
      return result
    }
  } catch {
    // ignore parse errors
  }
  return { ...DEFAULT_COOKIE_PREFERENCES }
}

function savePreferences(prefs: Record<string, boolean>): void {
  try {
    const toStore = { ...prefs, essential: true }
    localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(toStore))
  } catch {
    // ignore storage errors
  }
}

export function CookiePolicyPage() {
  const [preferences, setPreferences] = useState<Record<string, boolean>>(() =>
    loadStoredPreferences()
  )
  const [modalOpen, setModalOpen] = useState(false)
  const [modalPreferences, setModalPreferences] = useState<Record<string, boolean>>({})

  const safeCategories = Array.isArray(COOKIE_CATEGORIES) ? COOKIE_CATEGORIES : []

  const openModal = useCallback(() => {
    setModalPreferences({ ...preferences })
    setModalOpen(true)
  }, [preferences])

  const closeModal = useCallback(() => {
    setModalOpen(false)
  }, [])

  const handlePreferenceChange = useCallback((categoryId: string, enabled: boolean) => {
    setModalPreferences((prev) => {
      const next = { ...prev }
      if (categoryId === 'essential') {
        next.essential = true
      } else {
        next[categoryId] = enabled
      }
      return next
    })
  }, [])

  const handleSavePreferences = useCallback((prefs: Record<string, boolean>) => {
    const validated: Record<string, boolean> = { ...DEFAULT_COOKIE_PREFERENCES }
    const validIds = safeCategories.map((c) => c?.id).filter(Boolean) as string[]
    for (const id of validIds) {
      validated[id] = id === 'essential' ? true : (prefs[id] === true)
    }
    setPreferences(validated)
    savePreferences(validated)
    toast.success('Cookie preferences saved')
  }, [safeCategories])

  const handleAcceptAll = useCallback(() => {
    const all: Record<string, boolean> = {}
    for (const cat of safeCategories) {
      const id = cat?.id
      if (id) all[id] = true
    }
    setPreferences(all)
    savePreferences(all)
    toast.success('All cookies accepted')
  }, [safeCategories])

  const formattedDate = COOKIE_POLICY_LAST_UPDATED
    ? formatDate(COOKIE_POLICY_LAST_UPDATED)
    : ''

  useEffect(() => {
    const prevTitle = document.title
    const metaDesc = document.querySelector('meta[name="description"]')
    const prevMeta = metaDesc?.getAttribute('content') ?? ''
    document.title = 'Cookie Policy | Roam Resort'
    metaDesc?.setAttribute('content', META_DESCRIPTION)
    return () => {
      document.title = prevTitle
      metaDesc?.setAttribute('content', prevMeta)
    }
  }, [])

  return (
    <div>
      <AccessibilityToolbar
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        contentId="cookie-main-content"
      />

      <HeroBar
        title="Cookie Policy"
        subtitle="Learn about the cookies we use and how to manage your preferences."
      />

      <main
        id="cookie-main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-label="Cookie Policy content"
      >
        <section
          className="mb-16 sm:mb-20"
          aria-labelledby="cookie-hero-actions"
        >
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-center">
            <Button
              onClick={openModal}
              size="lg"
              className="min-w-[180px]"
              aria-label="Open cookie preferences dialog"
            >
              Manage Cookies
            </Button>
            <Button
              variant="secondary"
              onClick={handleAcceptAll}
              size="lg"
              className="min-w-[180px]"
              aria-label="Accept all cookies"
            >
              Accept All
            </Button>
          </div>
        </section>

        <section
          className="space-y-12 sm:space-y-16"
          aria-labelledby="cookie-categories-heading"
        >
          <h2
            id="cookie-categories-heading"
            className="font-serif text-2xl font-semibold text-foreground uppercase tracking-wider"
          >
            Cookie Categories
          </h2>
          <div className="grid gap-8 sm:gap-12">
            {(safeCategories ?? []).map((category, idx) => {
              const cat = category ?? ({
                id: 'essential',
                name: '',
                description: '',
                required: true,
              } as CookieCategory)
              const enabled = preferences[cat.id] === true
              return (
                <CookieCategoryCard
                  key={cat.id ?? `cat-${idx}`}
                  category={cat}
                  enabled={enabled}
                  onToggle={(categoryId, enabledVal) => {
                    if (categoryId === 'essential') return
                    setPreferences((prev) => {
                      const next = { ...prev, [categoryId]: enabledVal }
                      savePreferences(next)
                      return next
                    })
                  }}
                />
              )
            })}
          </div>
        </section>

        <section
          className="mt-16 sm:mt-20 space-y-8"
          aria-labelledby="cookie-details-heading"
        >
          <h2
            id="cookie-details-heading"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            How to Withdraw or Modify Consent
          </h2>
          <p className="text-foreground/90 leading-relaxed">
            You can change your cookie preferences at any time by clicking the &quot;Manage
            Cookies&quot; button above. Your choices are stored locally in your browser
            (localStorage). If you clear your browser data, you may need to set your preferences
            again. For authenticated users, we may in the future persist your preferences to your
            account.
          </p>
        </section>

        <section
          className="mt-16 sm:mt-20 space-y-8"
          aria-labelledby="cookie-third-party-heading"
        >
          <h2
            id="cookie-third-party-heading"
            className="font-serif text-2xl font-semibold text-foreground"
          >
            Third-Party Cookies
          </h2>
          <p className="text-foreground/90 leading-relaxed">
            Some cookies are set by third-party services that appear on our pages. We do not control
            these cookies. Please refer to the respective privacy policies of these services for more
            information. Disabling marketing or analytics cookies may limit certain features or
            personalization on our site.
          </p>
        </section>

        <section
          className="mt-16 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between"
          aria-label="Page metadata and actions"
        >
          <Button
            variant="outline"
            onClick={openModal}
            aria-label="Manage cookie preferences"
          >
            Manage Preferences
          </Button>
          {formattedDate ? (
            <p className="text-sm text-muted-foreground">Last updated: {formattedDate}</p>
          ) : null}
        </section>

        <section className="mt-16" aria-label="Related links">
          <h2 className="font-serif text-lg font-semibold text-foreground">Related</h2>
          <nav className="mt-4 flex flex-wrap gap-4" aria-label="Legal and support links">
            <Link
              to="/privacy"
              className="text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Terms of Service
            </Link>
            <Link
              to="/contact"
              className="text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              Contact Us
            </Link>
          </nav>
        </section>
      </main>

      <FooterLinks links={FOOTER_LINKS} lastUpdated={formattedDate} />

      <ConsentModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSavePreferences}
        categories={safeCategories}
        preferences={modalPreferences}
        onPreferenceChange={handlePreferenceChange}
      />
    </div>
  )
}
