import { useOutletContext } from 'react-router'

import type { Device } from '@/schemas/device'
import type { TimeRangeKey } from '@/lib/timeRanges'
import type { EnergyAggregate } from '@/schemas/energy'
import type { PowerReading, PowerReadingSimple, SensorReading } from '@/schemas/measurement'
import type { ServoCommand, ServoPosition } from '@/schemas/servo'

export type DeviceOutletContext = {
  id: number
  device: Device
  isAdmin: boolean
  power: (PowerReading | PowerReadingSimple)[]
  energy: EnergyAggregate[]
  sensors: SensorReading[]
  commands: ServoCommand[]
  position: ServoPosition | null
  timeRange: TimeRangeKey
  setTimeRange: (key: TimeRangeKey) => void
  reloadAdminExtras: () => void
}

export function useDeviceContext() {
  return useOutletContext<DeviceOutletContext>()
}
