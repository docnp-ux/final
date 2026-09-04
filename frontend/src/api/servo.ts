import { apiFetch } from '@/api/client'
import type { ServoCommand, ServoCommandFields, ServoPosition } from '@/schemas/servo'

export async function issueServoCommand(
  deviceId: number,
  fields: ServoCommandFields,
): Promise<ServoCommand> {
  return apiFetch<ServoCommand>(`/servo/${deviceId}/commands`, {
    method: 'POST',
    body: JSON.stringify(fields),
  })
}

export async function listServoCommands(deviceId: number): Promise<ServoCommand[]> {
  return apiFetch<ServoCommand[]>(`/servo/${deviceId}/commands`)
}

export async function getLatestPosition(deviceId: number): Promise<ServoPosition | null> {
  return apiFetch<ServoPosition | null>(`/servo/${deviceId}/position/latest`)
}
