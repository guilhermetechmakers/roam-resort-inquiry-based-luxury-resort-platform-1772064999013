/**
 * Inquiry Create - Supabase Edge Function
 * Creates a new stay inquiry with server-side validation, activity log, and SendGrid email.
 * Endpoint: POST /functions/v1/inquiry-create
 * Payload: { listing_id, check_in, check_out, guests_count, rooms_count?, message, room_prefs?, suite_preferences?, budget_hint?, contact_preferences?, consent_privacy, consent_terms, attachment_urls? }
 * Required: Authorization Bearer token (authenticated user)
 * Optional secret: SENDGRID_API_KEY for confirmation emails
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface InquiryPayload {
  listing_id: string
  check_in?: string
  check_out?: string
  guests_count?: number
  rooms_count?: number
  message?: string
  room_prefs?: string[]
  suite_preferences?: string[]
  budget_hint?: string
  contact_preferences?: { email?: boolean; sms?: boolean; phone?: boolean }
  consent_privacy?: boolean
  consent_terms?: boolean
  attachment_urls?: string[]
  flexible_dates?: boolean
}

function isValidDate(s: string): boolean {
  const d = new Date(s)
  return !isNaN(d.getTime())
}

function isPastDate(s: string): boolean {
  const d = new Date(s)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

function isValidDateRange(start: string, end: string): boolean {
  if (!start || !end) return false
  const s = new Date(start)
  const e = new Date(end)
  return !isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s
}

function generateReference(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let ref = 'RR-'
  for (let i = 0; i < 8; i++) {
    ref += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return ref
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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Sign in to submit an inquiry.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseAdmin = createClient(supabaseUrl, supabaseKey)
    const token = authHeader.replace('Bearer ', '')

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized. Please sign in to submit an inquiry.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = (await req.json().catch(() => ({}))) as InquiryPayload
    const listingId = typeof body?.listing_id === 'string' ? body.listing_id.trim() : ''
    const checkIn = typeof body?.check_in === 'string' ? body.check_in.trim() : ''
    const checkOut = typeof body?.check_out === 'string' ? body.check_out.trim() : ''
    const guestsCount = Number(body?.guests_count) ?? 0
    const roomsCount = body?.rooms_count != null ? Number(body.rooms_count) : null
    const message = typeof body?.message === 'string' ? body.message.trim() : ''
    const roomPrefs = Array.isArray(body?.room_prefs) ? body.room_prefs : []
    const suitePrefs = Array.isArray(body?.suite_preferences) ? body.suite_preferences : []
    const budgetHint = typeof body?.budget_hint === 'string' ? body.budget_hint.trim().slice(0, 200) : null
    const contactPrefs = body?.contact_preferences && typeof body.contact_preferences === 'object'
      ? body.contact_preferences
      : { email: true, sms: false, phone: false }
    const consentPrivacy = !!body?.consent_privacy
    const consentTerms = !!body?.consent_terms
    const attachmentUrls = Array.isArray(body?.attachment_urls) ? body.attachment_urls : []
    const flexibleDates = !!body?.flexible_dates

    if (!listingId) {
      return new Response(
        JSON.stringify({ error: 'Destination (listing) is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!checkIn || !isValidDate(checkIn)) {
      return new Response(
        JSON.stringify({ error: 'Valid arrival date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!checkOut || !isValidDate(checkOut)) {
      return new Response(
        JSON.stringify({ error: 'Valid departure date is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!isValidDateRange(checkIn, checkOut)) {
      return new Response(
        JSON.stringify({ error: 'Departure date must be after arrival date' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!flexibleDates && isPastDate(checkIn)) {
      return new Response(
        JSON.stringify({ error: 'Arrival date must be today or in the future' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (guestsCount < 1 || guestsCount > 50) {
      return new Response(
        JSON.stringify({ error: 'Guest count must be between 1 and 50' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (message.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Message must be at least 10 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (message.length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Message must be 5000 characters or less' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!consentPrivacy || !consentTerms) {
      return new Response(
        JSON.stringify({ error: 'You must accept the Privacy Policy and Terms of Service' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: listing } = await supabaseAdmin
      .from('listings')
      .select('id, title')
      .eq('id', listingId)
      .single()

    if (!listing) {
      return new Response(
        JSON.stringify({ error: 'Destination not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: overlapping } = await supabaseAdmin
      .from('inquiries')
      .select('id')
      .eq('listing_id', listingId)
      .eq('guest_id', user.id)
      .gte('check_out', checkIn)
      .lte('check_in', checkOut)
      .neq('status', 'cancelled')
      .limit(1)

    const overlaps = Array.isArray(overlapping) ? overlapping : []
    if (overlaps.length > 0) {
      return new Response(
        JSON.stringify({
          error: 'You already have an inquiry for this destination with overlapping dates. Please update the existing inquiry or choose different dates.',
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const reference = generateReference()
    const guestEmail = user.email ?? ''
    const guestName = (user.user_metadata?.full_name as string) ?? guestEmail

    const insertPayload = {
      reference,
      guest_id: user.id,
      listing_id: listingId,
      check_in: checkIn,
      check_out: checkOut,
      guests_count: guestsCount,
      rooms_count: roomsCount,
      message,
      room_prefs: roomPrefs.length > 0 ? roomPrefs : null,
      suite_preferences: suitePrefs.length > 0 ? suitePrefs : null,
      budget_hint: budgetHint,
      contact_preferences: contactPrefs,
      consent_privacy: consentPrivacy,
      consent_terms: consentTerms,
      flexible_dates: flexibleDates,
      status: 'new',
      guest_name: guestName,
      guest_email: guestEmail,
      metadata: { attachment_urls: attachmentUrls, source: 'web' },
      payment_state: 'pending',
    }

    const { data: inquiry, error: insertError } = await supabaseAdmin
      .from('inquiries')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error('inquiry-create insert error:', insertError)
      return new Response(
        JSON.stringify({ error: insertError.message ?? 'Failed to create inquiry' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await supabaseAdmin.from('inquiry_activity_log').insert({
      inquiry_id: inquiry.id,
      action: 'created',
      performed_by_role: 'guest',
      performed_by_user_id: user.id,
      note: 'Inquiry submitted',
      metadata: {},
    })

    const sendgridKey = Deno.env.get('SENDGRID_API_KEY')
    if (sendgridKey && guestEmail) {
      try {
        await fetch('https://api.sendgrid.com/v3/mail/send', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${sendgridKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            personalizations: [{ to: [{ email: guestEmail, name: guestName }] }],
            from: {
              email: Deno.env.get('SENDGRID_FROM_EMAIL') ?? 'noreply@roamresort.com',
              name: Deno.env.get('SENDGRID_FROM_NAME') ?? 'Roam Resort',
            },
            subject: `Inquiry Confirmed – ${reference}`,
            content: [
              {
                type: 'text/html',
                value: `
                  <h2>Your inquiry has been received</h2>
                  <p>Reference: <strong>${reference}</strong></p>
                  <p>Destination: ${(listing as { title?: string })?.title ?? 'Destination'}</p>
                  <p>Dates: ${checkIn} – ${checkOut}</p>
                  <p>Guests: ${guestsCount}</p>
                  <p>Our concierge team will respond within 24–48 hours.</p>
                  <p>— Roam Resort</p>
                `,
              },
            ],
          }),
        })
      } catch (emailErr) {
        console.error('SendGrid error:', emailErr)
      }
    }

    return new Response(
      JSON.stringify({
        id: inquiry.id,
        reference: inquiry.reference ?? reference,
        status: inquiry.status ?? 'new',
        created_at: inquiry.created_at,
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
