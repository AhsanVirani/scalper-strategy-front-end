"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/shared/EmptyState";
import { TradeBadge } from "@/components/shared/TradeBadge";
import { fmt } from "@/lib/format";
import { List, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/api";

type Filter = "all" | "winners" | "losers" | "long" | "short";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",     label: "All" },
  { key: "winners", label: "Winners" },
  { key: "losers",  label: "Losers" },
  { key: "long",    label: "Long" },
  { key: "short",   label: "Short" },
];

function groupByDate(trades: Trade[]): [string, Trade[]][] {
  const map = new Map<string, Trade[]>();
  for (const t of [...trades].reverse()) {
    const key = fmt.dateGroup(t.entry_time);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(t);
  }
  return Array.from(map.entries());
}

export default function TradesPage() {
  const result = useStore((s) => s.result);
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    if (!result) return [];
    return result.trades.filter((t) => {
      if (filter === "winners") return t.pnl_dollars > 0;
      if (filter === "losers")  return t.pnl_dollars < 0;
      if (filter === "long")    return t.direction.toUpperCase() === "LONG";
      if (filter === "short")   return t.direction.toUpperCase() === "SHORT";
      return true;
    });
  }, [result, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-6 pb-2">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Trades</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">Trade Log</p>
        </div>
        <EmptyState icon={List} title="No trades yet" description="Run a backtest to see your trade log." />
      </div>
    );
  }

  const totalPnl = filtered.reduce((s, t) => s + t.pnl_dollars, 0);
  const winners  = filtered.filter((t) => t.pnl_dollars > 0).length;

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Trades</p>
        <div className="flex items-end justify-between mt-0.5">
          <p className="text-2xl font-bold text-foreground">Trade Log</p>
          <div className="text-right">
            <p className={`text-sm font-bold tabular ${totalPnl >= 0 ? "text-profit" : "text-loss"}`}>
              {fmt.dollars(totalPnl)}
            </p>
            <p className="text-[11px] text-muted-foreground">{filtered.length} trades · {winners} wins</p>
          </div>
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 px-4 mb-4 overflow-x-auto scrollbar-none">
        {FILTERS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={cn(
              "flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors",
              filter === key
                ? "bg-foreground text-background"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Trade groups */}
      <div className="flex flex-col gap-4 px-4">
        {grouped.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">No trades match this filter.</p>
        )}
        {grouped.map(([date, trades]) => {
          const dayPnl = trades.reduce((s, t) => s + t.pnl_dollars, 0);
          return (
            <div key={date}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{date}</p>
                <p className={`text-[11px] font-bold tabular ${dayPnl >= 0 ? "text-profit" : "text-loss"}`}>
                  {fmt.dollars(dayPnl)}
                </p>
              </div>
              <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
                {trades.map((t, i) => <TradeCard key={i} trade={t} />)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TradeCard({ trade: t }: { trade: Trade }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex flex-col gap-1.5">
          <TradeBadge direction={t.direction} exitReason={t.exit_reason} />
          <p className="text-[11px] text-muted-foreground tabular">
            {fmt.time(t.entry_time)} → {fmt.time(t.exit_time)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <p className={`text-sm font-bold tabular ${t.pnl_dollars >= 0 ? "text-profit" : "text-loss"}`}>
              {fmt.dollars(t.pnl_dollars)}
            </p>
            <p className={`text-[11px] font-semibold tabular ${t.r_multiple >= 0 ? "text-profit" : "text-loss"}`}>
              {fmt.r(t.r_multiple)}
            </p>
          </div>
          {expanded
            ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" />
            : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
        </div>
      </div>

      {expanded && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-4 pb-4 border-t border-border pt-3 bg-secondary/50">
          <PriceRow label="Entry"       value={t.entry_price.toFixed(2)} />
          <PriceRow label="Exit"        value={t.exit_price.toFixed(2)} />
          <PriceRow label="Stop Loss"   value={t.stop_loss.toFixed(2)} />
          <PriceRow label="Take Profit" value={t.take_profit.toFixed(2)} />
          <PriceRow label="Size"        value={`${t.size} contract${t.size !== 1 ? "s" : ""}`} />
          <PriceRow label="Points"      value={`${t.pnl_points >= 0 ? "+" : ""}${t.pnl_points.toFixed(2)}`} />
        </div>
      )}
    </button>
  );
}

function PriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-xs font-semibold tabular">{value}</span>
    </div>
  );
}
