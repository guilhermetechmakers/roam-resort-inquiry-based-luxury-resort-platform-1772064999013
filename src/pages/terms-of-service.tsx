import { Helmet } from 'react-helmet-async'
import { TermsLayout } from '@/components/terms/terms-layout'
import {
  SAMPLE_TERMS_SECTIONS,
  DEFAULT_LAST_UPDATED,
  DEFAULT_CONTACT_INFO,
} from '@/data/terms-data'

/** Normalize CMS/content response to sections array */
function normalizeSections(content: unknown): typeof SAMPLE_TERMS_SECTIONS {
  if (!content || typeof content !== 'object') return SAMPLE_TERMS_SECTIONS
  const c = content as { sections?: unknown }
  return Array.isArray(c?.sections) ? c.sections : SAMPLE_TERMS_SECTIONS
}

export function TermsOfServicePage() {
  const sections = SAMPLE_TERMS_SECTIONS
  const lastUpdated = DEFAULT_LAST_UPDATED
  const contactInfo = DEFAULT_CONTACT_INFO
  const footerLinks = [
    { text: 'Privacy Policy', href: '/privacy' },
    { text: 'Contact', href: '/contact' },
    { text: 'Help', href: '/help' },
  ]

  return (
    <>
      <Helmet>
        <title>Terms of Service | Roam Resort</title>
        <meta
          name="description"
          content="Roam Resort Terms of Service. Platform rules, usage terms for guests and hosts, payment terms, liability disclaimers, and contact information."
        />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : '/terms'} />
      </Helmet>
      <TermsLayout
        sections={sections}
        lastUpdated={lastUpdated}
        contactInfo={contactInfo}
        footerLinks={footerLinks}
      />
    </>
  )
}
