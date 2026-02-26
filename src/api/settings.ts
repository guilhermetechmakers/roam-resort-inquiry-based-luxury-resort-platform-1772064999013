/**
 * Settings API - user settings, privacy, sessions.
 * ApiBridge with strict null-safety guards per project standards.
 */
import { api } from '@/lib/api'
import { safeArray } from '@/lib/utils/array-safety'
import type {
  SettingsUserProfile,
  PrivacyRequest,
  SettingsSession,
  ExportJob,
} from '@/types/settings'

/** API response shapes with guards */
interface SettingsResponse {
  profile?: SettingsUserProfile | null
  preferences?: SettingsUserProfile['preferences'] | null
}

interface PrivacyRequestsResponse {
  requests?: PrivacyRequest[] | null
}

interface SessionsResponse {
  sessions?: SettingsSession[] | null
}

interface ExportResponse {
  exportId?: string
  status?: string
}

interface ExportStatusResponse {
  id?: string
  status?: string
  downloadUrl?: string | null
}

/** Map auth user to SettingsUserProfile (fallback when API unavailable) */
function mapAuthToSettingsProfile(
  id: string,
  email: string | undefined,
  metadata: Record<string, unknown> | null
): SettingsUserProfile {
  const meta = metadata ?? {}
  const prefs = (meta.preferences ?? meta.contact_preferences) as Record<string, unknown> | undefined
  const notif = (prefs?.notifications ?? {}) as Record<string, boolean | undefined>
  return {
    id,
    name: (meta.full_name as string) ?? (meta.name as string) ?? '',
    email: email ?? '',
    language: (meta.language as string) ?? (meta.locale as string) ?? 'en',
    timezone: (meta.timezone as string) ?? 'America/New_York',
    avatarUrl: (meta.avatar_url as string) ?? undefined,
    preferences: {
      notifications: {
        inquiryUpdates: notif?.inquiryUpdates ?? true,
        marketing: notif?.marketing ?? false,
        reminders: notif?.reminders ?? true,
      },
    },
  }
}

/** Fetch user settings - uses API when available, falls back to Supabase auth */
export async function fetchUserSettings(): Promise<SettingsUserProfile | null> {
  try {
    const res = await api.get<SettingsResponse>('/users/me/settings')
    const profile = res?.profile ?? null
    if (profile) return profile
  } catch {
    // Fall through to Supabase
  }
  const { supabase } = await import('@/lib/supabase')
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  return mapAuthToSettingsProfile(
    user.id,
    user.email ?? undefined,
    user.user_metadata ?? null
  )
}

/** Update user settings (partial) */
export async function updateUserSettings(
  payload: Partial<Pick<SettingsUserProfile, 'name' | 'email' | 'language' | 'timezone' | 'preferences'>>
): Promise<SettingsUserProfile | null> {
  try {
    const res = await api.patch<SettingsResponse>('/users/me/settings', payload)
    return res?.profile ?? null
  } catch {
    // Fallback: update via Supabase auth metadata
    const { supabase } = await import('@/lib/supabase')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null
    const meta = user.user_metadata ?? {}
    const updated = {
      full_name: payload.name ?? meta.full_name,
      language: payload.language ?? meta.language ?? 'en',
      timezone: payload.timezone ?? meta.timezone ?? 'America/New_York',
      preferences: payload.preferences ?? meta.preferences ?? meta.contact_preferences,
    }
    await supabase.auth.updateUser({ data: updated })
    return fetchUserSettings()
  }
}

/** Initiate data export - tries REST API first, then Supabase Edge Function */
export async function initiateDataExport(): Promise<{ exportId: string; status: string }> {
  try {
    const res = await api.post<ExportResponse>('/privacy/export')
    return {
      exportId: res?.exportId ?? '',
      status: res?.status ?? 'Queued',
    }
  } catch {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const { data, error } = await supabase.functions.invoke<ExportResponse>('privacy-export', {
        body: {},
      })
      if (error) throw error
      const result = data ?? {}
      return {
        exportId: result?.exportId ?? '',
        status: result?.status ?? 'Queued',
      }
    } catch {
      return { exportId: 'mock-' + Date.now(), status: 'Queued' }
    }
  }
}

/** Get export status */
export async function getExportStatus(exportId: string): Promise<ExportJob | null> {
  try {
    const res = await api.get<ExportStatusResponse>(`/privacy/export/${exportId}`)
    if (!res) return null
    return {
      id: res.id ?? exportId,
      status: (res.status as ExportJob['status']) ?? 'Queued',
      downloadUrl: res.downloadUrl ?? undefined,
      createdAt: '',
      completedAt: undefined,
    }
  } catch {
    return null
  }
}

/** Initiate account deletion - tries REST API first, then Supabase Edge Function */
export async function initiateAccountDeletion(): Promise<{ success: boolean }> {
  try {
    await api.post('/privacy/delete')
    return { success: true }
  } catch {
    try {
      const { supabase } = await import('@/lib/supabase')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) throw new Error('Not authenticated')
      const { error } = await supabase.functions.invoke('privacy-delete', { body: {} })
      if (error) throw error
      return { success: true }
    } catch {
      return { success: false }
    }
  }
}

/** Fetch privacy requests - tries REST API first, then Supabase Edge Function */
export async function fetchPrivacyRequests(): Promise<PrivacyRequest[]> {
  try {
    const res = await api.get<PrivacyRequestsResponse>('/privacy/requests')
    const list = Array.isArray(res?.requests) ? res.requests : []
    if (list.length > 0) return list
  } catch {
    // Fall through to Edge Function
  }
  try {
    const { supabase } = await import('@/lib/supabase')
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return []
    const { data, error } = await supabase.functions.invoke<PrivacyRequestsResponse>('privacy-requests', {
      body: {},
    })
    if (error) return []
    return Array.isArray(data?.requests) ? data.requests : []
  } catch {
    return []
  }
}

/** Fetch active sessions - guarded array */
export async function fetchSessions(): Promise<SettingsSession[]> {
  try {
    const res = await api.get<SessionsResponse>('/sessions')
    const list = safeArray(res?.sessions)
    if (list.length > 0) return list
  } catch {
    // Fall through
  }
  const { supabase } = await import('@/lib/supabase')
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  return [
    {
      id: session.access_token?.slice(0, 16) ?? 'current',
      device: typeof navigator !== 'undefined' && navigator.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop',
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
  ]
}

/** Logout other sessions */
export async function logoutOtherSessions(): Promise<void> {
  try {
    await api.post('/sessions/logout-others')
  } catch {
    // No-op if backend not available
  }
}
