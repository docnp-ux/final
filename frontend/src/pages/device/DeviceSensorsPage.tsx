import { useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { useDeviceContext } from './deviceContext'

type SensorFilter = 'all' | 'ldr' | 'power' | 'servo'
type PowerSourceFilter = 'total' | 'panel' | 'load'

const FILTER_LABELS: Record<SensorFilter, string> = {
  all: 'All',
  ldr: 'LDR',
  power: 'Power (INA219)',
  servo: 'Servo',
}

const POWER_SOURCE_LABELS: Record<PowerSourceFilter, string> = {
  total: 'Total',
  panel: 'Generation',
  load: 'Consumption',
}

export default function DeviceSensorsPage() {
  const { sensors, power, commands } = useDeviceContext()
  const [filter, setFilter] = useState<SensorFilter>('all')
  const [powerSource, setPowerSource] = useState<PowerSourceFilter>('total')

  const powerRows =
    powerSource === 'total'
      ? []
      : power.filter((p) => ('source' in p ? p.source : 'panel') === powerSource)

  // Panel and load are reported in lockstep (one of each per report cycle),
  // so pairing them up by position — not by exact timestamp, which can
  // differ by a few milliseconds between the two POSTs — gives each cycle's
  // generated vs. consumed power. Both lists are newest-first already.
  const panelReadings = power.filter((p) => ('source' in p ? p.source : 'panel') === 'panel')
  const loadReadings = power.filter((p) => 'source' in p && p.source === 'load')
  const netRows = Array.from(
    { length: Math.min(panelReadings.length, loadReadings.length) },
    (_, i) => ({
      timestamp: panelReadings[i].timestamp,
      generated: panelReadings[i].power,
      consumed: loadReadings[i].power,
      net: panelReadings[i].power - loadReadings[i].power,
    }),
  )

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        {(['all', 'ldr', 'power', 'servo'] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={filter === option ? 'default' : 'outline'}
            onClick={() => setFilter(option)}
          >
            {FILTER_LABELS[option]}
          </Button>
        ))}
      </div>

      {(filter === 'all' || filter === 'ldr') && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Raw LDR sensor readings</h2>
          <p className="text-xs text-muted-foreground">
            Each row is one reading plus the servo's x/y position at that moment.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Top Left</TableHead>
                <TableHead>Top Right</TableHead>
                <TableHead>Bottom Left</TableHead>
                <TableHead>Bottom Right</TableHead>
                <TableHead>Vertical Diff</TableHead>
                <TableHead>Horizontal Diff</TableHead>
                <TableHead>X Angle</TableHead>
                <TableHead>Y Angle</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sensors.slice(0, 20).map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{new Date(s.timestamp).toLocaleTimeString()}</TableCell>
                  <TableCell>{s.ldr_top_left.toFixed(1)}</TableCell>
                  <TableCell>{s.ldr_top_right.toFixed(1)}</TableCell>
                  <TableCell>{s.ldr_bottom_left.toFixed(1)}</TableCell>
                  <TableCell>{s.ldr_bottom_right.toFixed(1)}</TableCell>
                  <TableCell>{s.vertical_diff.toFixed(1)}</TableCell>
                  <TableCell>{s.horizontal_diff.toFixed(1)}</TableCell>
                  <TableCell>{s.x_angle.toFixed(1)}°</TableCell>
                  <TableCell>{s.y_angle.toFixed(1)}°</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}

      {(filter === 'all' || filter === 'power') && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Raw power (INA219) readings</h2>
          <p className="text-xs text-muted-foreground">
            One row per reading from either sensor — the panel's own output and the
            tracker's own draw (servos, electronics).
          </p>

          {filter === 'power' && (
            <div className="flex gap-2">
              {(['total', 'panel', 'load'] as const).map((option) => (
                <Button
                  key={option}
                  size="sm"
                  variant={powerSource === option ? 'default' : 'outline'}
                  onClick={() => setPowerSource(option)}
                >
                  {POWER_SOURCE_LABELS[option]}
                </Button>
              ))}
            </div>
          )}

          {powerSource === 'total' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Generated</TableHead>
                  <TableHead>Consumed</TableHead>
                  <TableHead>Net (generated − consumed)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {netRows.slice(0, 20).map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{new Date(r.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell>{r.generated.toFixed(2)} W</TableCell>
                    <TableCell>{r.consumed.toFixed(2)} W</TableCell>
                    <TableCell className={r.net >= 0 ? 'text-green-600' : 'text-destructive'}>
                      {r.net >= 0 ? '+' : ''}
                      {r.net.toFixed(2)} W
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Voltage</TableHead>
                  <TableHead>Current</TableHead>
                  <TableHead>Power</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {powerRows.slice(0, 20).map((p, i) => (
                  <TableRow key={'id' in p ? p.id : i}>
                    <TableCell>{new Date(p.timestamp).toLocaleTimeString()}</TableCell>
                    <TableCell className="capitalize">
                      {'source' in p ? p.source : 'panel'}
                    </TableCell>
                    <TableCell>{p.voltage.toFixed(2)} V</TableCell>
                    <TableCell>{'current' in p ? `${p.current.toFixed(2)} A` : '—'}</TableCell>
                    <TableCell>{p.power.toFixed(2)} W</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </section>
      )}

      {(filter === 'all' || filter === 'servo') && (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Servo command history</h2>
          <p className="text-xs text-muted-foreground">
            To send a new command, use Manual Override.
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Target</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Issued</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {commands.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    x={c.target_x_angle}° y={c.target_y_angle}°
                  </TableCell>
                  <TableCell>{c.status}</TableCell>
                  <TableCell>{new Date(c.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </section>
      )}
    </div>
  )
}
