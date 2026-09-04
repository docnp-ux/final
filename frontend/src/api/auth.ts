import { apiFetch, API_URL } from '@/api/client'
import type { LoginFields, LoginResponse, RegisterFields, User } from '@/schemas/auth'

export async function login({ username, password }: LoginFields): Promise<LoginResponse> {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)

  const res = await fetch(API_URL + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  })

  if (!res.ok) {
    let detail = 'Login failed'
    try {
      const data = await res.json()
      if (typeof data?.detail === 'string') detail = data.detail
    } catch (error) {
      console.error('Error parsing login response', error)
    }
    throw new Error(detail)
  }
  return await res.json()
}

export async function register(fields: RegisterFields): Promise<User> {
  return apiFetch<User>('/users/register', {
    method: 'POST',
    body: JSON.stringify(fields),
  })
}

export async function me(): Promise<User> {
  return apiFetch<User>('/users/me')
}

export async function listUsers(): Promise<User[]> {
  return apiFetch<User[]>('/users')
}
