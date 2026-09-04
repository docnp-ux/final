import { useState } from 'react'

import { Button } from '@/components/ui/button'
import LineChart from '@/components/LineChart'
import TimeRangeSelector from '@/components/TimeRangeSelector'
import { TIME_RANGES } from '@/lib/timeRanges'

import { useDeviceContext } from './deviceContext'

const LDR_OPTIONS = [
  { key: 'all', label: 'Combined (all LDRs)' },
  { key: 'tl', label: 'Top Left' },
  { key: 'tr', label: 'Top Right' },
  { key: 'bl', label: 'Bottom Left' },
  { key: 'br', label: 'Bottom Right' },
] as const

const POWER_OPTIONS = [
  { key: 'panel_power', label: 'Panel Power (W)' },
  { key: 'panel_voltage', label: 'Panel Voltage (V)' },
  { key: 'panel_current', label: 'Panel Current (A)' },
  { key: 'load_power', label: 'Load Power (W)' },
  { key: 'load_voltage', label: 'Load Voltage (V)' },
  { key: 'load_current', label: 'Load Current (A)' },
] as const

type LdrKey = (typeof LDR_OPTIONS)[number]['key']
type PowerKey = (typeof POWER_OPTIONS)[number]['key']

export default function DeviceGraphsPage() {
  const { sensors, power, timeRange, setTimeRange } = useDeviceContext()
  const [category, setCategory] = useState<'ldr' | 'power'>('ldr')
  const [ldrGraph, setLdrGraph] = useState<LdrKey>('all')
  const [powerGraph, setPowerGraph] = useState<PowerKey>('panel_power')

  const windowStart = Date.now() - TIME_RANGES[timeRange].ms

  // `sensors`/`power` come back newest-first; charts read left-to-right in time.
  const sensorChron = [...sensors]
    .filter((s) => new Date(s.timestamp).getTime() >= windowStart)
    .reverse()
  const sensorTimestamps = sensorChron.map((s) => s.timestamp)
  const ldrSeries = {
    tl: { name: 'Top Left', color: 'stroke-blue-500', values: sensorChron.map((s) => s.ldr_top_left) },
    tr: {
      name: 'Top Right',
      color: 'stroke-orange-500',
      values: sensorChron.map((s) => s.ldr_top_right),
    },
    bl: {
      name: 'Bottom Left',
      color: 'stroke-violet-500',
      values: sensorChron.map((s) => s.ldr_bottom_left),
    },
    br: {
      name: 'Bottom Right',
      color: 'stroke-pink-500',
      values: sensorChron.map((s) => s.ldr_bottom_right),
    },
  }

  // Panel and load readings are separate rows with their own timestamps
  // (two independent INA219 sensors), so each power graph gets its own
  // x-axis rather than trying to force them onto one shared timeline.
  const powerChron = [...power]
    .filter((p) => new Date(p.timestamp).getTime() >= windowStart)
    .reverse()
  const panelChron = powerChron.filter((p) => !('source' in p) || p.source === 'panel')
  const loadChron = powerChron.filter((p) => 'source' in p && p.source === 'load')
  const currentOf = (p: (typeof powerChron)[number]) => ('current' in p ? p.current : 0)

  const powerSeries: Record<
    PowerKey,
    { name: string; color: string; timestamps: string[]; values: number[] }
  > = {
    panel_power: {
      name: 'Panel Power',
      color: 'stroke-yellow-500',
      timestamps: panelChron.map((p) => p.timestamp),
      values: panelChron.map((p) => p.power),
    },
    panel_voltage: {
      name: 'Panel Voltage',
      color: 'stroke-amber-500',
      timestamps: panelChron.map((p) => p.timestamp),
      values: panelChron.map((p) => p.voltage),
    },
    panel_current: {
      name: 'Panel Current',
      color: 'stroke-orange-600',
      timestamps: panelChron.map((p) => p.timestamp),
      values: panelChron.map(currentOf),
    },
    load_power: {
      name: 'Load Power',
      color: 'stroke-red-500',
      timestamps: loadChron.map((p) => p.timestamp),
      values: loadChron.map((p) => p.power),
    },
    load_voltage: {
      name: 'Load Voltage',
      color: 'stroke-rose-500',
      timestamps: loadChron.map((p) => p.timestamp),
      values: loadChron.map((p) => p.voltage),
    },
    load_current: {
      name: 'Load Current',
      color: 'stroke-pink-600',
      timestamps: loadChron.map((p) => p.timestamp),
      values: loadChron.map(currentOf),
    },
  }

  return (
    <div className="space-y-6">
      <TimeRangeSelector value={timeRange} onChange={setTimeRange} />

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={category === 'ldr' ? 'default' : 'outline'}
          onClick={() => setCategory('ldr')}
        >
          LDR sensors
        </Button>
        <Button
          size="sm"
          variant={category === 'power' ? 'default' : 'outline'}
          onClick={() => setCategory('power')}
        >
          Power (INA219)
        </Button>
      </div>

      {category === 'ldr' && (
        <>
          <div className="flex flex-wrap gap-2">
            {LDR_OPTIONS.map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant={ldrGraph === option.key ? 'default' : 'outline'}
                onClick={() => setLdrGraph(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">
              {ldrGraph === 'all' ? 'All LDRs over time' : `${ldrSeries[ldrGraph].name} LDR over time`}
            </h2>
            <LineChart
              timestamps={sensorTimestamps}
              series={
                ldrGraph === 'all'
                  ? [ldrSeries.tl, ldrSeries.tr, ldrSeries.bl, ldrSeries.br]
                  : [ldrSeries[ldrGraph]]
              }
            />
          </section>
        </>
      )}

      {category === 'power' && (
        <>
          <div className="flex flex-wrap gap-2">
            {POWER_OPTIONS.map((option) => (
              <Button
                key={option.key}
                size="sm"
                variant={powerGraph === option.key ? 'default' : 'outline'}
                onClick={() => setPowerGraph(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <section className="space-y-2">
            <h2 className="text-lg font-semibold">{powerSeries[powerGraph].name} over time</h2>
            <LineChart
              timestamps={powerSeries[powerGraph].timestamps}
              series={[powerSeries[powerGraph]]}
            />
          </section>
        </>
      )}
    </div>
  )
}
