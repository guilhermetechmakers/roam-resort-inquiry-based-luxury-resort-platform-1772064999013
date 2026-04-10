/**
 * Escapia Integration API
 *
 * Handles saving/removing credentials and triggering syncs via the
 * escapia-sync Edge Function, plus reading sync status from the DB.
 *
 * Security note: client_secret is NEVER selected from the DB by this module.
 */

import { supabase } from '@/lib/supabase'

const EDGE_FUNCTION = 'escapia-sync'

export interface EscapiaSyncStatus {
  id: string
  host_id: string
  /** Masked client ID — shows the connected account identifier (not secret) */
  client_id: string
  last_synced_at: string | null
  last_sync_status: 'success' | 'error' | 'syncing' | null
  last_sync_count: number
  last_sync_error: string | null
  created_at: string
  updated_at: string
}

/**
 * Validate credentials against Escapia, store them, and run an initial sync.
 * Throws on auth failure or network error.
 */
export async function saveEscapiaCredentials(
  clientId: string,
  clientSecret: string
): Promise<{ synced: number }> {
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION, {
    body: { action: 'save_credentials', clientId, clientSecret },
  })

  if (error) {
    throw new Error(error.message ?? 'Failed to connect Escapia account')
  }

  const response = data as { error?: string; detail?: string; synced?: number }
  if (response?.error) {
    throw new Error(response.detail ?? response.error)
  }

  return { synced: response?.synced ?? 0 }
}

/**
 * Trigger a sync using stored credentials.
 * Throws if no credentials found or sync fails.
 */
export async function triggerEscapiaSync(): Promise<{ synced: number }> {
  const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION, {
    body: { action: 'sync' },
  })

  if (error) {
    throw new Error(error.message ?? 'Sync failed')
  }

  const response = data as { error?: string; detail?: string; synced?: number }
  if (response?.error) {
    throw new Error(response.detail ?? response.error)
  }

  return { synced: response?.synced ?? 0 }
}

/**
 * Fetch sync status for the current host.
 * Deliberately does NOT select client_secret.
 */
export async function fetchEscapiaSyncStatus(): Promise<EscapiaSyncStatus | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user?.id) return null

  const { data, error } = await supabase
    .from('escapia_credentials')
    .select(
      'id, host_id, client_id, last_synced_at, last_sync_status, last_sync_count, last_sync_error, created_at, updated_at'
    )
    .eq('host_id', session.user.id)
    .maybeSingle()

  if (error) {
    console.error('[escapia] fetchSyncStatus error:', error.message)
    return null
  }

  return (data as EscapiaSyncStatus) ?? null
}

/**
 * Remove stored Escapia credentials for the current host.
 * Imported listings remain but will no longer be re-synced.
 */
export async function removeEscapiaCredentials(): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user?.id) return

  const { error } = await supabase
    .from('escapia_credentials')
    .delete()
    .eq('host_id', session.user.id)

  if (error) {
    throw new Error(error.message ?? 'Failed to disconnect Escapia')
  }
}
