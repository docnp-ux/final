import { evenlySpacedIndexes } from '@/lib/chartTicks'

const MARGIN = { top: 10, right: 10, bottom: 36, left: 50 }
const WIDTH = 640
const HEIGHT = 220
const X_TICK_COUNT = 6

export type LineChartSeries = {
  name: string
  color: string // tailwind stroke-* class, e.g. "stroke-blue-500"
}

/** One or more time-series lines over a shared set of timestamps. Plain SVG. */
function LineChart({
  timestamps,
  series,
}: {
  timestamps: string[] // chronological order (oldest first)
  series: (LineChartSeries & { values: number[] })[]
}) {
  if (timestamps.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>
  }

  const allValues = series.flatMap((s) => s.values)
  const min = Math.min(...allValues, 0)
  const max = Math.max(...allValues, 1)
  const range = Math.max(max - min, 1)

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const lastIndex = Math.max(timestamps.length - 1, 1)

  const xFor = (i: number) => MARGIN.left + (i / lastIndex) * plotWidth
  const yFor = (v: number) => MARGIN.top + plotHeight - ((v - min) / range) * plotHeight

  const yTicks = [min, min + range * 0.25, min + range * 0.5, min + range * 0.75, max]
  const xTickIndexes = evenlySpacedIndexes(lastIndex, Math.min(X_TICK_COUNT, timestamps.length))
  const spansMultipleDays =
    new Date(timestamps[0]).toDateString() !==
    new Date(timestamps[timestamps.length - 1]).toDateString()

  function formatTick(ts: string) {
    return spansMultipleDays
      ? new Date(ts).toLocaleDateString([], { month: 'numeric', day: 'numeric' }) +
          ' ' +
          new Date(ts).toLocaleTimeString([], { hour: '2-digit' })
      : new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="space-y-1">
      {series.length > 1 && (
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          {series.map((s) => (
            <span key={s.name} className="flex items-center gap-1.5">
              <span className={`h-2.5 w-2.5 rounded-sm ${s.color.replace('stroke-', 'bg-')}`} />
              {s.name}
            </span>
          ))}
        </div>
      )}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label={`${series.map((s) => s.name).join(', ')} over time`}
      >
        <text
          x={14}
          y={MARGIN.top + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 14, ${MARGIN.top + plotHeight / 2})`}
          className="fill-muted-foreground text-[10px]"
        >
          Reading
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
              strokeWidth={1}
            />
            <text
              x={MARGIN.left - 6}
              y={yFor(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-muted-foreground text-[9px]"
            >
              {tick.toFixed(0)}
            </text>
          </g>
        ))}

        {xTickIndexes.map((i) => (
          <line
            key={i}
            x1={xFor(i)}
            x2={xFor(i)}
            y1={MARGIN.top}
            y2={MARGIN.top + plotHeight}
            className="stroke-border"
            strokeWidth={1}
            strokeDasharray="2,2"
          />
        ))}

        {series.map((s) => (
          <polyline
            key={s.name}
            fill="none"
            className={s.color}
            strokeWidth={2}
            points={s.values.map((v, i) => `${xFor(i)},${yFor(v)}`).join(' ')}
          />
        ))}

        {xTickIndexes.map((i) => (
          <text
            key={i}
            x={xFor(i)}
            y={HEIGHT - MARGIN.bottom + 14}
            textAnchor="middle"
            className="fill-muted-foreground text-[9px]"
          >
            {formatTick(timestamps[i])}
          </text>
        ))}
      </svg>
    </div>
  )
}

export default LineChart
