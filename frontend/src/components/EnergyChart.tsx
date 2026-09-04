import { evenlySpacedIndexes } from '@/lib/chartTicks'
import type { EnergyAggregate } from '@/schemas/energy'

const MARGIN = { top: 10, right: 10, bottom: 36, left: 50 }
const WIDTH = 640
const HEIGHT = 220
const X_TICK_COUNT = 6

function barColor(source: EnergyAggregate['source']) {
  return source === 'load' ? 'fill-red-500' : 'fill-green-500'
}

/** Simple hourly Wh bar chart, with axis titles and tick labels. Plain SVG — no charting library needed. */
function EnergyChart({ data }: { data: EnergyAggregate[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No energy data yet.</p>
  }

  const sorted = [...data].sort(
    (a, b) => new Date(a.hour_start).getTime() - new Date(b.hour_start).getTime(),
  )
  const max = Math.max(...sorted.map((d) => d.energy_wh), 1)
  const hasBothSources = sorted.some((d) => d.source === 'panel') && sorted.some((d) => d.source === 'load')

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom
  const barWidth = plotWidth / sorted.length

  const yTicks = [0, max * 0.25, max * 0.5, max * 0.75, max]
  const xTickIndexes = evenlySpacedIndexes(sorted.length - 1, Math.min(X_TICK_COUNT, sorted.length))
  const spansMultipleDays =
    new Date(sorted[0].hour_start).toDateString() !==
    new Date(sorted[sorted.length - 1].hour_start).toDateString()

  return (
    <div className="space-y-1">
      {hasBothSources && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-green-500" /> Generation
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Consumption
          </span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        role="img"
        aria-label="Hourly energy, watt-hours over time"
      >
        {/* Y axis title */}
        <text
          x={14}
          y={MARGIN.top + plotHeight / 2}
          textAnchor="middle"
          transform={`rotate(-90, 14, ${MARGIN.top + plotHeight / 2})`}
          className="fill-muted-foreground text-[10px]"
        >
          Energy (Wh)
        </text>

        {/* X axis title */}
        <text
          x={MARGIN.left + plotWidth / 2}
          y={HEIGHT - 6}
          textAnchor="middle"
          className="fill-muted-foreground text-[10px]"
        >
          Time
        </text>

        {/* Y axis ticks + gridlines */}
        {yTicks.map((tick) => {
          const y = MARGIN.top + plotHeight - (tick / max) * plotHeight
          return (
            <g key={tick}>
              <line
                x1={MARGIN.left}
                x2={WIDTH - MARGIN.right}
                y1={y}
                y2={y}
                className="stroke-border"
                strokeWidth={1}
              />
              <text
                x={MARGIN.left - 6}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                className="fill-muted-foreground text-[9px]"
              >
                {tick.toFixed(1)}
              </text>
            </g>
          )
        })}

        {/* X axis gridlines */}
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

        {/* Bars */}
        {sorted.map((point, i) => {
          const barHeight = (point.energy_wh / max) * plotHeight
          return (
            <rect
              key={point.hour_start + point.source}
              x={MARGIN.left + i * barWidth + 1}
              y={MARGIN.top + plotHeight - barHeight}
              width={Math.max(barWidth - 2, 1)}
              height={barHeight}
              className={barColor(point.source)}
            >
              <title>
                {new Date(point.hour_start).toLocaleString()} ({point.source}):{' '}
                {point.energy_wh.toFixed(2)} Wh
              </title>
            </rect>
          )
        })}

        {/* X axis tick labels (time) */}
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

export default EnergyChart
