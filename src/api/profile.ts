/**
 * Profile API - user profile, sessions, messages.
 * Uses Supabase for auth/profile; mock data for sessions/messages until backend exists.
 */
import { supabase } from '@/lib/supabase'
import type { UserProfile, Session, Message, ContactPreferences } from '@/types'

/** Map auth user + metadata to UserProfile */
export function mapAuthToProfile(
  id: string,
  email: string | undefined,
  metadata: Record<string, unknown> | null,
  emailConfirmed = false
): UserProfile {
  const meta = metadata ?? {}
  return {
    id,
    name: (meta.full_name as string) ?? (meta.name as string) ?? '',
    email: email ?? '',
    emailVerified: emailConfirmed,
    phone: (meta.phone as string) ?? undefined,
    locale: (meta.locale as string) ?? undefined,
    contactPrefs: (meta.contact_preferences ?? meta.contactPrefs) as ContactPreferences | undefined,
    lastLogin: (meta.last_sign_in_at as string) ?? undefined,
    avatarUrl: (meta.avatar_url as string) ?? undefined,
  }
}

/** Fetch current user profile from Supabase auth */
export async function fetchCurrentProfile(): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const emailConfirmed =
    !!(user as { email_confirmed_at?: string }).email_confirmed_at ||
    !!(user as { confirmed_at?: boolean }).confirmed_at

  return mapAuthToProfile(
    user.id,
    user.email ?? undefined,
    user.user_metadata ?? null,
    !!emailConfirmed
  )
}

/** Update user metadata (profile fields) */
export interface UpdateProfilePayload {
  name?: string
  phone?: string
  locale?: string
  contactPrefs?: ContactPreferences
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<UserProfile | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const meta = user.user_metadata ?? {}
  const updated = {
    full_name: payload.name ?? meta.full_name,
    phone: payload.phone ?? meta.phone,
    locale: payload.locale ?? meta.locale,
    contact_preferences: payload.contactPrefs ?? meta.contact_preferences,
  }

  const { error } = await supabase.auth.updateUser({ data: updated })
  if (error) throw error

  return fetchCurrentProfile()
}

/** Change password - verifies current password then updates */
export async function changePassword(
  email: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword,
  })
  if (signInError) throw new Error('Current password is incorrect')

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) throw error
}

const STORAGE_KEY_SESSION_ID = 'roam-session-id'

export function getStoredSessionId(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY_SESSION_ID)
  } catch {
    return null
  }
}

export function setStoredSessionId(id: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEY_SESSION_ID, id)
  } catch {
    // ignore
  }
}

/** Fetch active sessions - user_sessions table, fallback to current auth session */
export async function fetchSessions(userId: string): Promise<Session[]> {
  try {
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
    const list = Array.isArray(data) ? data : []
    const storedSessionId = getStoredSessionId()
    if (list.length > 0) {
      return list.map((s: Record<string, unknown>, idx: number) => {
        const id = String(s.id ?? '')
        const isCurrent = storedSessionId
          ? id === storedSessionId
          : list.length === 1 && idx === 0
        return {
          id,
          device: (s.device_info as string) ?? (s.device as string) ?? undefined,
          location: (s.location as string) ?? undefined,
          ip: (s.ip_address as string) ?? (s.ip as string) ?? undefined,
          lastActive: String(s.last_active_at ?? s.last_active ?? s.created_at ?? ''),
          expiresAt: s.expires_at as string | undefined,
          isCurrent,
        }
      })
    }
  } catch {
    // Fall through to auth fallback
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  return [
    {
      id: 'current',
      device: typeof navigator !== 'undefined' && navigator.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop',
      location: undefined,
      ip: undefined,
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
  ]
}

/** Terminate session - uses session-revoke Edge Function or signOut for current */
export async function terminateSession(
  _userId: string,
  sessionId: string
): Promise<void> {
  const { revokeSession } = await import('@/api/sessions')
  await revokeSession(sessionId)
}

/** Fetch messages/notifications from messages table if it exists */
export async function fetchMessages(userId: string): Promise<Message[]> {
  try {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    const list = Array.isArray(data) ? data : []
    return list.map((m: Record<string, unknown>) => ({
      id: String(m.id ?? ''),
      channel: String(m.channel ?? 'in_app'),
      content: String(m.content ?? ''),
      readAt: m.read_at as string | null | undefined,
      createdAt: String(m.created_at ?? ''),
      relatedInquiryId: m.related_inquiry_id as string | null | undefined,
    }))
  } catch {
    return []
  }
}

/** Mark message as read */
export async function markMessageRead(
  userId: string,
  messageId: string
): Promise<void> {
  try {
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('user_id', userId)
  } catch {
    // messages table may not exist
  }
}
