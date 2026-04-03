type SparklineProps = {
  values: number[];
  className?: string;
};

function buildPoints(values: number[]) {
  if (values.length === 0) {
    return "";
  }

  if (values.length === 1) {
    return "0,18 100,18";
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 20 - ((value - min) / range) * 16 - 2;
      return `${x},${y}`;
    })
    .join(" ");
}

export function Sparkline({ values, className }: SparklineProps) {
  if (values.length === 0) {
    return <span className="text-sm text-slate-400">—</span>;
  }

  return (
    <svg
      viewBox="0 0 100 20"
      className={className ?? "h-6 w-24"}
      aria-label="Price trend"
      role="img"
    >
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={buildPoints([...values].reverse())}
      />
    </svg>
  );
}
