/**
 * Privacy Policy - Supabase Edge Function
 * GET /functions/v1/privacy-policy
 * Returns policy content sections for the Privacy Policy page.
 * Optional CMS integration: can be extended to fetch from a CMS.
 * No auth required - policy is public.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const POLICY_SECTIONS = [
  {
    id: 'data-collection',
    title: 'Data Collection',
    content:
      'Roam Resort collects information you provide directly when you create an account, submit an inquiry, make a booking, or contact us. This includes name, email address, phone number, payment information, travel preferences, and communications with our concierge team. We also automatically collect certain technical data such as IP address, browser type, device information, and usage patterns when you interact with our platform.',
    subsections: [
      { id: 'account-data', title: 'Account and Profile Data', content: 'When you register, we collect your name, email, and any profile details you choose to provide. Hosts additionally provide property information, availability, and payment details for payouts.' },
      { id: 'booking-data', title: 'Booking and Inquiry Data', content: 'Inquiry and booking data includes dates, guest count, special requests, and any messages exchanged with hosts or our concierge team.' },
    ],
  },
  {
    id: 'data-use',
    title: 'Data Use',
    content:
      'We use your data to provide, maintain, and improve our services; process bookings and payments; communicate with you about your stays; personalize your experience; detect and prevent fraud; comply with legal obligations; and send marketing communications where you have consented.',
  },
  {
    id: 'data-sharing',
    title: 'Data Sharing',
    content:
      'We share data with hosts (to fulfill bookings), payment processors, service providers who assist our operations, and authorities when required by law. We do not sell your personal data. Third-party processors are bound by data processing agreements and use your data only for the purposes we specify.',
  },
  {
    id: 'data-retention-security',
    title: 'Data Retention & Security',
    content:
      'We retain your data for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce agreements. Typically, account data is retained for up to 7 years after your last activity for legal and tax purposes. We implement industry-standard security measures including encryption, access controls, and regular audits to protect your data.',
  },
  {
    id: 'user-rights',
    title: 'Your Rights (Access, Portability, Deletion, Objections)',
    content:
      'Under GDPR and CCPA, you have the right to access your personal data, request a portable copy (data export), request correction, request deletion, object to certain processing, withdraw consent, and lodge a complaint with a supervisory authority. To exercise these rights, use our Privacy & Data Tools in Settings or contact our Privacy Officer.',
    subsections: [
      { id: 'access', title: 'Right of Access', content: 'You may request a copy of the personal data we hold about you.' },
      { id: 'portability', title: 'Data Portability', content: 'You may request your data in a structured, machine-readable format to transfer to another service.' },
      { id: 'deletion', title: 'Right to Erasure', content: 'You may request deletion of your account and associated personal data, subject to legal retention requirements.' },
      { id: 'objection', title: 'Right to Object', content: 'You may object to processing based on legitimate interests or for direct marketing purposes.' },
    ],
  },
  {
    id: 'cookies-tracking',
    title: 'Cookies & Tracking',
    content:
      'We use cookies and similar technologies to enable essential functionality, remember your preferences, analyze site usage, and deliver relevant content. You can manage cookie preferences in your browser settings. Essential cookies are required for the platform to function; optional analytics and marketing cookies can be disabled.',
  },
  {
    id: 'data-transfers',
    title: 'International Data Transfers',
    content:
      'Your data may be transferred to and processed in countries outside your residence. We ensure appropriate safeguards (such as Standard Contractual Clauses) are in place when transferring data to countries that do not provide equivalent protection.',
  },
  {
    id: 'policy-updates',
    title: 'Policy Updates',
    content:
      'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and updating the "Last updated" date. Continued use of the platform after changes constitutes acceptance of the updated policy. We encourage you to review this policy periodically.',
  },
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'GET') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const payload = {
      sections: POLICY_SECTIONS,
      lastUpdated: '2025-02-26',
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
