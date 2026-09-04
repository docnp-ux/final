export type SensorReading = {
  id: number
  device_id: number
  timestamp: string
  ldr_top_left: number
  ldr_top_right: number
  ldr_bottom_left: number
  ldr_bottom_right: number
  avg_top: number
  avg_bottom: number
  avg_left: number
  avg_right: number
  vertical_diff: number
  horizontal_diff: number
  x_angle: number
  y_angle: number
}

export type PowerSource = 'panel' | 'load'

/** Full detail — what admins receive, both panel and load sources. */
export type PowerReading = {
  id: number
  device_id: number
  timestamp: string
  source: PowerSource
  voltage: number
  current: number
  power: number
}

/** Simplified — what regular users receive, panel-only. */
export type PowerReadingSimple = {
  timestamp: string
  voltage: number
  power: number
}
