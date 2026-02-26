/**
 * Terms of Service - Type definitions
 * CMS-ready for future dynamic content injection.
 */

/** Single section of the Terms page */
export interface TermsSection {
  id: string
  title: string
  body: string
  bullets?: string[]
  disclaimer?: string
  listType?: 'ul' | 'ol'
}

/** Full page content (optional CMS support) */
export interface TermsPageContent {
  locale: string
  lastUpdated: string
  sections: TermsSection[]
}

/** Contact info for legal inquiries */
export interface TermsContactInfo {
  email?: string
  label?: string
  href?: string
}

/** Footer link item */
export interface FooterLink {
  text: string
  href: string
}
