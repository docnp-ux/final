import { apiFetch } from '@/api/client'
import type { EnergyAggregate } from '@/schemas/energy'

export async function listEnergyAggregates(
  deviceId: number,
  limit = 100,
): Promise<EnergyAggregate[]> {
  return apiFetch<EnergyAggregate[]>(`/energy/${deviceId}?limit=${limit}`)
}
