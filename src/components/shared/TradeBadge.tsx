import { cn } from "@/lib/utils";

interface TradeBadgeProps {
  direction: string;
  exitReason?: string;
}

// Maps backend exit_reason values → display label + style
const EXIT_MAP: Record<string, { label: string; style: string }> = {
  take_profit:  { label: "TP",  style: "text-profit border-profit/40 bg-profit/10" },
  stop_loss:    { label: "SL",  style: "text-loss border-loss/40 bg-loss/10" },
  end_of_day:   { label: "EOD", style: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  end_of_data:  { label: "EOS", style: "text-blue-400 border-blue-500/40 bg-blue-500/10" },
  max_duration: { label: "MDX", style: "text-orange-400 border-orange-500/40 bg-orange-500/10" },
};

export function TradeBadge({ direction, exitReason }: TradeBadgeProps) {
  const isLong = direction.toUpperCase() === "LONG";
  const exitInfo = exitReason ? (EXIT_MAP[exitReason] ?? { label: exitReason.toUpperCase(), style: "text-muted-foreground border-border bg-muted/50" }) : null;

  return (
    <div className="flex items-center gap-2">
      <div className={cn(
        "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-bold border",
        isLong
          ? "text-profit border-profit/30 bg-profit/10"
          : "text-loss border-loss/30 bg-loss/10"
      )}>
        {/* Filled arrow: up for long, down for short */}
        <span style={{ fontSize: "9px", lineHeight: 1 }}>{isLong ? "▲" : "▼"}</span>
        <span>{isLong ? "LONG" : "SHORT"}</span>
      </div>
      {exitInfo && (
        <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded border", exitInfo.style)}>
          {exitInfo.label}
        </span>
      )}
    </div>
  );
}
