import { ChartPoint } from "@/lib/aggregates";
import { formatDateLabel, formatNumber } from "@/lib/format";

function getNiceStep(maxValue: number, tickCount: number) {
  if (maxValue <= 0) return 1;
  const rawStep = maxValue / Math.max(tickCount - 1, 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalized = rawStep / magnitude;
  let niceNormalized = 1;
  if (normalized > 5) niceNormalized = 10;
  else if (normalized > 2) niceNormalized = 5;
  else if (normalized > 1) niceNormalized = 2;
  return niceNormalized * magnitude;
}

interface LineChartProps {
  points: ChartPoint[];
}

export function LineChart({ points }: LineChartProps) {
  if (!points.length) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-zinc-400">
        データがありません
      </div>
    );
  }

  const width = 360;
  const height = 140;
  const maxValue = Math.max(...points.map((point) => point.value));
  const axisTickCount = 4;
  const niceStep = getNiceStep(maxValue, axisTickCount);
  const axisMax = Math.max(niceStep * (axisTickCount - 1), niceStep);
  const normalizedMax = axisMax || 1;

  const pathData = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (point.value / normalizedMax) * height;
      return `${index === 0 ? "M" : "L"}${x},${y}`;
    })
    .join(" ");

  const axisTicks = Array.from({ length: axisTickCount }).map((_, index) => {
    const value = axisMax - index * niceStep;
    return {
      label: `${formatNumber(value)} 円`,
    };
  });

  return (
    <div className="flex gap-3">
      <div className="flex h-40 flex-col justify-between text-[10px] text-zinc-400">
        {axisTicks.map((tick, index) => (
          <span key={index}>{tick.label}</span>
        ))}
      </div>
      <div className="flex w-full flex-col gap-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-40 w-full">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <line x1="0" x2="0" y1="0" y2={height} stroke="#e4e4e7" strokeWidth={1} />
        {[0.25, 0.5, 0.75].map((ratio) => (
          <line
            key={ratio}
            x1="0"
            x2={width}
            y1={height * ratio}
            y2={height * ratio}
            stroke="#e4e4e7"
            strokeDasharray="4 4"
          />
        ))}
        <path
          d={pathData}
          fill="none"
          stroke="url(#lineGradient)"
          strokeWidth={4}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point, index) => {
          const x = (index / Math.max(points.length - 1, 1)) * width;
          const y = height - (point.value / normalizedMax) * height;
          return (
            <circle
              key={point.date}
              cx={x}
              cy={y}
              r={4}
              fill="#0ea5e9"
              stroke="#fff"
              strokeWidth={2}
            />
          );
        })}
      </svg>
        <div className="flex justify-between text-xs text-zinc-400">
          <span>{formatDateLabel(points[0].date)}</span>
          <span>{formatDateLabel(points[points.length - 1].date)}</span>
        </div>
      </div>
    </div>
  );
}
