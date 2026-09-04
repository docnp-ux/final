import { useEffect, useState } from 'react'

import { listPowerReadings, listSensorReadings } from '@/api/measurements'
import { getLatestPosition } from '@/api/servo'
import type { PowerReading, PowerReadingSimple, SensorReading } from '@/schemas/measurement'
import type { ServoPosition } from '@/schemas/servo'

import { useDeviceContext } from './deviceContext'

const POLL_MS = 5000

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-md bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

/**
 * A small, self-contained widget that polls for the device's most recent
 * readings every few seconds, independent of the rest of the app — this
 * is the only page that auto-refreshes; navigating away stops the poll.
 */
export default function DeviceLivePage() {
  const { id } = useDeviceContext()

  const [sensor, setSensor] = useState<SensorReading | null>(null)
  const [panel, setPanel] = useState<PowerReading | PowerReadingSimple | null>(null)
  const [load, setLoad] = useState<PowerReading | PowerReadingSimple | null>(null)
  const [position, setPosition] = useState<ServoPosition | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const [sensors, power, positionData] = await Promise.all([
          listSensorReadings(id, 1),
          listPowerReadings(id, 10),
          getLatestPosition(id),
        ])
        if (cancelled) return
        setSensor(sensors[0] ?? null)
        setPanel(power.find((r) => !('source' in r) || r.source === 'panel') ?? null)
        setLoad(power.find((r) => 'source' in r && r.source === 'load') ?? null)
        setPosition(positionData)
        setLastUpdated(new Date())
      } catch {
        // A transient failure just means this tick is stale — the next
        // poll retries, no need to surface a toast for every blip.
      }
    }

    poll()
    const interval = setInterval(poll, POLL_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [id])

  return (
    <div className="max-w-md space-y-4 rounded-lg border border-border p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Live readings</h2>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" aria-hidden />
          {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Connecting…'}
        </span>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">LDR quadrants</p>
        <div className="grid grid-cols-2 gap-3">
          <StatTile label="Top Left" value={sensor ? sensor.ldr_top_left.toFixed(0) : '—'} />
          <StatTile label="Top Right" value={sensor ? sensor.ldr_top_right.toFixed(0) : '—'} />
          <StatTile
            label="Bottom Left"
            value={sensor ? sensor.ldr_bottom_left.toFixed(0) : '—'}
          />
          <StatTile
            label="Bottom Right"
            value={sensor ? sensor.ldr_bottom_right.toFixed(0) : '—'}
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">Power</p>
        <div className="grid grid-cols-2 gap-3">
          <StatTile
            label="Panel"
            value={panel ? `${panel.power.toFixed(1)} W` : '—'}
            sub={panel ? `${panel.voltage.toFixed(1)} V` : undefined}
          />
          <StatTile
            label="Load"
            value={load ? `${load.power.toFixed(1)} W` : '—'}
            sub={load ? `${load.voltage.toFixed(1)} V` : undefined}
          />
        </div>
      </div>

      <StatTile
        label="Servo position"
        value={position ? `x=${position.x_angle}° y=${position.y_angle}°` : '—'}
      />
    </div>
  )
}
