import type { TermsSection } from '@/types/terms'

/** Sample Terms sections - CMS-ready, can be replaced by API/CMS data */
export const sampleSections: TermsSection[] = [
  {
    id: 'acceptance-scope',
    title: 'Acceptance and Scope',
    body: 'By accessing or using Roam Resort ("Platform"), you agree to be bound by these Terms of Service. If you do not agree, do not use the Platform. These terms apply to all guests, hosts, and visitors.',
    bullets: [
      'You must be at least 18 years old to use the Platform.',
      'You must provide accurate information when creating an account or submitting inquiries.',
      'Your use of the Platform constitutes acceptance of these terms.',
    ],
    listType: 'ul',
  },
  {
    id: 'guest-rules',
    title: 'Services and Use Rules (Guests)',
    body: 'Guests may use the Platform to browse destinations, submit stay inquiries, and communicate with our concierge team. The following rules apply:',
    bullets: [
      'Inquiries must be submitted in good faith and reflect genuine interest in a stay.',
      'You may not use the Platform for commercial resale or unauthorized distribution of listings.',
      'You must respect host property rules and local regulations during your stay.',
      'False or misleading information in inquiries is prohibited.',
    ],
    listType: 'ul',
  },
  {
    id: 'host-rules',
    title: 'Services and Use Rules (Hosts)',
    body: 'Hosts may list properties and respond to guest inquiries through the Platform. Hosts must:',
    bullets: [
      'Provide accurate, up-to-date listing information.',
      'Respond to inquiries in a timely manner.',
      'Honor confirmed bookings and disclosed amenities.',
      'Comply with applicable local laws, permits, and tax obligations.',
    ],
    listType: 'ul',
  },
  {
    id: 'payment-terms',
    title: 'Payment Terms',
    body: 'Payments for stays are processed through our secure payment partner. By completing a booking, you agree to the following:',
    bullets: [
      'All fees, taxes, and charges will be clearly disclosed before confirmation.',
      'Refunds are subject to the cancellation policy associated with your booking.',
      'Roam Resort may charge service fees as disclosed at checkout.',
      'Disputed charges must be reported within 30 days of the transaction.',
    ],
    listType: 'ul',
  },
  {
    id: 'liability-disclaimers',
    title: 'Liability and Disclaimers',
    body: 'To the fullest extent permitted by law:',
    bullets: [
      'Roam Resort acts as an intermediary between guests and hosts and is not liable for host conduct, property condition, or third-party services.',
      'The Platform is provided "as is" without warranties of any kind.',
      'We do not guarantee availability, accuracy of listings, or uninterrupted service.',
      'Your use of the Platform is at your own risk.',
    ],
    listType: 'ul',
    disclaimer: 'Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability. In such cases, our liability is limited to the maximum extent permitted by law.',
  },
  {
    id: 'host-responsibilities',
    title: 'Host Responsibilities',
    body: 'Hosts are responsible for maintaining their listings, ensuring safety and compliance, and providing the experience described. Hosts must:',
    bullets: [
      'Maintain valid insurance where required.',
      'Ensure properties meet safety standards and local regulations.',
      'Provide accurate check-in instructions and support during the stay.',
      'Address guest concerns promptly and professionally.',
    ],
    listType: 'ul',
  },
  {
    id: 'termination-suspension',
    title: 'Termination and Suspension',
    body: 'We may suspend or terminate your access to the Platform at any time for violation of these terms, fraudulent activity, or at our discretion. You may close your account at any time through your account settings.',
    bullets: [
      'Upon termination, your right to use the Platform ceases immediately.',
      'Provisions that by their nature should survive (e.g., liability limitations, dispute resolution) will remain in effect.',
    ],
    listType: 'ul',
  },
  {
    id: 'privacy-data-rights',
    title: 'Privacy & Data Rights',
    body: 'We respect your privacy and comply with applicable data protection laws, including GDPR and CCPA. You have the right to access, export, correct, or delete your personal data. To exercise these rights, visit your account settings or use our Privacy & Data tools.',
  },
]

/** Default last updated date (ISO string) */
export const DEFAULT_LAST_UPDATED = '2025-02-26'
