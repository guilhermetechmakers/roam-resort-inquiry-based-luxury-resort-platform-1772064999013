/**
 * Contact Inquiry - Supabase Edge Function
 * POST /functions/v1/contact-inquiry
 * Accepts contact/support form submissions (general or concierge requests).
 * Validates inputs, stores in contact_inquiries table, triggers email confirmation.
 * Public endpoint - no auth required for submission.
 * Required secrets: SENDGRID_API_KEY (optional, for email)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SUBJECTS = [
  'General Question',
  'Concierge Request',
  'Payment Inquiry',
  'Booking & Availability',
  'Cancellation or Changes',
  'Technical Support',
  'Feedback',
  'Other',
]

interface ContactInquiryBody {
  name?: string
  email?: string
  subject?: string
  message?: string
  destinationId?: string
  startDate?: string
  endDate?: string
  guests?: number
  inquiryReference?: string
  isConcierge?: boolean
  preferredContactMethod?: string
  userId?: string
}

function sanitize(str: string | null | undefined, maxLen: number): string {
  return String(str ?? '')
    .trim()
    .slice(0, maxLen)
    .replace(/[<>]/g, '')
}

function parseDate(d: string | null | undefined): string | null {
  if (!d || typeof d !== 'string') return null
  const trimmed = d.trim()
  if (!trimmed) return null
  const parsed = new Date(trimmed)
  return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10)
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

  try {
    const body = (await req.json().catch(() => ({}))) as ContactInquiryBody
    const name = sanitize(body.name ?? '', 100)
    const email = sanitize(body.email ?? '', 255)
    const subject = sanitize(body.subject ?? '', 100)
    const message = sanitize(body.message ?? '', 5000)
    const destinationId = body.destinationId && typeof body.destinationId === 'string'
      ? body.destinationId.trim().slice(0, 36)
      : null
    const startDate = parseDate(body.startDate)
    const endDate = parseDate(body.endDate)
    const guests = typeof body.guests === 'number' && body.guests > 0
      ? Math.min(body.guests, 99)
      : null
    const inquiryReference = sanitize(body.inquiryReference ?? '', 50) || null
    const isConcierge = !!body.isConcierge
    const preferredContactMethod = sanitize(body.preferredContactMethod ?? '', 20) || null
    const userId = body.userId && typeof body.userId === 'string'
      ? body.userId.trim().slice(0, 36)
      : null

    if (!name || name.length < 1) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!subject || subject.length < 1) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Subject is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!SUBJECTS.includes(subject)) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Invalid subject' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (!message || message.length < 10) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Message must be at least 10 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Message must be 5000 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (isConcierge) {
      if (!startDate || !endDate) {
        return new Response(
          JSON.stringify({ ok: false, message: 'Check-in and check-out dates are required for concierge requests' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const start = new Date(startDate).getTime()
      const end = new Date(endDate).getTime()
      const today = new Date().setHours(0, 0, 0, 0)
      if (start < today) {
        return new Response(
          JSON.stringify({ ok: false, message: 'Check-in date must be in the future' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (end <= start) {
        return new Response(
          JSON.stringify({ ok: false, message: 'Check-out date must be after check-in' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!guests || guests < 1) {
        return new Response(
          JSON.stringify({ ok: false, message: 'Number of guests is required for concierge requests' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: row, error } = await supabase
      .from('contact_inquiries')
      .insert({
        user_id: userId || null,
        name,
        email,
        subject,
        message,
        destination_id: destinationId || null,
        start_date: startDate || null,
        end_date: endDate || null,
        guests: guests ?? null,
        inquiry_reference: inquiryReference,
        is_concierge: isConcierge,
        preferred_contact_method: preferredContactMethod,
        status: 'New',
        updated_at: new Date().toISOString(),
      })
      .select('id, status, created_at')
      .single()

    if (error || !row) {
      console.error('contact-inquiry insert error:', error)
      return new Response(
        JSON.stringify({ ok: false, message: 'Failed to save inquiry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const reference = `RR-CI-${(row.id as string).slice(0, 8).toUpperCase()}`

    const apiKey = Deno.env.get('SENDGRID_API_KEY')
    if (apiKey) {
      const siteUrl = Deno.env.get('SITE_URL') ?? 'https://roamresort.com'
      const fromEmail = Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'concierge@roamresort.com'
      const fromName = Deno.env.get('SENDGRID_FROM_NAME') ?? 'Roam Resort Concierge'

      const formatDate = (d: string | null) => {
        if (!d) return ''
        try {
          return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        } catch {
          return d
        }
      }

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Inquiry Confirmed</title></head>
<body style="font-family: Inter, system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h1 style="font-family: Georgia, serif; color: #23212A;">Inquiry Confirmed</h1>
  <p>Dear ${name},</p>
  <p>Thank you for reaching out. We've received your ${isConcierge ? 'concierge request' : 'inquiry'} and our team will respond within <strong>24 hours</strong> on business days.</p>
  <div style="background: #f7fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
    <p style="margin: 0 0 8px;"><strong>Reference:</strong> ${reference}</p>
    <p style="margin: 0 0 8px;"><strong>Subject:</strong> ${subject}</p>
    ${startDate && endDate ? `<p style="margin: 0 0 8px;"><strong>Dates:</strong> ${formatDate(startDate)} – ${formatDate(endDate)}</p>` : ''}
    ${guests ? `<p style="margin: 0;"><strong>Guests:</strong> ${guests}</p>` : ''}
  </div>
  <p>Questions? Reply to this email or contact <a href="mailto:concierge@roamresort.com">concierge@roamresort.com</a>.</p>
  <p style="margin-top: 32px; color: #718096; font-size: 0.9em;">Roam Resort Concierge</p>
</body>
</html>`

      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: fromEmail, name: fromName },
          subject: `Inquiry Confirmed - ${reference}`,
          content: [{ type: 'text/html', value: html }],
        }),
      })
      if (!res.ok) {
        console.error('SendGrid error:', res.status, await res.text())
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        id: row.id,
        reference,
        status: row.status ?? 'New',
        createdAt: row.created_at,
        message: 'Message sent. Our concierge team will respond within 24 hours.',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ ok: false, message: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
