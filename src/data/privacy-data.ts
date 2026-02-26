import type { PolicySection } from '@/types/privacy'

/** Static Privacy Policy sections - CMS-ready, can be replaced by API/CMS data */
export const PRIVACY_POLICY_SECTIONS: PolicySection[] = [
  {
    id: 'data-collection',
    title: 'Data Collection',
    content:
      'Roam Resort collects information you provide directly when you create an account, submit an inquiry, make a booking, or contact us. This includes name, email address, phone number, payment information, travel preferences, and communications with our concierge team. We also collect technical data such as IP address, browser type, device information, and usage patterns when you interact with our platform.',
    subsections: [
      {
        id: 'account-data',
        title: 'Account Information',
        content:
          'When you register, we collect your name, email, and password. You may optionally provide a profile photo, phone number, and communication preferences.',
      },
      {
        id: 'booking-data',
        title: 'Booking and Inquiry Data',
        content:
          'When you submit an inquiry or complete a booking, we collect stay dates, guest count, special requests, and any information you share with hosts or our concierge team.',
      },
    ],
  },
  {
    id: 'data-use',
    title: 'How We Use Your Data',
    content:
      'We use your data to provide, maintain, and improve our services; process bookings and payments; communicate with you about your stays; personalize your experience; send marketing communications (with your consent); detect and prevent fraud; comply with legal obligations; and improve our platform.',
    subsections: [
      {
        id: 'service-delivery',
        title: 'Service Delivery',
        content:
          'Your data enables us to match you with hosts, process payments, coordinate check-ins, and provide concierge support throughout your stay.',
      },
      {
        id: 'communications',
        title: 'Communications',
        content:
          'We use your contact information to send booking confirmations, itinerary updates, and respond to your inquiries. With your consent, we may send promotional offers and destination updates.',
      },
    ],
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing and Disclosure',
    content:
      'We share your data only as necessary to deliver our services. This includes sharing with hosts (for confirmed bookings), payment processors, and service providers who assist our operations. We do not sell your personal data. We may disclose data when required by law or to protect our rights and safety.',
    subsections: [
      {
        id: 'hosts',
        title: 'Hosts',
        content:
          'When you book a stay, we share your name, contact details, and stay information with the host to facilitate your reservation.',
      },
      {
        id: 'service-providers',
        title: 'Service Providers',
        content:
          'We work with trusted partners for payment processing, email delivery, analytics, and cloud infrastructure. These providers are contractually bound to protect your data.',
      },
    ],
  },
  {
    id: 'data-retention-security',
    title: 'Data Retention and Security',
    content:
      'We retain your data for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements. Typically, account data is retained for 7 years after your last activity for legal and tax purposes. We implement industry-standard security measures including encryption, access controls, and regular security assessments.',
    subsections: [
      {
        id: 'retention-periods',
        title: 'Retention Periods',
        content:
          'Booking records: 7 years. Account data: until deletion request. Marketing preferences: until you opt out. Logs and analytics: up to 24 months.',
      },
      {
        id: 'security-measures',
        title: 'Security Measures',
        content:
          'We use TLS encryption for data in transit, encrypt sensitive data at rest, and restrict access to personal data on a need-to-know basis.',
      },
    ],
  },
  {
    id: 'user-rights',
    title: 'Your Rights (GDPR, CCPA, and Beyond)',
    content:
      'Depending on your location, you may have the right to access, correct, delete, or port your personal data, and to object to or restrict certain processing. You can exercise these rights through your account settings or by contacting our Privacy Officer.',
    subsections: [
      {
        id: 'access',
        title: 'Right to Access',
        content:
          'You may request a copy of the personal data we hold about you. We will provide this in a structured, commonly used format within 30 days.',
      },
      {
        id: 'portability',
        title: 'Data Portability',
        content:
          'You may request an export of your data in a machine-readable format. Use the "Request data export" option in Settings or contact our Privacy Officer.',
      },
      {
        id: 'deletion',
        title: 'Right to Deletion',
        content:
          'You may request deletion of your account and associated data. We will process deletion requests within 30 days, subject to legal retention requirements.',
      },
      {
        id: 'objection',
        title: 'Right to Object',
        content:
          'You may object to marketing communications at any time by unsubscribing or updating your preferences. You may also object to certain processing based on legitimate interests.',
      },
    ],
  },
  {
    id: 'cookies-tracking',
    title: 'Cookies and Tracking',
    content:
      'We use cookies and similar technologies to enable essential functionality, remember your preferences, analyze site usage, and deliver relevant content. You can manage cookie preferences through your browser settings or our cookie banner. Essential cookies cannot be disabled as they are required for the platform to function.',
    subsections: [
      {
        id: 'cookie-types',
        title: 'Cookie Types',
        content:
          'Essential: session management, security. Functional: preferences, language. Analytics: usage patterns (anonymized). Marketing: retargeting (with consent).',
      },
    ],
  },
  {
    id: 'data-transfers',
    title: 'International Data Transfers',
    content:
      'Your data may be transferred to and processed in countries outside your residence, including the United States and European Union. We ensure appropriate safeguards (such as Standard Contractual Clauses) are in place when transferring data internationally.',
  },
  {
    id: 'policy-updates',
    title: 'Policy Updates',
    content:
      'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date. For significant changes, we may also notify you by email. Continued use of the platform after changes constitutes acceptance of the updated policy.',
  },
]

/** Default last updated date (ISO string) */
export const DEFAULT_PRIVACY_LAST_UPDATED = '2025-02-26'

/** Default contact info for privacy officer */
export const DEFAULT_PRIVACY_CONTACT = {
  officerName: 'Privacy Officer',
  email: 'privacy@roamresort.com',
  portalLink: '/settings',
}

/** PDF URL - set VITE_PRIVACY_PDF_URL for hosted PDF; when unset, use Print / Save as PDF */
export const PRIVACY_PDF_URL: string | null =
  (typeof import.meta.env.VITE_PRIVACY_PDF_URL === 'string' &&
   import.meta.env.VITE_PRIVACY_PDF_URL.trim().length > 0)
    ? import.meta.env.VITE_PRIVACY_PDF_URL.trim()
    : null

/** Normalize CMS/content response to sections array */
export function normalizePolicySections(content: unknown): PolicySection[] {
  if (!content || typeof content !== 'object') return PRIVACY_POLICY_SECTIONS
  const c = content as { sections?: unknown }
  return Array.isArray(c?.sections) ? (c.sections as PolicySection[]) : PRIVACY_POLICY_SECTIONS
}
