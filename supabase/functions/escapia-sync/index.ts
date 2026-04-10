/**
 * escapia-sync — Supabase Edge Function
 *
 * Handles two actions for PMC hosts:
 *   POST { action: 'save_credentials', clientId, clientSecret }
 *     → validates credentials against Escapia OAuth, then upserts into escapia_credentials
 *   POST { action: 'sync' }
 *     → reads stored credentials, fetches all units via Escapia Gateway GraphQL, upserts listings
 *
 * Auth: requires a valid Supabase user JWT (host role) in Authorization header.
 * The SUPABASE_SERVICE_ROLE_KEY is used internally to read client_secret (never exposed to client).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ESCAPIA_TOKEN_URL = 'https://api-gateway.escapia.com/token'
const ESCAPIA_GRAPHQL_URL = 'https://api-gateway.escapia.com/graphql'
const PAGE_SIZE = 20

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EscapiaImage {
  url?: string
}

interface EscapiaMediaImages {
  large?: EscapiaImage
  original?: EscapiaImage
}

interface EscapiaMedia {
  images?: EscapiaMediaImages[]
}

interface EscapiaLocation {
  displayAddress?: string
  cityName?: string
  regionName?: string
  latitude?: number
  longitude?: number
}

interface EscapiaAmenity {
  categoryName?: string
  name?: string
}

interface EscapiaAmenities {
  selectedAmenities?: EscapiaAmenity[]
}

interface EscapiaBedroom {
  type?: string
}

interface EscapiaBathroom {
  type?: string
}

interface EscapiaUnit {
  unitCode?: string
  unitRef?: string
  name?: string
  marketingHeadline?: string
  longDescription?: string
  maxOccupancy?: number
  location?: EscapiaLocation
  media?: EscapiaMedia
  amenities?: EscapiaAmenities
  bedrooms?: EscapiaBedroom[]
  bathrooms?: EscapiaBathroom[]
}

interface PageInfo {
  hasNextPage: boolean
  endCursor?: string
}

interface UnitsPage {
  pageInfo: PageInfo
  totalEdges?: number
  edges: Array<{ node: EscapiaUnit }>
}

// ---------------------------------------------------------------------------
// Escapia OAuth
// ---------------------------------------------------------------------------

async function getEscapiaToken(clientId: string, clientSecret: string): Promise<string> {
  const credentials = btoa(`${clientId}:${clientSecret}`)
  const res = await fetch(ESCAPIA_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Escapia OAuth failed (${res.status}): ${text}`)
  }

  const data = await res.json()
  const token = data?.access_token ?? data?.token
  if (!token) {
    throw new Error('No access_token in Escapia OAuth response')
  }
  return token as string
}

// ---------------------------------------------------------------------------
// Escapia GraphQL
// ---------------------------------------------------------------------------

const UNITS_QUERY = `
  query GetDistributedUnits($first: Int, $after: String) {
    myPartnerAccount {
      distributedUnits(first: $first, after: $after) {
        pageInfo {
          hasNextPage
          endCursor
        }
        totalEdges
        edges {
          node {
            unitCode
            unitRef
            name
            marketingHeadline
            longDescription
            maxOccupancy
            location {
              displayAddress
              cityName
              regionName
              latitude
              longitude
            }
            media {
              images {
                large { url }
                original { url }
              }
            }
            amenities {
              selectedAmenities {
                categoryName
                name
              }
            }
            bedrooms { type }
            bathrooms { type }
          }
        }
      }
    }
  }
`

async function fetchUnitsPage(token: string, after?: string): Promise<UnitsPage> {
  const res = await fetch(ESCAPIA_GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: UNITS_QUERY,
      variables: { first: PAGE_SIZE, after: after ?? null },
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Escapia GraphQL error (${res.status}): ${text}`)
  }

  const json = await res.json()
  if (json?.errors?.length) {
    throw new Error(`Escapia GraphQL errors: ${JSON.stringify(json.errors)}`)
  }

  const page = json?.data?.myPartnerAccount?.distributedUnits
  if (!page) {
    throw new Error('Unexpected Escapia GraphQL response shape')
  }
  return page as UnitsPage
}

async function fetchAllUnits(token: string): Promise<EscapiaUnit[]> {
  const units: EscapiaUnit[] = []
  let cursor: string | undefined
  let hasMore = true

  while (hasMore) {
    const page = await fetchUnitsPage(token, cursor)
    for (const edge of page.edges ?? []) {
      if (edge.node) units.push(edge.node)
    }
    hasMore = page.pageInfo.hasNextPage
    cursor = page.pageInfo.endCursor
  }

  return units
}

// ---------------------------------------------------------------------------
// Mapping Escapia unit → Roam Resort listing row
// ---------------------------------------------------------------------------

function generateSlug(unitCode: string, hostId: string): string {
  const base = unitCode
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  // include a short suffix from hostId to guarantee uniqueness across hosts
  return `${base}-${hostId.slice(0, 8)}`
}

function mapUnitToListing(unit: EscapiaUnit, hostId: string): Record<string, unknown> {
  const unitCode = unit.unitCode ?? unit.unitRef ?? `unit-${Date.now()}`

  const images = unit.media?.images ?? []
  const imageUrls = images
    .map((img) => img.large?.url ?? img.original?.url)
    .filter(Boolean) as string[]

  const regionParts = [unit.location?.cityName, unit.location?.regionName].filter(Boolean)
  const region = regionParts.join(', ') || null

  const amenityNames = (unit.amenities?.selectedAmenities ?? [])
    .map((a) => a.name)
    .filter(Boolean) as string[]

  const bedroomCount = unit.bedrooms?.length ?? 0
  const bathroomCount = unit.bathrooms?.length ?? 0

  return {
    title: unit.name ?? unitCode,
    slug: generateSlug(unitCode, hostId),
    subtitle: unit.marketingHeadline ?? null,
    editorial_content: unit.longDescription ?? null,
    hero_image_url: imageUrls[0] ?? null,
    gallery_urls: imageUrls,
    region,
    capacity: unit.maxOccupancy ?? null,
    amenities: amenityNames,
    experience_details_json: {
      bedrooms: bedroomCount,
      bathrooms: bathroomCount,
      guestCapacity: unit.maxOccupancy ?? 0,
    },
    external_source: 'escapia',
    external_id: unitCode,
    host_id: hostId,
    status: 'draft',
    last_synced_at: new Date().toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  try {
    // Verify caller identity via anon client (respects RLS for auth check)
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const authHeader = req.headers.get('Authorization') ?? ''
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userError,
    } = await anonClient.auth.getUser()

    if (userError || !user) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const hostId = user.id

    // Service-role client for credential reads and listing upserts
    const adminClient = createClient(supabaseUrl, serviceKey)

    const body = await req.json().catch(() => ({})) as Record<string, unknown>
    const action = body?.action as string

    // ------------------------------------------------------------------
    // Action: save_credentials
    // ------------------------------------------------------------------
    if (action === 'save_credentials') {
      const clientId = (body?.clientId as string ?? '').trim()
      const clientSecret = (body?.clientSecret as string ?? '').trim()

      if (!clientId || !clientSecret) {
        return json({ error: 'clientId and clientSecret are required' }, 400)
      }

      // Validate credentials by attempting OAuth
      let token: string
      try {
        token = await getEscapiaToken(clientId, clientSecret)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        return json({ error: 'invalid_credentials', detail: msg }, 422)
      }

      // Credentials valid — upsert into escapia_credentials
      const { error: upsertError } = await adminClient
        .from('escapia_credentials')
        .upsert(
          {
            host_id: hostId,
            client_id: clientId,
            client_secret: clientSecret,
            last_sync_status: null,
            last_sync_count: 0,
            last_sync_error: null,
          },
          { onConflict: 'host_id' }
        )

      if (upsertError) {
        return json({ error: 'Failed to save credentials', detail: upsertError.message }, 500)
      }

      // Kick off an immediate sync with the validated token
      const units = await fetchAllUnits(token)
      const rows = units.map((u) => mapUnitToListing(u, hostId))

      let syncedCount = 0
      let syncError: string | null = null

      if (rows.length > 0) {
        const { error: syncErr } = await adminClient
          .from('listings')
          .upsert(rows, { onConflict: 'host_id,external_source,external_id' })

        if (syncErr) {
          syncError = syncErr.message
        } else {
          syncedCount = rows.length
        }
      }

      await adminClient
        .from('escapia_credentials')
        .update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: syncError ? 'error' : 'success',
          last_sync_count: syncedCount,
          last_sync_error: syncError,
        })
        .eq('host_id', hostId)

      if (syncError) {
        return json({ error: 'Credentials saved but sync failed', detail: syncError }, 207)
      }

      return json({ success: true, synced: syncedCount })
    }

    // ------------------------------------------------------------------
    // Action: sync
    // ------------------------------------------------------------------
    if (action === 'sync') {
      // Read stored credentials (service role bypasses RLS column restriction)
      const { data: creds, error: credsError } = await adminClient
        .from('escapia_credentials')
        .select('client_id, client_secret')
        .eq('host_id', hostId)
        .single()

      if (credsError || !creds) {
        return json({ error: 'No Escapia credentials found. Connect your account first.' }, 404)
      }

      // Mark as syncing
      await adminClient
        .from('escapia_credentials')
        .update({ last_sync_status: 'syncing', last_sync_error: null })
        .eq('host_id', hostId)

      let token: string
      try {
        token = await getEscapiaToken(creds.client_id, creds.client_secret)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await adminClient
          .from('escapia_credentials')
          .update({ last_sync_status: 'error', last_sync_error: msg })
          .eq('host_id', hostId)
        return json({ error: 'Authentication failed', detail: msg }, 422)
      }

      let units: EscapiaUnit[]
      try {
        units = await fetchAllUnits(token)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        await adminClient
          .from('escapia_credentials')
          .update({ last_sync_status: 'error', last_sync_error: msg })
          .eq('host_id', hostId)
        return json({ error: 'Failed to fetch units from Escapia', detail: msg }, 502)
      }

      const rows = units.map((u) => mapUnitToListing(u, hostId))
      let syncedCount = 0
      let syncError: string | null = null

      if (rows.length > 0) {
        const { error: upsertErr } = await adminClient
          .from('listings')
          .upsert(rows, { onConflict: 'host_id,external_source,external_id' })

        if (upsertErr) {
          syncError = upsertErr.message
        } else {
          syncedCount = rows.length
        }
      }

      await adminClient
        .from('escapia_credentials')
        .update({
          last_synced_at: new Date().toISOString(),
          last_sync_status: syncError ? 'error' : 'success',
          last_sync_count: syncedCount,
          last_sync_error: syncError,
        })
        .eq('host_id', hostId)

      if (syncError) {
        return json({ error: 'Sync failed', detail: syncError }, 500)
      }

      return json({ success: true, synced: syncedCount })
    }

    return json({ error: `Unknown action: ${action}` }, 400)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[escapia-sync] Unhandled error:', msg)
    return json({ error: 'Internal server error', detail: msg }, 500)
  }
})
