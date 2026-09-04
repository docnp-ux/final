import { Button } from '@/components/ui/button'
import { TIME_RANGES, type TimeRangeKey } from '@/lib/timeRanges'

function TimeRangeSelector({
  value,
  onChange,
}: {
  value: TimeRangeKey
  onChange: (key: TimeRangeKey) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-1 text-sm text-muted-foreground">Time range:</span>
      {(Object.keys(TIME_RANGES) as TimeRangeKey[]).map((key) => (
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
