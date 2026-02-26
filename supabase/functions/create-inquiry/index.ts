/**
 * Create Inquiry - Supabase Edge Function
 * POST /functions/v1/create-inquiry
 * Creates a new stay inquiry with server-side validation, activity log, and email notification.
 * Auth required. Validates: date ranges, guest counts, duplicate/overlap checks.
 * Required secrets: SENDGRID_API_KEY (optional, for email), SITE_URL
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function generateReference(): string {
  let ref = 'RR-'
  for (let i = 0; i < 8; i++) {
    ref += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
  }
  return ref
}

function isValidDateRange(start: string, end: string): boolean {
  if (!start || !end) return false
  const s = new Date(start)
  const e = new Date(end)
  return !isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s
}

function isPastDate(date: string): boolean {
  if (!date) return true
  const d = new Date(date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return d < today
}

interface CreateInquiryPayload {
  guest_id: string
  listing_id: string
  check_in?: string
  check_out?: string
  guests_count?: number
  rooms_count?: number
  message?: string
  flexible_dates?: boolean
  room_prefs?: string[]
  suite_preferences?: string[]
  budget_hint?: string
  contact_preferences?: { email?: boolean; sms?: boolean; phone?: boolean }
  consent_privacy?: boolean
  consent_terms?: boolean
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

  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Authorization required' }),
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
  const supabase = createClient(supabaseUrl, supabaseKey)

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid or expired session' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (user.id !== (await req.json().then((b) => (b as CreateInquiryPayload)?.guest_id).catch(() => '')) {
    return new Response(
      JSON.stringify({ error: 'Guest ID must match authenticated user' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const body = (await req.json().catch(() => ({}))) as CreateInquiryPayload
  const guestId = String(body.guest_id ?? '').trim()
  const listingId = String(body.listing_id ?? '').trim()
  const checkIn = String(body.check_in ?? '').trim()
  const checkOut = String(body.check_out ?? '').trim()
  const guestsCount = Math.max(1, Math.min(20, Number(body.guests_count) || 1))
  const roomsCount = body.rooms_count != null ? Math.max(1, Math.min(10, Number(body.rooms_count) || 1)) : null
  const message = String(body.message ?? '').trim().slice(0, 2000)
  const flexibleDates = !!body.flexible_dates
  const roomPrefs = Array.isArray(body.room_prefs) ? body.room_prefs : []
  const suitePrefs = Array.isArray(body.suite_preferences) ? body.suite_preferences : (Array.isArray(body.room_prefs) ? body.room_prefs : [])
  const budgetHint = String(body.budget_hint ?? '').trim().slice(0, 100) || null
  const contactPrefs = body.contact_preferences ?? { email: true, sms: false, phone: false }
  const consentPrivacy = !!body.consent_privacy
  const consentTerms = !!body.consent_terms

  if (!guestId || !listingId) {
    return new Response(
      JSON.stringify({ error: 'Guest ID and listing ID are required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!checkIn || !checkOut) {
    return new Response(
      JSON.stringify({ error: 'Check-in and check-out dates are required' }),
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

  if (!consentPrivacy || !consentTerms) {
    return new Response(
      JSON.stringify({ error: 'Please accept the Privacy Policy and Terms of Service' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, capacity')
    .eq('id', listingId)
    .single()

  if (!listing) {
    return new Response(
      JSON.stringify({ error: 'Listing not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const capacity = (listing as { capacity?: number }).capacity
  if (capacity != null && guestsCount > capacity) {
    return new Response(
      JSON.stringify({ error: `Maximum ${capacity} guests for this listing` }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const { data: overlapping } = await supabase
    .from('inquiries')
    .select('id')
    .eq('listing_id', listingId)
    .eq('guest_id', guestId)
    .in('status', ['new', 'contacted', 'in_review', 'deposit_paid', 'confirmed'])
    .lte('check_in', checkOut)
    .gte('check_out', checkIn)

  const overlaps = overlapping ?? []
  if (Array.isArray(overlaps) && overlaps.length > 0) {
    return new Response(
      JSON.stringify({ error: 'You already have an active inquiry for this listing with overlapping dates' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const reference = generateReference()
  const guestEmail = user.email ?? ''
  const guestName = (user.user_metadata?.full_name as string) ?? guestEmail

  const insertPayload = {
    reference,
    guest_id: guestId,
    listing_id: listingId,
    check_in: checkIn,
    check_out: checkOut,
    guests_count: guestsCount,
    rooms_count: roomsCount,
    message: message || null,
    flexible_dates: flexibleDates,
    room_prefs: roomPrefs.length > 0 ? roomPrefs : (suitePrefs.length > 0 ? suitePrefs : []),
    budget_hint: budgetHint,
    contact_preferences: contactPrefs,
    consent_privacy: consentPrivacy,
    consent_terms: consentTerms,
    status: 'new',
    payment_state: 'pending',
    guest_email: guestEmail,
    guest_name: guestName,
  }

  const { data: inquiry, error: insertError } = await supabase
    .from('inquiries')
    .insert(insertPayload)
    .select()
    .single()

  if (insertError) {
    console.error('create-inquiry insert error:', insertError)
    return new Response(
      JSON.stringify({ error: insertError.message ?? 'Failed to create inquiry' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const inquiryId = (inquiry as { id: string }).id

  await supabase.from('inquiry_activity_log').insert({
    inquiry_id: inquiryId,
    action: 'created',
    performed_by_role: 'guest',
    performed_by_user_id: guestId,
    note: 'Inquiry submitted',
    metadata: {},
  })

  const siteUrl = Deno.env.get('SITE_URL') ?? 'https://roamresort.com'
  if (guestEmail) {
    try {
      await fetch(`${supabaseUrl}/functions/v1/send-inquiry-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          type: 'submission',
          inquiryId,
          reference,
          guestEmail,
          guestName,
          listingTitle: (listing as { title?: string }).title ?? 'Destination',
          checkIn,
          checkOut,
          guestsCount,
          siteUrl,
        }),
      })
    } catch (emailErr) {
      console.error('send-inquiry-email error:', emailErr)
    }
  }

  return new Response(
    JSON.stringify({
      id: inquiryId,
      reference,
      status: 'new',
      ...(inquiry as object),
    }),
    { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
