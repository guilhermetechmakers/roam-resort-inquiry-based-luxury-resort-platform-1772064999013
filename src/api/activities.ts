/**
 * Activities API - inquiry lifecycle events, internal notes.
 * Uses Supabase activities table with role-based filtering.
 */

import { supabase } from '@/lib/supabase'
import type { Activity, ActivityEventType, ActivityFilters } from '@/types'

const EVENT_TYPE_WHITELIST: string[] = [
  'inquiry_created',
  'email_sent',
  'status_changed',
  'internal_note_added',
  'payment_link_created',
  'payment_received',
  'note_updated',
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidUuid(str: string): boolean {
  return UUID_REGEX.test(str)
}

function isValidEventType(s: string): boolean {
  return EVENT_TYPE_WHITELIST.includes(s)
}

function sanitizeMetadata(meta: unknown): Record<string, unknown> {
  if (meta == null || typeof meta !== 'object') return {}
  const obj = meta as Record<string, unknown>
  const safe: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (typeof k === 'string' && k.length < 100) {
      if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean' || v === null) {
        safe[k] = v
      } else if (Array.isArray(v)) {
        safe[k] = v.filter((x) => typeof x === 'string' || typeof x === 'number')
      } else if (v && typeof v === 'object' && !Array.isArray(v)) {
        safe[k] = sanitizeMetadata(v)
      }
    }
  }
  return safe
}

export interface FetchActivitiesParams {
  inquiryId: string
  limit?: number
  offset?: number
  filters?: ActivityFilters
  /** When false (guest), internal activities are excluded server-side via RLS */
  includeInternal?: boolean
}

export interface FetchActivitiesResult {
  activities: Activity[]
  total: number
}

/** Fetch activities for an inquiry with pagination and filters */
export async function fetchActivities(params: FetchActivitiesParams): Promise<FetchActivitiesResult> {
  const { inquiryId, limit = 50, offset = 0, filters } = params

  if (!isValidUuid(inquiryId)) {
    return { activities: [], total: 0 }
  }

  try {
    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('inquiry_id', inquiryId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1)

    if (filters?.event_type?.length) {
      query = query.in('event_type', filters.event_type)
    }
    if (filters?.date_from) {
      query = query.gte('timestamp', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('timestamp', filters.date_to)
    }
    if (filters?.actor_id) {
      query = query.eq('actor_id', filters.actor_id)
    }
    if (filters?.is_internal === true) {
      query = query.eq('is_internal', true)
    } else if (filters?.is_internal === false) {
      query = query.eq('is_internal', false)
    }

    const { data, error, count } = await query

    if (error) return { activities: [], total: 0 }

    const rows = Array.isArray(data) ? data : []
    const activities: Activity[] = rows.map((row: Record<string, unknown>) => {
      const meta = (row.metadata as Record<string, unknown>) ?? {}
      const actorName =
        (row.author_name as string) ??
        (meta.author_name as string) ??
        (meta.authorName as string) ??
        undefined
      return {
        id: String(row.id ?? ''),
        inquiry_id: String(row.inquiry_id ?? ''),
        event_type: String(row.event_type ?? ''),
        actor_id: row.actor_id as string | undefined,
        actor_name: actorName,
        timestamp: String(row.timestamp ?? row.created_at ?? ''),
        metadata: meta,
        is_internal: Boolean(row.is_internal),
        created_at: String(row.created_at ?? ''),
      }
    })

    return { activities, total: count ?? activities.length }
  } catch {
    return { activities: [], total: 0 }
  }
}

export interface CreateActivityPayload {
  inquiry_id: string
  event_type: ActivityEventType | string
  actor_id?: string
  actor_name?: string
  metadata?: Record<string, unknown>
  is_internal?: boolean
}

/** Create an activity (concierge/host only for internal notes) */
export async function createActivity(payload: CreateActivityPayload): Promise<Activity | null> {
  const { inquiry_id, event_type, actor_id, actor_name, metadata, is_internal = false } = payload

  if (!isValidUuid(inquiry_id)) {
    throw new Error('Invalid inquiry ID')
  }
  if (!isValidEventType(event_type)) {
    throw new Error('Invalid event type')
  }

  const sanitized = sanitizeMetadata(metadata ?? {})

  const { data, error } = await supabase
    .from('activities')
    .insert({
      inquiry_id,
      event_type,
      actor_id: actor_id ?? null,
      author_name: actor_name ?? null,
      metadata: sanitized,
      is_internal: Boolean(is_internal),
    })
    .select()
    .single()

  if (error) throw new Error(error.message ?? 'Failed to create activity')

  return {
    id: data.id,
    inquiry_id: data.inquiry_id,
    event_type: data.event_type,
    actor_id: data.actor_id,
    actor_name: actor_name ?? undefined,
    timestamp: data.timestamp ?? data.created_at ?? '',
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
    is_internal: Boolean(data.is_internal),
    created_at: data.created_at ?? '',
  }
}

/** Create internal note as activity */
export async function createInternalNoteActivity(
  inquiryId: string,
  content: string,
  actorId: string,
  actorName?: string
): Promise<Activity | null> {
  return createActivity({
    inquiry_id: inquiryId,
    event_type: 'internal_note_added',
    actor_id: actorId,
    actor_name: actorName ?? 'Staff',
    metadata: { content: String(content).slice(0, 10000) },
    is_internal: true,
  })
}

export interface UpdateActivityPayload {
  metadata?: Record<string, unknown>
  is_internal?: boolean
}

/** Update an activity (metadata or is_internal) */
export async function updateActivity(
  activityId: string,
  payload: UpdateActivityPayload
): Promise<Activity | null> {
  if (!isValidUuid(activityId)) {
    throw new Error('Invalid activity ID')
  }

  const updates: Record<string, unknown> = {}
  if (payload.metadata !== undefined) {
    updates.metadata = sanitizeMetadata(payload.metadata)
  }
  if (payload.is_internal !== undefined) {
    updates.is_internal = Boolean(payload.is_internal)
  }

  if (Object.keys(updates).length === 0) return null

  const { data, error } = await supabase
    .from('activities')
    .update(updates)
    .eq('id', activityId)
    .select()
    .single()

  if (error) throw new Error(error.message ?? 'Failed to update activity')

  return {
    id: data.id,
    inquiry_id: data.inquiry_id,
    event_type: data.event_type,
    actor_id: data.actor_id,
    actor_name: (data as { author_name?: string }).author_name ?? undefined,
    timestamp: data.timestamp ?? data.created_at ?? '',
    metadata: (data.metadata ?? {}) as Record<string, unknown>,
    is_internal: Boolean(data.is_internal),
    created_at: data.created_at ?? '',
  }
}
