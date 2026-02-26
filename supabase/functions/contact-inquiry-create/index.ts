/**
 * Contact Inquiry Create - Supabase Edge Function
 * POST /functions/v1/contact-inquiry-create
 * Accepts contact/support form submissions (general + concierge).
 * Validates, stores in contact_inquiries, triggers email confirmation.
 * Public endpoint - no auth required.
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

interface ContactBody {
  name?: string
  email?: string
  subject?: string
  message?: string
  destination_id?: string | null
  start_date?: string | null
  end_date?: string | null
  guests?: number | null
  inquiry_reference?: string | null
  is_concierge?: boolean
  preferred_contact_method?: string | null
  user_id?: string | null
}

function sanitize(str: string, maxLen: number): string {
  return String(str ?? '')
    .trim()
    .slice(0, maxLen)
    .replace(/[<>]/g, '')
}

function generateReference(): string {
  return `RR-CI-${Date.now().toString(36).toUpperCase()}`
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
    const body = (await req.json().catch(() => ({}))) as ContactBody
    const name = sanitize(body.name ?? '', 100)
    const email = sanitize(body.email ?? '', 255)
    const subject = sanitize(body.subject ?? '', 200)
    const message = sanitize(body.message ?? '', 2000)
    const destinationId = body.destination_id ?? null
    const startDate = body.start_date ?? null
    const endDate = body.end_date ?? null
    const guests = body.guests != null && Number.isInteger(body.guests) ? body.guests : null
    const inquiryReference = body.inquiry_reference ? sanitize(body.inquiry_reference, 50) : null
    const isConcierge = !!body.is_concierge
    const preferredContactMethod =
      body.preferred_contact_method === 'email' || body.preferred_contact_method === 'phone'
        ? body.preferred_contact_method
        : null
    const userId = body.user_id ?? null

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
    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Message must be 2000 characters or less' }),
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
      const start = new Date(startDate)
      const end = new Date(endDate)
      if (isNaN(start.getTime()) || isNaN(end.getTime()) {
        return new Response(
          JSON.stringify({ ok: false, message: 'Invalid date format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (end <= start) {
        return new Response(
          JSON.stringify({ ok: false, message: 'Check-out must be after check-in' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (start < today) {
        return new Response(
          JSON.stringify({ ok: false, message: 'Check-in date must be today or in the future' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (guests == null || guests < 1 || guests > 20) {
        return new Response(
          JSON.stringify({ ok: false, message: 'Guests must be between 1 and 20' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    const reference = inquiryReference ?? generateReference()

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Server configuration error' }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: inserted, error: insertError } = await supabase
      .from('contact_inquiries')
      .insert({
        user_id: userId,
        name,
        email,
        subject,
        message,
        destination_id: destinationId,
        start_date: startDate,
        end_date: endDate,
        guests,
        inquiry_reference: reference,
        is_concierge: isConcierge,
        preferred_contact_method: preferredContactMethod,
        status: 'new',
      })
      .select('id, created_at')
      .single()

    if (insertError) {
      console.error('contact-inquiry-create insert error:', insertError)
      return new Response(
        JSON.stringify({ ok: false, message: 'Failed to save inquiry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const inquiryId = inserted?.id ?? ''
    const createdAt = inserted?.created_at ?? new Date().toISOString()

    try {
      const functionsUrl = `${supabaseUrl}/functions/v1/send-inquiry-email`
      const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? supabaseKey
      await fetch(functionsUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: 'confirmation',
          inquiryId,
          reference,
          guestEmail: email,
          guestName: name,
        }),
      })
    } catch (emailErr) {
      console.error('contact-inquiry-create email error:', emailErr)
    }

    return new Response(
      JSON.stringify({
        id: inquiryId,
        status: 'new',
        createdAt,
        reference,
        submissionUrl: `/contact/confirmation/${inquiryId}`,
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
