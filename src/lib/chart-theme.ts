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
  /** Series draw-on. Recharts defaults to 1.5s, which reads as a chart
   *  loading rather than a chart arriving - spread this onto every series. */
  motion: { animationDuration: 600, animationEasing: "ease-out" },
} as const;

/* Categorical series hues, assigned in fixed order and never cycled. Validated
   for CVD separation on a white chart surface; slots 3-5 sit under 3:1 contrast,
   so any chart using them ships visible labels (a legend or the data table). */
export const CHART_CATEGORICAL = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
] as const;
