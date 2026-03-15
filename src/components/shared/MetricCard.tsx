import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  className?: string;
}

export function MetricCard({ label, value, sub, positive, className }: MetricCardProps) {
  return (
    <div className={cn(
      "flex flex-col gap-1 rounded-xl border border-border bg-card p-3",
      className
    )}>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground leading-none">
        {label}
      </p>
      <p className={cn(
        "text-lg font-bold leading-tight tabular",
        positive === true  && "text-profit",
        positive === false && "text-loss",
        positive === null  && "text-foreground"
      )}>
        {value}
      </p>
      {sub && (
        <p className={cn(
          "text-[11px] font-semibold tabular",
          positive === true  && "text-profit",
          positive === false && "text-loss",
          positive === null  && "text-muted-foreground"
        )}>
          {sub}
        </p>
      )}
    </div>
  );
}
