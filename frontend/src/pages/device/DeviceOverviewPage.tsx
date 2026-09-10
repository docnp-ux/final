import { useEffect } from 'react'

import EnergyChart from '@/components/EnergyChart'
import NetEnergyChart from '@/components/NetEnergyChart'
import TimeRangeSelector from '@/components/TimeRangeSelector'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/timeRanges'

import { useDeviceContext } from './deviceContext'

const HOUR_MS = 60 * 60 * 1000

// This page charts hourly Wh rollups, so anything shorter than an hour
// can't show more detail than the current hour's bar — the sub-hour
// presets are left to the Graphs page, which plots raw readings.
const OVERVIEW_RANGES: readonly TimeRangeKey[] = ['1h', '24h', '7d']
const DEFAULT_RANGE: TimeRangeKey = '1h'

export default function DeviceOverviewPage() {
  const { power, energy, isAdmin, timeRange, setTimeRange } = useDeviceContext()

  // The range is shared with Graphs, so arriving from there can carry in a
  // preset this page doesn't offer; fall back rather than leave no button
  // looking selected.
  useEffect(() => {
    if (!OVERVIEW_RANGES.includes(timeRange)) setTimeRange(DEFAULT_RANGE)
  }, [timeRange, setTimeRange])

  // Readings are returned newest-first; regular users only ever get panel
  // readings, admins get both sources, so this finds the latest panel one.
  const latestPanel = power.find((r) => !('source' in r) || r.source === 'panel')

  // Aggregates are hourly buckets, so they can't be sliced finer than an
  // hour: a 5- or 30-minute window usually contains no hour boundary at
  // all, which left these charts empty. Keep every bucket that *overlaps*
  // the window instead of only those starting inside it.
  const windowStart = Date.now() - TIME_RANGES[timeRange].ms
  const energyInWindow = energy.filter(
    (e) => new Date(e.hour_start).getTime() + HOUR_MS > windowStart,
  )

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

      <TimeRangeSelector value={timeRange} onChange={setTimeRange} options={OVERVIEW_RANGES} />

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
