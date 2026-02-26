/**
 * Send Inquiry Email - Supabase Edge Function
 * POST /functions/v1/send-inquiry-email
 * Sends email notifications via SendGrid for inquiry submission, status changes, and confirmations.
 * Required secrets: SENDGRID_API_KEY
 * Set via: supabase secrets set SENDGRID_API_KEY=SG.xxx
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SENDGRID_URL = 'https://api.sendgrid.com/v3/mail/send'

interface EmailPayload {
  type: 'submission' | 'status_change' | 'confirmation'
  inquiryId?: string
  reference?: string
  guestEmail?: string
  guestName?: string
  listingTitle?: string
  checkIn?: string
  checkOut?: string
  guestsCount?: number
  status?: string
  siteUrl?: string
  conciergeEmail?: string
}

function formatDate(d: string): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return d
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const apiKey = Deno.env.get('SENDGRID_API_KEY')
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'SendGrid not configured' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const body = (await req.json().catch(() => ({}))) as EmailPayload
    const type = body.type ?? 'submission'
    const guestEmail = body.guestEmail ?? ''
    const reference = body.reference ?? ''
    const siteUrl = body.siteUrl ?? 'https://roamresort.com'

    if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      return new Response(
        JSON.stringify({ error: 'Valid guest email required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'concierge@roamresort.com'
    const fromName = Deno.env.get('SENDGRID_FROM_NAME') ?? 'Roam Resort Concierge'

    let subject = ''
    let html = ''

    if (type === 'submission') {
      const guestName = body.guestName ?? 'Guest'
      const listingTitle = body.listingTitle ?? 'Destination'
      const checkIn = formatDate(body.checkIn ?? '')
      const checkOut = formatDate(body.checkOut ?? '')
      const guestsCount = body.guestsCount ?? 0

      subject = `Inquiry Confirmed - ${reference}`
      html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Inquiry Confirmed</title></head>
<body style="font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-family: Georgia, serif; color: #1a365d;">Inquiry Confirmed</h1>
  <p>Dear ${guestName},</p>
  <p>Thank you for your stay inquiry. We've received your request and our concierge team will respond within <strong>24–48 hours</strong>.</p>
  <div style="background: #f7fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0 0 8px;"><strong>Reference:</strong> ${reference}</p>
    <p style="margin: 0 0 8px;"><strong>Destination:</strong> ${listingTitle}</p>
    <p style="margin: 0 0 8px;"><strong>Dates:</strong> ${checkIn} – ${checkOut}</p>
    <p style="margin: 0;"><strong>Guests:</strong> ${guestsCount}</p>
  </div>
  <h2 style="font-size: 1.1em;">Next Steps</h2>
  <p>When your stay is confirmed, our concierge will send you a secure payment link. Payment is processed via Stripe Connect. No payment is required until your reservation is confirmed.</p>
  <p>Questions? Reply to this email or contact <a href="mailto:concierge@roamresort.com">concierge@roamresort.com</a>.</p>
  <p style="margin-top: 32px; color: #718096; font-size: 0.9em;">Roam Resort Concierge</p>
</body>
</html>`
    } else if (type === 'status_change') {
      const status = body.status ?? 'updated'
      subject = `Inquiry ${status} - ${reference}`
      html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Inquiry Update</title></head>
<body style="font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-family: Georgia, serif; color: #1a365d;">Inquiry Update</h1>
  <p>Your inquiry (${reference}) has been updated to: <strong>${status}</strong>.</p>
  <p><a href="${siteUrl}/profile/inquiries" style="color: #b8860b; text-decoration: underline;">View your inquiries</a></p>
  <p style="margin-top: 32px; color: #718096; font-size: 0.9em;">Roam Resort Concierge</p>
</body>
</html>`
    } else {
      subject = `Inquiry Confirmation - ${reference}`
      html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Inquiry Confirmation</title></head>
<body style="font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-family: Georgia, serif; color: #1a365d;">Inquiry Confirmed</h1>
  <p>Your inquiry has been received. Reference: <strong>${reference}</strong></p>
  <p>Our concierge team will respond within 24–48 hours.</p>
  <p style="margin-top: 32px; color: #718096; font-size: 0.9em;">Roam Resort Concierge</p>
</body>
</html>`
    }

    const res = await fetch(SENDGRID_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: guestEmail }] }],
        from: { email: fromEmail, name: fromName },
        subject,
        content: [{ type: 'text/html', value: html }],
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      console.error('SendGrid error:', res.status, errText)
      return new Response(
        JSON.stringify({ error: 'Failed to send email' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('send-inquiry-email error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message ?? 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
