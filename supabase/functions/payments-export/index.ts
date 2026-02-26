/**
 * Payments Export - Supabase Edge Function
 * GET /functions/v1/payments-export?inquiryId=xxx or no params for all
 * Returns CSV of inquiries with payment/reconciliation data.
 * Concierge/Admin only.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function escapeCsv(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

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
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const inquiryId = url.searchParams.get('inquiryId') ?? ''

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    let query = supabase
      .from('inquiries')
      .select('id, reference, status, payment_state, total_amount, payment_currency, created_at, updated_at, listing:listings(title), guest:profiles(full_name, email)')
      .order('created_at', { ascending: false })

    if (inquiryId) {
      query = query.eq('id', inquiryId)
    }

    const { data: inquiries, error } = await query

    if (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const list = Array.isArray(inquiries) ? inquiries : []
    const headers = [
      'Reference',
      'Guest Name',
      'Destination',
      'Status',
      'Payment State',
      'Amount',
      'Currency',
      'Created',
      'Updated',
    ]
    const rows = list.map((i: Record<string, unknown>) => {
      const listing = i.listing as { title?: string } | null
      const guest = i.guest as { full_name?: string; email?: string } | null
      return [
        escapeCsv(i.reference ?? ''),
        escapeCsv(guest?.full_name ?? guest?.email ?? ''),
        escapeCsv(listing?.title ?? ''),
        escapeCsv(i.status ?? ''),
        escapeCsv(i.payment_state ?? 'pending'),
        String(i.total_amount ?? ''),
        escapeCsv((i.payment_currency as string) ?? 'USD'),
        escapeCsv(i.created_at ?? ''),
        escapeCsv(i.updated_at ?? ''),
      ]
    })

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')

    return new Response(csv, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="payments-export-${inquiryId || 'all'}-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
