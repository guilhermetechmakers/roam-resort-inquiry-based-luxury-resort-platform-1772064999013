import { useEffect } from 'react'
import { TermsLayout } from '@/components/terms'
import {
  SAMPLE_TERMS_SECTIONS,
  DEFAULT_LAST_UPDATED,
  DEFAULT_CONTACT_INFO,
} from '@/data/terms-data'

const META_DESCRIPTION =
  'Roam Resort Terms of Service. Platform rules, usage terms for guests and hosts, payment terms, liability disclaimers, and contact information.'

export function TermsOfServicePage() {
  const sections = SAMPLE_TERMS_SECTIONS
  const lastUpdated = DEFAULT_LAST_UPDATED
  const contactInfo = DEFAULT_CONTACT_INFO
  const footerLinks = [
    { text: 'Privacy Policy', href: '/privacy' },
    { text: 'Privacy & Data Tools', href: '/settings' },
    { text: 'Contact', href: '/contact' },
    { text: 'Help', href: '/help' },
  ]

  useEffect(() => {
    const prevTitle = document.title
    const metaDesc = document.querySelector('meta[name="description"]')
    const prevMeta = metaDesc?.getAttribute('content') ?? ''
    document.title = 'Terms of Service | Roam Resort'
    metaDesc?.setAttribute('content', META_DESCRIPTION)
    return () => {
      document.title = prevTitle
      metaDesc?.setAttribute('content', prevMeta)
    }
  }, [])

  return (
    <TermsLayout
        sections={sections}
        lastUpdated={lastUpdated}
        contactInfo={contactInfo}
        footerLinks={footerLinks}
      />
  )
}
