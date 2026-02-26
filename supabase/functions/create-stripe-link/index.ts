/**
 * Create Stripe Payment Link or Checkout Session - Supabase Edge Function
 * Integrates with Stripe API for manual payment collection.
 * Endpoint: POST /functions/v1/create-stripe-link
 * Payload: { inquiryId, amount, currency?, useCheckoutSession?, accountId?, expiresInDays?, metadata?, items?, notes? }
 * Required secret: STRIPE_SECRET_KEY
 * Optional: STRIPE_WEBHOOK_SECRET for idempotency
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, idempotency-key',
}

interface LineItem {
  name: string
  quantity: number
  unitPrice: number
  description?: string
}

interface RequestPayload {
  inquiryId?: string
  guestId?: string
  amount: number
  currency?: string
  useCheckoutSession?: boolean
  accountId?: string
  expiresInDays?: number
  metadata?: Record<string, string>
  items?: LineItem[]
  notes?: string
}

const SUPPORTED_CURRENCIES = ['usd', 'eur', 'gbp', 'cad', 'aud']
const DEFAULT_CURRENCY = 'usd'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) {
      return new Response(
        JSON.stringify({
          error: 'Stripe is not configured. Set STRIPE_SECRET_KEY in Supabase secrets.',
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const payload = (await req.json().catch(() => ({}))) as RequestPayload
    const inquiryId = typeof payload?.inquiryId === 'string' ? payload.inquiryId : ''
    const guestId = typeof payload?.guestId === 'string' ? payload.guestId : ''
    const amount = Number(payload?.amount) ?? 0
    const items = Array.isArray(payload?.items) ? payload.items : []
    const notes = typeof payload?.notes === 'string' ? payload.notes : ''
    const useCheckoutSession = Boolean(payload?.useCheckoutSession)
    const accountId = typeof payload?.accountId === 'string' ? payload.accountId : undefined
    const expiresInDays = typeof payload?.expiresInDays === 'number' ? payload.expiresInDays : undefined
    const currency = (payload?.currency ?? DEFAULT_CURRENCY).toLowerCase()
    const metadata = payload?.metadata ?? {}

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
      return new Response(
        JSON.stringify({ error: `Unsupported currency. Use one of: ${SUPPORTED_CURRENCIES.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (amount <= 0 && items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Amount must be greater than 0 or provide line items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalCents = Math.round(
      amount > 0 ? amount * 100 : items.reduce((s, i) => s + (i.quantity ?? 1) * (i.unitPrice ?? 0) * 100, 0)
    )
    if (totalCents <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount or line items' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const productName = items.length > 0 ? (items[0]?.name ?? 'Deposit') : 'Deposit'
    const siteUrl = Deno.env.get('SITE_URL') ?? 'https://example.com'

    const stripeHeaders: Record<string, string> = {
      Authorization: `Bearer ${stripeKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    }
    if (accountId) {
      stripeHeaders['Stripe-Account'] = accountId
    }

    const idempotencyKey = req.headers.get('idempotency-key') ?? `inquiry-${inquiryId}-${Date.now()}`

    const meta: Record<string, string> = {
      ...metadata,
      inquiry_id: inquiryId,
      guest_id: guestId,
      platform: 'RoamResort',
      purpose: 'inquiry_payment',
    }
    if (notes) meta.notes = notes.slice(0, 500)

    let stripeLinkUrl: string | null = null
    let stripeLinkId: string | null = null
    let stripeCheckoutSessionId: string | null = null
    let expiresAt: string | null = null

    if (useCheckoutSession) {
      const sessionParams = new URLSearchParams({
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][product_data][name]': productName,
        'line_items[0][price_data][unit_amount]': String(totalCents),
        'line_items[0][quantity]': '1',
        mode: 'payment',
        success_url: `${siteUrl}/checkout/complete/${inquiryId}?session_id={CHECKOUT_SESSION_ID}&status=success`,
        cancel_url: `${siteUrl}/checkout/bridge/${inquiryId}?status=cancelled`,
      })
      Object.entries(meta).forEach(([k, v]) => {
        if (v) sessionParams.set(`metadata[${k}]`, v)
      })
      if (expiresInDays != null && expiresInDays > 0) {
        const exp = Math.floor(Date.now() / 1000) + expiresInDays * 86400
        sessionParams.set('expires_at', String(exp))
        expiresAt = new Date(exp * 1000).toISOString()
      }

      const sessionRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: stripeHeaders,
        body: sessionParams.toString(),
      })
      const sessionData = (await sessionRes.json().catch(() => ({}))) as {
        id?: string
        url?: string
        error?: { message?: string }
      }
      if (sessionData.error) {
        return new Response(
          JSON.stringify({ error: sessionData.error?.message ?? 'Stripe error' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      stripeCheckoutSessionId = sessionData.id ?? null
      stripeLinkUrl = sessionData.url ?? null
    } else {
      const params = new URLSearchParams({
        'line_items[0][price_data][currency]': currency,
        'line_items[0][price_data][product_data][name]': productName,
        'line_items[0][price_data][unit_amount]': String(totalCents),
        'line_items[0][quantity]': '1',
      })
      Object.entries(meta).forEach(([k, v]) => {
        if (v) params.set(`metadata[${k}]`, v)
      })
      if (inquiryId) {
        params.set('after_completion[type]', 'redirect')
        params.set(
          'after_completion[redirect][url]',
          `${siteUrl}/checkout/complete/${inquiryId}?session_id={CHECKOUT_SESSION_ID}&status=success`
        )
      }
      if (expiresInDays != null && expiresInDays > 0) {
        const exp = Math.floor(Date.now() / 1000) + expiresInDays * 86400
        params.set('expires_at', String(exp))
        expiresAt = new Date(exp * 1000).toISOString()
      }

      const res = await fetch('https://api.stripe.com/v1/payment_links', {
        method: 'POST',
        headers: { ...stripeHeaders, 'Idempotency-Key': idempotencyKey },
        body: params.toString(),
      })

      const data = (await res.json().catch(() => ({}))) as {
        url?: string
        id?: string
        error?: { message?: string }
      }
      if (data.error) {
        return new Response(
          JSON.stringify({ error: data.error?.message ?? 'Stripe error' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (!data.url) {
        return new Response(
          JSON.stringify({ error: 'Could not create payment link' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      stripeLinkUrl = data.url
      stripeLinkId = data.id ?? null
    }

    return new Response(
      JSON.stringify({
        success: true,
        paymentLinkUrl: stripeLinkUrl,
        stripeLinkUrl,
        stripeLinkId,
        stripeCheckoutSessionId,
        expiresAt,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
