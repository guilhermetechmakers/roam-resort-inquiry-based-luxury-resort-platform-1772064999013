const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

export interface ApiError {
  message: string
  code?: string
  details?: unknown
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

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getAuthHeaders()
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...options.headers },
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const err: ApiError = {
      message: (data as { message?: string })?.message ?? res.statusText,
      code: (data as { code?: string })?.code,
      details: data,
    }
    throw err
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
    const err: ApiError = {
      message: (data as { message?: string })?.message ?? res.statusText,
      code: (data as { code?: string })?.code,
      details: data,
    }
    throw err
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
