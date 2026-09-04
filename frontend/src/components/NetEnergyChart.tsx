import { evenlySpacedIndexes } from '@/lib/chartTicks'

const MARGIN = { top: 10, right: 10, bottom: 36, left: 50 }
const WIDTH = 640
const HEIGHT = 220
const X_TICK_COUNT = 6

export type NetEnergyPoint = { hour_start: string; net_wh: number }

/**
 * Hourly net energy (generated minus consumed), one bar per hour extending
 * up from zero (surplus) or down from zero (deficit). Plain SVG, mirrors
 * EnergyChart's layout so the two look consistent side by side.
 */
function NetEnergyChart({ data }: { data: NetEnergyPoint[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No energy data yet.</p>
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.hour_start).getTime() - new Date(b.hour_start).getTime(),
  )
  const maxAbs = Math.max(...sorted.map((d) => Math.abs(d.net_wh)), 1)
  const min = -maxAbs
  const max = maxAbs
  const range = max - min

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const barWidth = plotWidth / sorted.length

  const yFor = (v: number) => MARGIN.top + plotHeight - ((v - min) / range) * plotHeight
  const yTicks = [min, min / 2, 0, max / 2, max]
  const xTickIndexes = evenlySpacedIndexes(sorted.length - 1, Math.min(X_TICK_COUNT, sorted.length))
  const spansMultipleDays =
    new Date(sorted[0].hour_start).toDateString() !==
    new Date(sorted[sorted.length - 1].hour_start).toDateString()

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Surplus (generated more than
          consumed)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Deficit (consumed more than
          generated)
        </span>
      </div>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Net hourly energy, generated minus consumed, watt-hours over time"
      >
        <text
          x={14}
          y={MARGIN.top + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 14, ${MARGIN.top + plotHeight / 2})`}
          className="fill-muted-foreground text-[10px]"
        >
          Net energy (Wh)
        </text>

        <text
          x={MARGIN.left + plotWidth / 2}
          y={HEIGHT - 6}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          Time
        </text>

        {yTicks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={WIDTH - MARGIN.right}
              y1={yFor(tick)}
              y2={yFor(tick)}
              className="stroke-border"
              strokeWidth={tick === 0 ? 1.5 : 1}
            />
            <text
              x={MARGIN.left - 6}
              y={yFor(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {tick.toFixed(1)}
            </text>
          </g>
        ))}

        {xTickIndexes.map((i) => (
          <line
            key={i}
            x1={MARGIN.left + i * barWidth + barWidth / 2}
            x2={MARGIN.left + i * barWidth + barWidth / 2}
            y1={MARGIN.top}
            y2={MARGIN.top + plotHeight}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        ))}

        {sorted.map((point, i) => {
          const y1 = yFor(Math.max(point.net_wh, 0))
          const y2 = yFor(Math.min(point.net_wh, 0))
          return (
            <rect
              key={point.hour_start}
              x={MARGIN.left + i * barWidth + 1}
              y={y1}
              width={Math.max(barWidth - 2, 1)}
              height={Math.max(y2 - y1, 1)}
              className={point.net_wh >= 0 ? 'fill-green-500' : 'fill-red-500'}
            >
              <title>
                {new Date(point.hour_start).toLocaleString()}: {point.net_wh >= 0 ? '+' : ''}
                {point.net_wh.toFixed(2)} Wh
              </title>
            </rect>
          )
        })}

        {xTickIndexes.map((i) => (
          <text
            key={i}
            x={MARGIN.left + i * barWidth + barWidth / 2}
            y={HEIGHT - MARGIN.bottom + 14}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px]"
          >
            {spansMultipleDays
              ? new Date(sorted[i].hour_start).toLocaleDateString([], {
                  month: 'numeric',
                  day: 'numeric',
                }) +
                ' ' +
                new Date(sorted[i].hour_start).toLocaleTimeString([], { hour: '2-digit' })
              : new Date(sorted[i].hour_start).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default NetEnergyChart
