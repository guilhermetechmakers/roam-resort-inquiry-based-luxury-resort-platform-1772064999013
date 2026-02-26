import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileText,
  Cookie,
  Settings,
  Mail,
  HelpCircle,
} from 'lucide-react'
import { HeroBar } from '@/components/terms/hero-bar'
import { FooterLinks } from '@/components/terms/footer-links'
import { AccessibilityToolbar } from '@/components/terms/accessibility-toolbar'
import {
  PolicySectionComponent,
  ContactInfoCard,
  PdfDownloadButton,
  PrivacyToolsBanner,
} from '@/components/privacy'
import { ErrorBanner } from '@/components/auth/error-banner'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  PRIVACY_POLICY_SECTIONS,
  DEFAULT_PRIVACY_LAST_UPDATED,
  DEFAULT_PRIVACY_CONTACT,
  PRIVACY_PDF_URL,
} from '@/data/privacy-data'
import { fetchPrivacyPolicy } from '@/api/privacy'
import type { PolicySection } from '@/types/privacy'

const META_DESCRIPTION =
  'Roam Resort Privacy Policy. How we collect, use, store, and protect your data. Your rights under GDPR and CCPA. Data export and account deletion.'

const FOOTER_LINKS = [
  { text: 'Terms of Service', href: '/terms' },
  { text: 'Cookie Policy', href: '/cookie-policy' },
  { text: 'Privacy & Data Tools', href: '/settings' },
  { text: 'Contact', href: '/contact' },
  { text: 'Help', href: '/help' },
]

const RELATED_LINKS = [
  { text: 'Terms of Service', href: '/terms', icon: FileText, ariaLabel: 'View Terms of Service' },
  { text: 'Cookie Policy', href: '/cookie-policy', icon: Cookie, ariaLabel: 'View Cookie Policy' },
  { text: 'Privacy & Data Tools', href: '/settings', icon: Settings, ariaLabel: 'Manage cookie preferences and data tools' },
  { text: 'Contact Us', href: '/contact', icon: Mail, ariaLabel: 'Contact us' },
  { text: 'Help', href: '/help', icon: HelpCircle, ariaLabel: 'Get help' },
] as const

export function PrivacyPolicyPage() {
  const [sections, setSections] = useState<PolicySection[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>(DEFAULT_PRIVACY_LAST_UPDATED)
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const [retryCount, setRetryCount] = useState(0)

  const handleRetry = () => {
    setRetryCount((c) => c + 1)
  }

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    async function load() {
      try {
        const content = await fetchPrivacyPolicy()
        if (cancelled) return
        if (content) {
          const safeSections = Array.isArray(content.sections) ? content.sections : []
          setSections(safeSections.length > 0 ? safeSections : PRIVACY_POLICY_SECTIONS)
          setLastUpdated(content.lastUpdated ?? DEFAULT_PRIVACY_LAST_UPDATED)
          setHasError(false)
        } else {
          setSections(PRIVACY_POLICY_SECTIONS)
          setLastUpdated(DEFAULT_PRIVACY_LAST_UPDATED)
          setHasError(false)
        }
      } catch {
        if (!cancelled) {
          setSections(PRIVACY_POLICY_SECTIONS)
          setLastUpdated(DEFAULT_PRIVACY_LAST_UPDATED)
          setHasError(true)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [retryCount])

  const displaySections =
    Array.isArray(sections) && sections.length > 0 ? sections : PRIVACY_POLICY_SECTIONS
  const formattedDate = lastUpdated ? formatDate(lastUpdated) : ''

  useEffect(() => {
    const prevTitle = document.title
    const metaDesc = document.querySelector('meta[name="description"]')
    const prevMeta = metaDesc?.getAttribute('content') ?? ''
    document.title = 'Privacy Policy | Roam Resort'
    metaDesc?.setAttribute('content', META_DESCRIPTION)

    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy | Roam Resort',
      description: META_DESCRIPTION,
      publisher: {
        '@type': 'Organization',
        name: 'Roam Resort',
        url: typeof window !== 'undefined' ? window.location.origin : '',
      },
      mainEntity: {
        '@type': 'LegalPolicy',
        name: 'Privacy Policy',
        url: typeof window !== 'undefined' ? `${window.location.origin}/privacy` : '/privacy',
      },
    }
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify(structuredData)
    script.id = 'privacy-policy-structured-data'
    document.head.appendChild(script)

    return () => {
      document.title = prevTitle
      metaDesc?.setAttribute('content', prevMeta)
      document.getElementById('privacy-policy-structured-data')?.remove()
    }
  }, [])

  useEffect(() => {
    const scriptId = 'privacy-policy-schema'
    const existing = document.getElementById(scriptId)
    if (existing) existing.remove()
    const script = document.createElement('script')
    script.id = scriptId
    script.type = 'application/ld+json'
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Privacy Policy | Roam Resort',
      description: META_DESCRIPTION,
      publisher: {
        '@type': 'Organization',
        name: 'Roam Resort',
        url: typeof window !== 'undefined' ? window.location.origin : '',
      },
      mainEntity: {
        '@type': 'LegalPolicy',
        name: 'Roam Resort Privacy Policy',
        description: META_DESCRIPTION,
      },
    })
    document.head.appendChild(script)
    return () => document.getElementById(scriptId)?.remove()
  }, [])

  return (
    <div>
      <AccessibilityToolbar
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        contentId="privacy-main-content"
      />

      <HeroBar
        title="Privacy Policy"
        subtitle="How we collect, use, store, and protect your data. Your rights under GDPR and CCPA."
      />

      <main
        id="privacy-main-content"
        tabIndex={-1}
        className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8"
        aria-label="Privacy Policy content"
      >
        {isLoading ? (
          <div className="space-y-8" role="status" aria-label="Loading privacy policy">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-1/2" />
            <span className="sr-only">Loading privacy policy content…</span>
          </div>
        ) : (
          <>
            {hasError ? (
              <ErrorBanner
                message="Could not load the latest policy"
                subMessage="Showing default policy content. You can try again to fetch updates."
                onRetry={handleRetry}
                className="mb-8"
              />
            ) : null}
            <div className="space-y-16 sm:space-y-20">
              {(displaySections ?? []).map((section, idx) => (
                <PolicySectionComponent
                  key={section?.id ?? `section-${idx}`}
                  section={section ?? { id: `section-${idx}`, title: '', content: '' }}
                  className="animate-fade-in-up"
                />
              ))}
            </div>

            <PrivacyToolsBanner className="mt-20" />

            <section
              className="mt-20 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between"
              aria-label="Policy actions and contact"
            >
              <div className="flex flex-col gap-4">
                <PdfDownloadButton pdfUrl={PRIVACY_PDF_URL} label="Download PDF" />
                <p className="text-sm text-muted-foreground">
                  Download a copy of this policy for your records.
                </p>
              </div>
              {formattedDate ? (
                <p className="text-sm text-muted-foreground">Last updated: {formattedDate}</p>
              ) : null}
            </section>

            <section className="mt-16" aria-labelledby="contact-privacy-officer-heading">
              <ContactInfoCard
                officerName={DEFAULT_PRIVACY_CONTACT.officerName}
                email={DEFAULT_PRIVACY_CONTACT.email}
                portalLink={DEFAULT_PRIVACY_CONTACT.portalLink}
              />
            </section>

            <section className="mt-16" aria-label="Related links">
              <Card
                className="border-accent/20 transition-all duration-300 hover:shadow-card-hover"
                aria-labelledby="related-links-heading"
              >
                <CardHeader className="pb-3">
                  <h2
                    id="related-links-heading"
                    className="font-serif text-lg font-semibold text-foreground"
                  >
                    Related
                  </h2>
                </CardHeader>
                <CardContent>
                  <nav
                    className="flex flex-wrap gap-4 sm:gap-6"
                    aria-label="Legal and support links"
                  >
                    {(RELATED_LINKS ?? []).map((link) => {
                      const Icon = link.icon
                      return (
                        <Link
                          key={link.href}
                          to={link.href}
                          className={cn(
                            'inline-flex items-center gap-2 text-sm font-medium text-accent',
                            'hover:text-accent/80 transition-colors duration-200',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
                            'min-h-[44px] min-w-[44px] items-center justify-center sm:min-h-0 sm:min-w-0 sm:justify-start'
                          )}
                          aria-label={link.ariaLabel}
                        >
                          <Icon className="h-4 w-4 shrink-0" aria-hidden />
                          {link.text}
                        </Link>
                      )
                    })}
                  </nav>
                </CardContent>
              </Card>
            </section>
          </>
        )}
      </main>

      <FooterLinks
        links={FOOTER_LINKS}
        lastUpdated={formattedDate}
      />
    </div>
  )
}
