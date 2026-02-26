/**
 * Inquiry Attachments - Supabase Edge Function
 * Upload attachment files to Supabase Storage and link to inquiry.
 * POST: multipart/form-data with file + inquiry_id
 * Required: Authorization Bearer token, user must own inquiry or be concierge
 * Storage bucket: inquiry-attachments (create via Dashboard or storage API)
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 100)
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
        JSON.stringify({ error: 'Unauthorized' }),
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
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const contentType = req.headers.get('Content-Type') ?? ''
    if (!contentType.includes('multipart/form-data')) {
      return new Response(
        JSON.stringify({ error: 'Content-Type must be multipart/form-data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const inquiryId = (formData.get('inquiry_id') as string) ?? ''

    if (!file || !(file instanceof File)) {
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!inquiryId) {
      return new Response(
        JSON.stringify({ error: 'inquiry_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return new Response(
        JSON.stringify({ error: `File size must be under ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const mimeType = file.type || 'application/octet-stream'
    if (!ALLOWED_TYPES.includes(mimeType) && !mimeType.startsWith('image/')) {
      return new Response(
        JSON.stringify({ error: 'File type not allowed. Use images, PDF, or DOC/DOCX.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: inquiry } = await supabaseAdmin
      .from('inquiries')
      .select('id, guest_id')
      .eq('id', inquiryId)
      .single()

    if (!inquiry) {
      return new Response(
        JSON.stringify({ error: 'Inquiry not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const isConcierge = (profile as { role?: string })?.role === 'concierge'
    const isOwner = inquiry.guest_id === user.id

    if (!isOwner && !isConcierge) {
      return new Response(
        JSON.stringify({ error: 'Access denied' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ext = file.name.split('.').pop() ?? 'bin'
    const safeName = sanitizeFilename(file.name.replace(/\.[^.]+$/, '')) || 'file'
    const storagePath = `${inquiryId}/${crypto.randomUUID()}-${safeName}.${ext}`

    const arrayBuffer = await file.arrayBuffer()
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('inquiry-attachments')
      .upload(storagePath, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      })

    if (uploadError) {
      const bucketExists = uploadError.message?.includes('Bucket not found')
      if (bucketExists) {
        return new Response(
          JSON.stringify({
            error: 'Storage not configured. Create bucket "inquiry-attachments" in Supabase Dashboard.',
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      return new Response(
        JSON.stringify({ error: uploadError.message ?? 'Upload failed' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: publicUrl } = supabaseAdmin.storage
      .from('inquiry-attachments')
      .getPublicUrl(storagePath)

    const { data: attachment, error: insertError } = await supabaseAdmin
      .from('inquiry_attachments')
      .insert({
        inquiry_id: inquiryId,
        filename: file.name,
        mime_type: mimeType,
        size: file.size,
        storage_path: uploadData?.path ?? storagePath,
        storage_url: publicUrl?.publicUrl ?? null,
      })
      .select()
      .single()

    if (insertError) {
      await supabaseAdmin.storage.from('inquiry-attachments').remove([storagePath])
      return new Response(
        JSON.stringify({ error: insertError.message ?? 'Failed to save attachment metadata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        id: attachment?.id,
        filename: attachment?.filename,
        mime_type: attachment?.mime_type,
        size: attachment?.size,
        storage_url: attachment?.storage_url,
        uploaded_at: attachment?.uploaded_at,
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
