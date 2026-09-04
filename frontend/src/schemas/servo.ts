import { z } from 'zod'

export const servoCommandSchema = z.object({
  target_x_angle: z.number().min(0).max(180),
  target_y_angle: z.number().min(0).max(180),
})

export type ServoCommandFields = z.infer<typeof servoCommandSchema>

export type ServoCommandStatus = 'pending' | 'acknowledged' | 'done'

export type ServoCommand = {
  id: number
  device_id: number
  issued_by: number
  target_x_angle: number
  target_y_angle: number
  status: ServoCommandStatus
  created_at: string
}

export type ServoPosition = {
  id: number
  device_id: number
  timestamp: string
  x_angle: number
  y_angle: number
}
