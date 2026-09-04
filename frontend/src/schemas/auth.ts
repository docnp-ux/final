import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().min(1, { error: 'Username is required' }),
  password: z.string().min(1, { error: 'Password is required' }),
})

export type LoginFields = z.infer<typeof loginSchema>

export type LoginResponse = {
  access_token: string
  token_type: string
}

export const registerSchema = z.object({
  username: z.string().min(3, { error: 'Username must be at least 3 characters' }),
  password: z.string().min(8, { error: 'Password must be at least 8 characters' }),
})

export type RegisterFields = z.infer<typeof registerSchema>

export type User = {
  id: number
  username: string
  is_admin: boolean
}
