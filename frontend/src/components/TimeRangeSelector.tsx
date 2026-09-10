import { Button } from '@/components/ui/button'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/timeRanges'

/**
 * `options` narrows the presets on offer — pages showing hourly rollups
 * pass only the hourly-and-up ones, since a shorter window can't slice an
 * hourly bucket any finer. Defaults to every preset.
 */
function TimeRangeSelector({
  value,
  onChange,
  options = Object.keys(TIME_RANGES) as TimeRangeKey[],
}: {
  value: TimeRangeKey
  onChange: (key: TimeRangeKey) => void
  options?: readonly TimeRangeKey[]
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-muted-foreground">Time range:</span>
      {options.map((key) => (
        <Button
          key={key}
          size="sm"
          variant={value === key ? 'default' : 'outline'}
          onClick={() => onChange(key)}
        >
          {TIME_RANGES[key].label}
        </Button>
      ))}
    </div>
  )
}

export default TimeRangeSelector
