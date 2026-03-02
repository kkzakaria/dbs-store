import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  className?: string;
}

export function StatsCard({ title, value, subtitle, className }: StatsCardProps) {
  return (
    <div className={cn("rounded-lg border bg-background p-6", className)}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-3xl font-bold tabular-nums">{value}</p>
      {subtitle ? <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p> : null}
    </div>
  );
}
