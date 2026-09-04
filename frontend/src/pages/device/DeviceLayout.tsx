import { useCallback, useEffect, useState } from 'react'
import { Outlet, useParams } from 'react-router'
import { toast } from 'sonner'

import { getDevice } from '@/api/devices'
import { listEnergyAggregates } from '@/api/energy'
import { listPowerReadings, listSensorReadings } from '@/api/measurements'
import { getLatestPosition, listServoCommands } from '@/api/servo'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/context/AuthProvider'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/timeRanges'
import type { EnergyAggregate } from '@/schemas/energy'
import type { PowerReading, PowerReadingSimple, SensorReading } from '@/schemas/measurement'
import type { ServoCommand, ServoPosition } from '@/schemas/servo'
import type { Device } from '@/schemas/device'

/**
 * Loads everything for one device (device info, power/energy/sensor data,
 * servo state) once, and hands it down to Overview/Sensors/Graphs/Manual
 * Override via Outlet context — so each sub-page stays focused on
 * rendering, not fetching. Real-time updates live on their own dedicated
 * Live page instead of polling everything here (see DeviceLivePage).
 */
export default function DeviceLayout() {
  const { deviceId } = useParams<{ deviceId: string }>()
  const id = Number(deviceId)
  const { user } = useAuth()
  const isAdmin = !!user?.is_admin

  const [device, setDevice] = useState<Device | null>(null)
  const [power, setPower] = useState<(PowerReading | PowerReadingSimple)[]>([])
  const [energy, setEnergy] = useState<EnergyAggregate[]>([])
  const [sensors, setSensors] = useState<SensorReading[]>([])
  const [commands, setCommands] = useState<ServoCommand[]>([])
  const [position, setPosition] = useState<ServoPosition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRangeKey>('1h')

  const loadAdminExtras = useCallback(async () => {
    if (!isAdmin) return
    const [sensorData, commandData, positionData] = await Promise.all([
      listSensorReadings(id, TIME_RANGES[timeRange].limit),
      listServoCommands(id),
      getLatestPosition(id),
    ])
    setSensors(sensorData)
    setCommands(commandData)
    setPosition(positionData)
  }, [id, isAdmin, timeRange])

  const loadAll = useCallback(async () => {
    try {
      const limit = TIME_RANGES[timeRange].limit
      const [deviceData, powerData, energyData] = await Promise.all([
        getDevice(id),
        listPowerReadings(id, limit),
        listEnergyAggregates(id, limit),
      ])
      setDevice(deviceData)
      setPower(powerData)
      setEnergy(energyData)
      await loadAdminExtras()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load device')
    } finally {
      setIsLoading(false)
    }
  }, [id, timeRange, loadAdminExtras])

  // Switching devices shows the spinner (avoids a flash of the previous
  // device's data); switching the time range on the same device just
  // refetches quietly in place.
  useEffect(() => {
    setIsLoading(true)
  }, [id])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner className="h-6 w-6" />
      </div>
    )
  }

  if (!device) {
    return <p className="text-muted-foreground">Device not found.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{device.name}</h1>
        <p className="text-sm text-muted-foreground">
          {device.is_active ? 'Active' : 'Inactive'} · last seen{' '}
          {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'never'}
        </p>
      </div>

      <Outlet
        context={{
          id,
          device,
          isAdmin,
          power,
          energy,
          sensors,
          commands,
          position,
          timeRange,
          setTimeRange,
          reloadAdminExtras: loadAdminExtras,
        }}
      />
    </div>
  )
}
