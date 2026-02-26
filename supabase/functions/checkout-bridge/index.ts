/**
 * Checkout Bridge - Supabase Edge Function
 * Public endpoint to fetch inquiry summary for the checkout bridge page.
 * GET /functions/v1/checkout-bridge?inquiryId=xxx
 * Returns: destination name, dates, guests, reference, paymentLinkUrl (if any).
 * No auth required - link is the secret.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const inquiryId = url.searchParams.get('inquiryId') ?? ''
    if (!inquiryId) {
      return new Response(
        JSON.stringify({ error: 'inquiryId required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey =
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .select('id, reference, check_in, check_out, guests_count, payment_link, payment_state, listing:listings(title)')
      .eq('id', inquiryId)
      .single()

    if (error || !inquiry) {
      return new Response(
        JSON.stringify({ error: 'Inquiry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const listing = inquiry?.listing
    const destinationName =
      typeof listing === 'object' && listing != null && 'title' in listing
        ? (listing.title as string) ?? 'Destination'
        : 'Destination'

    const paymentLinkUrl = inquiry.payment_link ?? null
    const payload = {
      inquiryId: inquiry.id,
      reference: inquiry.reference ?? inquiry.id,
      destinationName,
      startDate: inquiry.check_in ?? '',
      endDate: inquiry.check_out ?? '',
      guests: inquiry.guests_count ?? 0,
      paymentLinkUrl,
      paymentState: inquiry.payment_state ?? 'pending',
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
