import EnergyChart from '@/components/EnergyChart'
import NetEnergyChart from '@/components/NetEnergyChart'
import TimeRangeSelector from '@/components/TimeRangeSelector'
import { TIME_RANGES } from '@/lib/timeRanges'

import { useDeviceContext } from './deviceContext'

export default function DeviceOverviewPage() {
  const { power, energy, isAdmin, timeRange, setTimeRange } = useDeviceContext()

  // Readings are returned newest-first; regular users only ever get panel
  // readings, admins get both sources, so this finds the latest panel one.
  const latestPanel = power.find((r) => !('source' in r) || r.source === 'panel')

  const windowStart = Date.now() - TIME_RANGES[timeRange].ms
  const energyInWindow = energy.filter((e) => new Date(e.hour_start).getTime() >= windowStart)

  // Panel and load aggregates share exact hour_start boundaries (both are
  // rounded to the hour server-side), so pairing by that key is reliable
  // here — unlike raw readings, which can be a few ms apart.
  const generatedByHour = new Map(
    energyInWindow.filter((e) => e.source === 'panel').map((e) => [e.hour_start, e.energy_wh]),
  )
  const consumedByHour = new Map(
    energyInWindow.filter((e) => e.source === 'load').map((e) => [e.hour_start, e.energy_wh]),
  )
  const netByHour = [...new Set([...generatedByHour.keys(), ...consumedByHour.keys()])].map(
    (hour_start) => ({
      hour_start,
      net_wh: (generatedByHour.get(hour_start) ?? 0) - (consumedByHour.get(hour_start) ?? 0),
    }),
  )

  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Panel output</h2>
        {latestPanel ? (
          <p className="text-3xl font-bold">
            {latestPanel.power.toFixed(1)} W
            <span className="ml-2 text-base font-normal text-muted-foreground">
              @ {latestPanel.voltage.toFixed(1)} V
            </span>
          </p>
        ) : (
          <p className="text-muted-foreground">No readings yet.</p>
        )}
      </section>

      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Energy generated (Wh per hour)</h2>
        <EnergyChart data={energyInWindow.filter((e) => e.source === 'panel')} />
      </section>

      {isAdmin && (
        <>
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Net energy (Wh per hour)</h2>
            <NetEnergyChart data={netByHour} />
            <p className="text-xs text-muted-foreground">
              Generated minus consumed, per hour — above zero means the panel covered the
              tracker's own draw with some to spare.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">Energy consumed (Wh per hour)</h2>
            <EnergyChart data={energyInWindow.filter((e) => e.source === 'load')} />
            <p className="text-xs text-muted-foreground">
              Tracker load: power drawn by the servos and onboard electronics.
            </p>
          </section>
        </>
      )}
    </div>
  )
}
