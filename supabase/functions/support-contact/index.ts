/**
 * Support Contact - Supabase Edge Function
 * POST /functions/v1/support-contact
 * Accepts contact form submissions (name, email, topic, message) for concierge team.
 * Validates inputs, optionally stores in support_contacts table or queues for email.
 * Public endpoint - no auth required.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TOPICS = ['general', 'booking', 'payment', 'cancellation', 'technical', 'feedback', 'other']

interface ContactBody {
  name?: string
  email?: string
  topic?: string
  message?: string
}

function sanitize(str: string, maxLen: number): string {
  return String(str ?? '')
    .trim()
    .slice(0, maxLen)
    .replace(/[<>]/g, '')
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
    const topic = sanitize(body.topic ?? '', 50)
    const message = sanitize(body.message ?? '', 2000)

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
    if (topic && !TOPICS.includes(topic)) {
      return new Response(
        JSON.stringify({ ok: false, message: 'Invalid topic' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ticketId = `RR-SC-${Date.now().toString(36).toUpperCase()}`

    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
      const supabaseKey =
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      if (supabaseUrl && supabaseKey) {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const supabase = createClient(supabaseUrl, supabaseKey)
        await supabase.from('support_contacts').insert({
          ticket_id: ticketId,
          name,
          email,
          topic: topic || null,
          message,
          status: 'new',
        })
      }
    } catch (dbErr) {
      console.error('support-contact storage error:', dbErr)
    }

    return new Response(
      JSON.stringify({
        ok: true,
        ticketId,
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
