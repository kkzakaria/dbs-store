interface OrdersChartProps {
  data: { date: string; count: number }[];
}

export function OrdersChart({ data }: OrdersChartProps) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const H = 80;
  const W = 240;
  const barW = Math.floor(W / data.length) - 4;

  return (
    <div className="rounded-lg border bg-background p-6">
      <p className="mb-4 text-sm font-medium text-muted-foreground">
        Commandes — 7 derniers jours
      </p>
      <svg
        width={W}
        height={H}
        className="w-full overflow-visible"
        viewBox={`0 0 ${W} ${H}`}
      >
        {data.map((d, i) => {
          const barH = Math.max(2, Math.round((d.count / max) * H));
          const x = i * (W / data.length) + 2;
          const y = H - barH;
          return (
            <g key={d.date}>
              <rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                className="fill-primary opacity-80"
                rx={2}
              >
                <title>{`${d.date}: ${d.count}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{data[0]?.date.slice(5)}</span>
        <span>{data[data.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}
