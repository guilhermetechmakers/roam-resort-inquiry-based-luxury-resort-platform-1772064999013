/**
 * Resend verification email - Supabase Edge Function
 * Accepts email and triggers a new signup confirmation email for unconfirmed users.
 * Uses Supabase Auth's signInWithOtp with type 'signup' to resend the confirmation.
 * Rate limited: 1 request per email per 60 seconds.
 *
 * Required: Add /verify to Supabase Auth redirect URL allow list in dashboard.
 * Deploy: supabase functions deploy resend-verification
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const RATE_LIMIT_SECONDS = 60
const RATE_LIMIT_ENDPOINT = 'resend-verification'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function isValidEmail(email: string): boolean {
  return emailRegex.test(email.trim())
}

async function checkRateLimit(
  supabaseAdmin: ReturnType<typeof createClient>,
  key: string
): Promise<boolean> {
  try {
    const cutoff = new Date(Date.now() - RATE_LIMIT_SECONDS * 1000).toISOString()
    const { data } = await supabaseAdmin
      .from('rate_limit_requests')
      .select('id')
      .eq('key', key)
      .eq('endpoint', RATE_LIMIT_ENDPOINT)
      .gte('requested_at', cutoff)
      .limit(1)
    const recent = Array.isArray(data) ? data : []
    if (recent.length > 0) return false

    await supabaseAdmin.from('rate_limit_requests').insert({
      key,
      endpoint: RATE_LIMIT_ENDPOINT,
    })
    return true
  } catch {
    return true
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email } = (await req.json()) as { email?: string }
    const trimmed = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!trimmed || !isValidEmail(trimmed)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Valid email is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Server configuration error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    const supabaseAdmin = serviceRoleKey
      ? createClient(supabaseUrl, serviceRoleKey)
      : supabase

    if (serviceRoleKey) {
      const allowed = await checkRateLimit(supabaseAdmin, `verification:${trimmed}`)
      if (!allowed) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Please wait ${RATE_LIMIT_SECONDS} seconds before requesting another verification email.`,
          }),
          {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        )
      }
    }

    const siteUrl = Deno.env.get('SITE_URL') ?? ''
    const options: { shouldCreateUser: boolean; emailRedirectTo?: string } = {
      shouldCreateUser: false,
    }
    if (siteUrl) {
      options.emailRedirectTo = `${siteUrl.replace(/\/$/, '')}/verify`
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options,
    })

    if (error) {
      const msg = error.message ?? 'Failed to resend verification email'
      return new Response(
        JSON.stringify({
          success: false,
          error: msg.includes('signups disabled')
            ? 'Email not found or already verified'
            : msg,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verification email resent. Check your inbox.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err) {
    const msg = (err as Error)?.message ?? 'Internal server error'
    return new Response(
      JSON.stringify({ success: false, error: msg }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
