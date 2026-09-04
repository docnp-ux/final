import { getCookie } from '@/utils/cookies'

export const API_URL = import.meta.env.VITE_API_URL

/** An error response from the API, carrying the HTTP status so callers can
 * distinguish e.g. "token invalid" (401) from a transient network failure. */
export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

/** Shared fetch wrapper: attaches the JWT cookie and throws ApiError on non-2xx. */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getCookie('access_token')
  const headers: HeadersInit = {
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(API_URL + path, { ...options, headers })

  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (typeof data?.detail === 'string') detail = data.detail
      else if (typeof data?.message === 'string') detail = data.message
    } catch (error) {
      console.error('Error parsing error response', error)
    }
    throw new ApiError(detail, res.status)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
