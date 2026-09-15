type SparklineVariant =
  | "active-contracts"
  | "contracts-at-risk"
  | "portfolio-margin"
  | "on-time-delivery"
  | "revenue-mtd"
  | "portfolio-value";

const PATHS: Record<SparklineVariant, string> = {
  "active-contracts":  "M0,28 C8,20 16,30 28,22 C38,16 50,26 64,18",
  "contracts-at-risk": "M0,22 C8,30 18,18 28,26 C40,16 52,28 64,20",
  "portfolio-margin":  "M0,20 C8,24 18,18 30,26 C42,30 52,26 64,34",
  "on-time-delivery":  "M0,18 C10,22 20,20 32,28 C44,32 54,36 64,40",
  // Revenue builds through the month; portfolio value climbs steadily.
  "revenue-mtd":       "M0,40 C10,38 20,32 32,28 C44,22 54,18 64,12",
  "portfolio-value":   "M0,34 C10,32 20,28 32,26 C44,21 54,18 64,14",
};

interface SparklineProps {
  variant: SparklineVariant;
}

export default function Sparkline({ variant }: SparklineProps) {
  return (
    <svg width="64" height="54" viewBox="0 0 64 54" fill="none">
      <path
        d={PATHS[variant]}
        stroke="#404040"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
