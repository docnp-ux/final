import { apiFetch } from '@/api/client'
import type { PowerReading, PowerReadingSimple, SensorReading } from '@/schemas/measurement'

export async function listPowerReadings(
  deviceId: number,
  limit = 100,
): Promise<(PowerReading | PowerReadingSimple)[]> {
  return apiFetch(`/measurements/power/${deviceId}?limit=${limit}`)
}

export async function listSensorReadings(
  deviceId: number,
  limit = 100,
): Promise<SensorReading[]> {
  return apiFetch<SensorReading[]>(`/measurements/sensor/${deviceId}?limit=${limit}`)
}
