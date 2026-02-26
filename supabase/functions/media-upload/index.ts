/**
 * Media Upload - Supabase Edge Function
 * POST /functions/v1/media-upload
 * Uploads image to Cloudinary, stores metadata in media_assets, creates relation.
 * Required: CLOUDINARY_* secrets, auth token.
 * Body: FormData with file, type, owner_type, owner_id, alt_text?, caption?
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

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

  const cloudName = Deno.env.get('CLOUDINARY_CLOUD_NAME')
  const apiKey = Deno.env.get('CLOUDINARY_API_KEY')
  const apiSecret = Deno.env.get('CLOUDINARY_API_SECRET')
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

  if (!cloudName || !apiKey || !apiSecret) {
    return new Response(
      JSON.stringify({ error: 'Cloudinary not configured' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (!supabaseUrl || !supabaseKey) {
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const type = (formData.get('type') as string) || 'listing_gallery'
    const ownerType = (formData.get('owner_type') as string) || 'listing'
    const ownerId = (formData.get('owner_id') as string) || ''
    const altText = formData.get('alt_text') as string | null
    const caption = formData.get('caption') as string | null

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ownerId) {
      return new Response(
        JSON.stringify({ error: 'owner_id required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ error: 'Only JPEG, PNG, and WebP images are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: 'File size must be under 20MB' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const folder = `roam-${ownerType}/${ownerId}`
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
    const auth = btoa(`${apiKey}:${apiSecret}`)

    const uploadFormData = new FormData()
    uploadFormData.append('file', file)
    uploadFormData.append('folder', folder)

    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}` },
      body: uploadFormData,
    })

    if (!uploadRes.ok) {
      const errText = await uploadRes.text()
      console.error('Cloudinary upload error:', uploadRes.status, errText)
      return new Response(
        JSON.stringify({ error: 'Upload failed', details: errText.slice(0, 200) }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const cloudResult = (await uploadRes.json()) as {
      public_id?: string
      secure_url?: string
      url?: string
      width?: number
      height?: number
      format?: string
      bytes?: number
    }

    const publicId = cloudResult.public_id ?? ''
    const secureUrl = cloudResult.secure_url ?? cloudResult.url ?? ''

    if (!publicId || !secureUrl) {
      return new Response(
        JSON.stringify({ error: 'Upload succeeded but no URL returned' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: asset, error: insertErr } = await supabase
      .from('media_assets')
      .insert({
        public_id: publicId,
        secure_url: secureUrl,
        width: cloudResult.width ?? 0,
        height: cloudResult.height ?? 0,
        format: cloudResult.format ?? 'jpg',
        bytes: cloudResult.bytes ?? 0,
        resource_type: 'image',
        type,
        owner_type: ownerType,
        owner_id: ownerId,
        caption: caption ?? null,
        alt_text: altText ?? null,
        focal_point_x: null,
        focal_point_y: null,
        transformations: {},
      })
      .select()
      .single()

    if (insertErr || !asset) {
      console.error('media_assets insert error:', insertErr)
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to save asset metadata',
          url: secureUrl,
          public_id: publicId,
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const assetId = (asset as { id: string }).id
    const { error: relErr } = await supabase.from('media_asset_relations').upsert(
      {
        media_asset_id: assetId,
        entity_type: ownerType,
        entity_id: ownerId,
        position: 0,
      },
      { onConflict: 'media_asset_id,entity_type,entity_id' }
    )

    if (relErr) {
      console.error('media_asset_relations upsert error:', relErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        asset: {
          id: assetId,
          public_id: publicId,
          secure_url: secureUrl,
          width: cloudResult.width ?? 0,
          height: cloudResult.height ?? 0,
          format: cloudResult.format ?? 'jpg',
          bytes: cloudResult.bytes ?? 0,
          resource_type: 'image',
          type,
          owner_type: ownerType,
          owner_id: ownerId,
          caption: caption ?? null,
          alt_text: altText ?? null,
          focal_point_x: null,
          focal_point_y: null,
          transformations: {},
          created_at: (asset as { created_at?: string }).created_at,
          updated_at: (asset as { updated_at?: string }).updated_at,
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('media-upload error:', err)
    return new Response(
      JSON.stringify({ success: false, error: (err as Error).message ?? 'Upload failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
