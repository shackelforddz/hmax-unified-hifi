/* Shared chart palette, matching the hi-fi design: a blue primary series
   against a neutral grey comparison line and axis. */
export const CHART = {
  /** Primary data series. */
  line: "#3b82f6",
  /** Area fill, applied as a gradient stop. */
  fill: "#3b82f6",
  /** Secondary / comparison series, usually dashed. */
  compare: "#a3a3a3",
  /** Reference lines and thresholds. */
  reference: "#d4d4d4",
  /** Axis labels. */
  axis: "#a3a3a3",
  /** Bars and other solid marks stay ink. */
  ink: "#171717",
  /** Multi-series ramp, darkest first - for stacked areas and phase lines. */
  ramp: ["#1d4ed8", "#3b82f6", "#60a5fa", "#93c5fd"],
  /** Threshold lines and breached marks. */
  warning: "#f59e0b",
  alert: "#fa000f",
} as const;
