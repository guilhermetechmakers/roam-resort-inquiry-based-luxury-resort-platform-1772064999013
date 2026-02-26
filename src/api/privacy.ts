/**
 * Privacy API - policy content, data export, account deletion, requests.
 * Uses api from lib/api.ts. Configure VITE_API_URL to point to your backend or
 * a proxy that forwards to Supabase Edge Functions (privacy-policy, privacy-export, etc.).
 */
import { api } from '@/lib/api'
import type { PolicyContent, UserRequest } from '@/types/privacy'

/** Fetch policy content from CMS/API - returns null on failure, use static fallback */
export async function fetchPolicyContent(): Promise<PolicyContent | null> {
  try {
    const res = await api.get<PolicyContent>('/privacy-policy')
    const sections = Array.isArray(res?.sections) ? res.sections : []
    if (sections.length === 0) return null
    return {
      sections,
      lastUpdated: res?.lastUpdated,
    }
  } catch {
    return null
  }
}

/** Alias for fetchPolicyContent - used by PrivacyPolicyPage */
export async function fetchPrivacyPolicy(): Promise<PolicyContent | null> {
  return fetchPolicyContent()
}

/** Initiate data export - requires auth */
export async function requestDataExport(): Promise<{ exportId: string; status: string }> {
  const res = await api.post<{ exportId?: string; status?: string }>('/privacy/export')
  return {
    exportId: res?.exportId ?? '',
    status: res?.status ?? 'received',
  }
}

/** Initiate account deletion - requires auth */
export async function requestAccountDeletion(): Promise<{ requestId: string; status: string }> {
  const res = await api.post<{ requestId?: string; status?: string }>('/privacy/delete')
  return {
    requestId: res?.requestId ?? '',
    status: res?.status ?? 'received',
  }
}

/** Fetch user's privacy requests - requires auth */
export async function fetchPrivacyRequests(type?: 'export' | 'delete'): Promise<UserRequest[]> {
  try {
    const path = type ? `/privacy/requests?type=${type}` : '/privacy/requests'
    const res = await api.get<{ requests?: UserRequest[] }>(path)
    return Array.isArray(res?.requests) ? res.requests : []
  } catch {
    return []
  }
}
