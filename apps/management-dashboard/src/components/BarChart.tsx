export interface BarDatum {
  label: string;
  value: number;
  color: string;
}

// Horizontal bar list: each bar is its own row (not touching its
// neighbors), every bar carries a direct value label at its tip, so - per
// the dataviz method - axis ticks/gridlines are unneeded here (they only
// "carry values you didn't directly label"). Text stays in ink/muted
// tokens throughout; only the bar fill itself carries the series color.
export function BarChart({ data, formatValue = (v) => v.toFixed(2) }: { data: BarDatum[]; formatValue?: (v: number) => string }) {
  const max = Math.max(...data.map((d) => d.value), 0.01);
  const barHeight = 20;
  const rowGap = 18;
  const rowHeight = barHeight + rowGap;
  const labelWidth = 120;
  const chartWidth = 380;
  const width = labelWidth + chartWidth + 70;
  const height = data.length * rowHeight;

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Bar chart">
      {data.map((d, i) => {
        const barWidth = Math.max((d.value / max) * chartWidth, 2);
        const y = i * rowHeight;
        return (
          <g key={d.label}>
            <text x={labelWidth - 10} y={y + barHeight / 2 + 4} textAnchor="end" className="fill-muted text-[13px]">
              {d.label}
            </text>
            <rect x={labelWidth} y={y} width={chartWidth} height={barHeight} fill="#F5F5F4" rx={4} />
            <rect x={labelWidth} y={y} width={barWidth} height={barHeight} fill={d.color} rx={4} />
            <text x={labelWidth + barWidth + 8} y={y + barHeight / 2 + 4} className="fill-ink text-[13px] font-semibold">
              {formatValue(d.value)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
