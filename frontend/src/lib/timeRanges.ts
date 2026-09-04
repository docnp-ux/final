// Fetch `limit` is generous per preset so the window has enough rows even
// if a device reports faster than its usual ~5 min cadence; the actual
// cutoff is enforced client-side by `ms` when preparing chart data.
export const TIME_RANGES = {
  '5m': { label: '5 min', ms: 5 * 60 * 1000, limit: 50 },
  '30m': { label: '30 min', ms: 30 * 60 * 1000, limit: 100 },
  '1h': { label: '1 hour', ms: 60 * 60 * 1000, limit: 200 },
  '24h': { label: '24 hours', ms: 24 * 60 * 60 * 1000, limit: 500 },
  '7d': { label: 'Week', ms: 7 * 24 * 60 * 60 * 1000, limit: 3000 },
} as const

export type TimeRangeKey = keyof typeof TIME_RANGES
