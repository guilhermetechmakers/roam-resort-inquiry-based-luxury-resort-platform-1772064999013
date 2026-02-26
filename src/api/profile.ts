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

/** Fetch active sessions - try user_sessions table, fallback to current auth session */
export async function fetchSessions(userId: string): Promise<Session[]> {
  try {
    const { data } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
    const list = Array.isArray(data) ? data : []
    if (list.length > 0) {
      return list.map((s: Record<string, unknown>) => ({
        id: String(s.id ?? ''),
        device: s.device as string | undefined,
        location: s.location as string | undefined,
        ip: s.ip as string | undefined,
        lastActive: String(s.last_active ?? s.created_at ?? ''),
        expiresAt: s.expires_at as string | undefined,
        isCurrent: s.is_current as boolean | undefined,
      }))
    }
  } catch {
    // Fall through to auth fallback
  }
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  return [
    {
      id: session.access_token?.slice(0, 16) ?? 'current',
      device: typeof navigator !== 'undefined' && navigator.userAgent?.includes('Mobile') ? 'Mobile' : 'Desktop',
      location: undefined,
      ip: undefined,
      lastActive: new Date().toISOString(),
      isCurrent: true,
    },
  ]
}

/** Terminate session - mock; real impl would call backend */
export async function terminateSession(
  _userId: string,
  sessionId: string
): Promise<void> {
  if (sessionId === 'current') {
    await supabase.auth.signOut()
  }
  // Other sessions would require backend
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
