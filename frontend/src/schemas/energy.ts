import type { PowerSource } from '@/schemas/measurement'

export type EnergyAggregate = {
  device_id: number
  source: PowerSource
  hour_start: string
  energy_wh: number
}
