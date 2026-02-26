/**
 * Suppression List API
 * Concierge role required.
 */

import { supabase } from '@/lib/supabase'
import type { SuppressionEntry } from '@/types/email'

export async function fetchSuppressions(params?: {
  search?: string
  limit?: number
}): Promise<SuppressionEntry[]> {
  let q = supabase
    .from('suppression_list')
    .select('*')
    .order('added_at', { ascending: false })

  if (params?.search?.trim()) {
    q = q.ilike('email', `%${params.search.trim()}%`)
  }
  if (params?.limit) {
    q = q.limit(params.limit)
  }

  const { data, error } = await q
  if (error) throw error
  const list = Array.isArray(data) ? data : []
  return list.map((row) => ({
    id: row.id,
    email: row.email ?? '',
    reason: row.reason ?? null,
    source: row.source ?? null,
    added_at: row.added_at ?? '',
    expires_at: row.expires_at ?? null,
  }))
}

export async function addToSuppression(email: string, reason?: string): Promise<void> {
  const { data: existing } = await supabase
    .from('suppression_list')
    .select('id')
    .ilike('email', email.trim().toLowerCase())
    .limit(1)
    .maybeSingle()

  if (existing) return

  const { error } = await supabase.from('suppression_list').insert({
    email: email.trim().toLowerCase(),
    reason: reason ?? 'Manual',
    source: 'manual',
  })
  if (error) throw error
}

export async function removeFromSuppression(id: string): Promise<void> {
  const { error } = await supabase.from('suppression_list').delete().eq('id', id)
  if (error) throw error
}
