/**
 * Create Stripe Payment Link - Supabase Edge Function
 * Integrates with Stripe API to create payment links for inquiry deposits.
 * Endpoint: POST /functions/v1/create-stripe-link
 * Payload: { inquiryId, amount, items?, notes? }
 * Required secret: STRIPE_SECRET_KEY (set via supabase secrets set STRIPE_SECRET_KEY sk_xxx)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LineItem {
  name: string
  quantity: number
  unitPrice: number
  description?: string
}

interface RequestPayload {
  inquiryId?: string
  amount: number
  items?: LineItem[]
  notes?: string
}

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
    const amount = Number(payload?.amount) ?? 0
    const items = Array.isArray(payload?.items) ? payload.items : []
    const notes = typeof payload?.notes === 'string' ? payload.notes : ''

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

    const params = new URLSearchParams({
      'line_items[0][price_data][currency]': 'usd',
      'line_items[0][price_data][product_data][name]': productName,
      'line_items[0][price_data][unit_amount]': String(totalCents),
      'line_items[0][quantity]': '1',
    })
    if (notes) {
      params.set('metadata[notes]', notes)
    }

    const res = await fetch('https://api.stripe.com/v1/payment_links', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    const data = await res.json().catch(() => ({})) as { url?: string; error?: { message?: string } }
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

    return new Response(
      JSON.stringify({ paymentLinkUrl: data.url }),
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
