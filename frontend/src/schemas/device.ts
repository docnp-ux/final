import { z } from 'zod'

export const deviceCreateSchema = z.object({
  name: z.string().min(1, { error: 'Device name is required' }).max(100),
  owner_id: z.number().optional(),
})

export type DeviceCreateFields = z.infer<typeof deviceCreateSchema>

export type Device = {
  id: number
  name: string
  is_active: boolean
  last_seen_at: string | null
  created_at: string
  owner_id: number
  owner_username: string
}

export type DeviceCreated = Device & {
  api_key: string
}
