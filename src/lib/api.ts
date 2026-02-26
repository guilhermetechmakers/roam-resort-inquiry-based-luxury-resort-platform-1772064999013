import { isApiErrorPayload, toUserMessage } from '@/lib/errors'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

/** Standardized API error - matches { error: { code, message, details?, status } } */
export interface ApiError {
  message: string
  code?: string
  details?: unknown
  status?: number
}

async function getAuthHeaders(): Promise<HeadersInit> {
  const { supabase } = await import('@/lib/supabase')
  const { data: { session } } = await supabase.auth.getSession()
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
  }
  return headers
}

function buildApiError(res: Response, data: unknown): ApiError {
  const status = res.status
  let message = res.statusText
  let code: string | undefined
  let details: unknown

  if (isApiErrorPayload(data)) {
    message = data.error.message
    code = data.error.code
    details = data.error.details
  } else if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    message = (obj.message as string) ?? (obj.error as Record<string, unknown>)?.message as string ?? message
    code = (obj.code as string) ?? (obj.error as Record<string, unknown>)?.code as string
    details = obj.details ?? obj.error
  }

  return {
    message: toUserMessage({ message, code, details, status }),
    code,
    details,
    status,
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders()
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  let res: Response
  try {
    res = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    })
  } catch (fetchErr) {
    const err: ApiError = {
      message: toUserMessage(fetchErr, 'Network error. Please check your connection.'),
      code: 'NETWORK_ERROR',
      status: 0,
    }
    throw err
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw buildApiError(res, data)
  }
  return data as T
}

async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const { supabase } = await import('@/lib/supabase')
  const { data: { session } } = await supabase.auth.getSession()
  const headers: HeadersInit = {}
  if (session?.access_token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.access_token}`
  }
  const API_BASE = import.meta.env.VITE_API_URL ?? '/api'
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: formData,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw buildApiError(res, data)
  }
  return data as T
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  postForm: <T>(path: string, formData: FormData) => apiUpload<T>(path, formData),
  put: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PUT', body: body ? JSON.stringify(body) : undefined }),
  patch: <T>(path: string, body?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
}
