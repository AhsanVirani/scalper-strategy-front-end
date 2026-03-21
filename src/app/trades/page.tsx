"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/shared/EmptyState";
import { TradeBadge } from "@/components/shared/TradeBadge";
import { TradeChart } from "@/components/charts/TradeChart";
import { fmt } from "@/lib/format";
import { List, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────

type Filter  = "all" | "winners" | "losers" | "long" | "short";
type Grouping = "day" | "week" | "month";

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all",     label: "All" },
  { key: "winners", label: "Winners" },
  { key: "losers",  label: "Losers" },
  { key: "long",    label: "Long" },
  { key: "short",   label: "Short" },
];

const GROUPINGS: { key: Grouping; label: string }[] = [
  { key: "day",   label: "Day" },
  { key: "week",  label: "Week" },
  { key: "month", label: "Month" },
];

// ── Grouping helpers ──────────────────────────────────────────────────────────

function toET(iso: string): Date {
  // Parse as UTC then shift to ET for display-safe date math
  return new Date(new Date(iso).toLocaleString("en-US", { timeZone: "America/New_York" }));
}

function groupKey(iso: string, grouping: Grouping): string {
  const d = toET(iso);
  if (grouping === "day") {
    return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  if (grouping === "month") {
    return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  // week: key = Monday's date
  const day = d.getDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diff);
  return `Week of ${mon.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

function groupTrades(trades: Trade[], grouping: Grouping): [string, Trade[]][] {
  const map = new Map<string, Trade[]>();
  // Iterate newest-first so groups are newest-first
  for (const t of trades.slice().reverse()) {
    const k = groupKey(t.entry_time, grouping);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(t);
  }
  return Array.from(map.entries());
}

// ── Badges ────────────────────────────────────────────────────────────────────

function AgentScoreBadge({ score }: { score: number }) {
  if (score >= 2) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[hsl(217_91%_60%/0.15)] text-[hsl(217,91%,60%)] border border-[hsl(217_91%_60%/0.25)]">
      {score > 0 ? "+" : ""}{score} {score >= 3 ? "ELITE" : "GOOD"}
    </span>
  );
  if (score <= -2) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-loss/10 text-loss border border-loss/20">
      {score} {score <= -3 ? "POOR" : "WEAK"}
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary text-muted-foreground border border-border">
      {score > 0 ? "+" : ""}{score} NEUTRAL
    </span>
  );
}

function ContinuationBadge({ isContinuation }: { isContinuation: boolean }) {
  return isContinuation ? (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-[hsl(217_91%_60%/0.1)] text-[hsl(217,91%,60%)] border border-[hsl(217_91%_60%/0.2)]">CONT</span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-secondary text-muted-foreground border border-border">REV</span>
  );
}

// ── Group summary header ──────────────────────────────────────────────────────

function GroupHeader({
  label, trades, expanded, onToggle, grouping,
}: {
  label: string;
  trades: Trade[];
  expanded: boolean;
  onToggle: () => void;
  grouping: Grouping;
}) {
  const pnl     = trades.reduce((s, t) => s + t.pnl_dollars, 0);
  const wins    = trades.filter((t) => t.pnl_dollars > 0).length;
  const wr      = trades.length > 0 ? Math.round((wins / trades.length) * 100) : 0;
  const avgR    = trades.length > 0
    ? trades.reduce((s, t) => s + t.r_multiple, 0) / trades.length
    : 0;

  return (
    <button onClick={onToggle} className="w-full text-left">
      <div className="flex items-center justify-between py-2.5 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            "flex-shrink-0 transition-transform duration-150",
            expanded ? "rotate-0" : "-rotate-90"
          )}>
            <ChevronDown size={13} className="text-muted-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground truncate">
              {label}
            </p>
            {grouping !== "day" && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {trades.length} trade{trades.length !== 1 ? "s" : ""} · {wins}W {trades.length - wins}L · {wr}% WR · avg {avgR >= 0 ? "+" : ""}{avgR.toFixed(2)}R
              </p>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <p className={cn("text-sm font-bold tabular", pnl >= 0 ? "text-profit" : "text-loss")}>
            {fmt.dollars(pnl)}
          </p>
          {grouping === "day" && (
            <p className="text-[10px] text-muted-foreground">
              {trades.length}t · {wins}W · {wr}% WR
            </p>
          )}
        </div>
      </div>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TradesPage() {
  const result   = useStore((s) => s.result);
  const [filter,   setFilter]   = useState<Filter>("all");
  const [grouping, setGrouping] = useState<Grouping>("day");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

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

  const grouped = useMemo(() => groupTrades(filtered, grouping), [filtered, grouping]);

  // Reset collapsed when grouping changes
  function handleGrouping(g: Grouping) {
    setGrouping(g);
    setCollapsed(new Set());
  }

  function toggleGroup(key: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-6 pb-2 md:px-8">
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
    <div className="flex flex-col pb-8 px-4 md:px-8">
      {/* Header */}
      <div className="pt-6 pb-3">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Trades</p>
        <div className="flex items-end justify-between mt-0.5">
          <p className="text-2xl font-bold text-foreground">Trade Log</p>
          <div className="text-right">
            <p className={cn("text-sm font-bold tabular", totalPnl >= 0 ? "text-profit" : "text-loss")}>
              {fmt.dollars(totalPnl)}
            </p>
            <p className="text-[11px] text-muted-foreground">{filtered.length} trades · {winners} wins</p>
          </div>
        </div>
      </div>

      {/* Controls row: filter pills + grouping toggle */}
      <div className="flex items-center gap-2 mb-4">
        {/* Filter pills */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none flex-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                filter === key
                  ? "bg-foreground text-background"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Grouping toggle */}
        <div className="flex-shrink-0 flex gap-0 bg-card border border-border rounded-lg p-0.5">
          {GROUPINGS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => handleGrouping(key)}
              className={cn(
                "px-3 py-1 text-xs font-semibold rounded-md transition-colors",
                grouping === key
                  ? "bg-secondary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="flex flex-col gap-3">
        {grouped.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-10">No trades match this filter.</p>
        )}
        {grouped.map(([key, trades]) => {
          const isExpanded = !collapsed.has(key);
          return (
            <div key={key} className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-3 border-b border-border bg-secondary/30">
                <GroupHeader
                  label={key}
                  trades={trades}
                  expanded={isExpanded}
                  onToggle={() => toggleGroup(key)}
                  grouping={grouping}
                />
              </div>
              {isExpanded && (
                <div className="flex flex-col divide-y divide-border">
                  {trades.map((t, i) => <TradeCard key={i} trade={t} />)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Trade card ────────────────────────────────────────────────────────────────

function TradeCard({ trade: t }: { trade: Trade }) {
  const [expanded, setExpanded] = useState(false);

  const hasAgent = t.agent_score !== undefined && t.agent_score !== null;
  const hasCont  = t.is_continuation !== undefined && t.is_continuation !== null;

  const slDistance  = Math.abs(t.entry_price - t.initial_stop_loss);
  const tpDistance  = Math.abs(t.initial_take_profit - t.entry_price);
  const exitDistance = Math.abs(t.exit_price - t.entry_price);
  const maxRange    = Math.max(slDistance, tpDistance) || 1;
  const exitPct     = Math.min((exitDistance / maxRange) * 100, 100);
  const isWin       = t.pnl_dollars >= 0;

  return (
    <div className="w-full">
      <button onClick={() => setExpanded(!expanded)} className="w-full text-left">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <TradeBadge direction={t.direction} exitReason={t.exit_reason} />
              {hasCont && <ContinuationBadge isContinuation={t.is_continuation} />}
              {hasAgent && <AgentScoreBadge score={t.agent_score} />}
            </div>
            <p className="text-[11px] text-muted-foreground tabular">
              {fmt.dateTime(t.entry_time)} → {fmt.time(t.exit_time)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className={cn("text-sm font-bold tabular", t.pnl_dollars >= 0 ? "text-profit" : "text-loss")}>
                {fmt.dollars(t.pnl_dollars)}
              </p>
              <p className={cn("text-[11px] font-semibold tabular", t.r_multiple >= 0 ? "text-profit" : "text-loss")}>
                {fmt.r(t.r_multiple)}
              </p>
            </div>
            {expanded
              ? <ChevronUp size={14} className="text-muted-foreground flex-shrink-0" />
              : <ChevronDown size={14} className="text-muted-foreground flex-shrink-0" />}
          </div>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border pt-3 pb-4 px-4 bg-secondary/30">
          <div className="mb-4">
            <TradeChart trade={t} />
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Price excursion</span>
              <span className="text-[10px] text-muted-foreground tabular">{exitDistance.toFixed(2)} pts</span>
            </div>
            <div className="h-1.5 rounded-full bg-border overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${exitPct}%`, backgroundColor: isWin ? "hsl(152 100% 38%)" : "hsl(4 100% 59%)" }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[9px] text-muted-foreground">0</span>
              <span className="text-[9px] text-loss">SL {slDistance.toFixed(2)}</span>
              <span className="text-[9px] text-profit">TP {tpDistance.toFixed(2)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
            <PriceRow label="Entry"       value={t.entry_price.toFixed(2)} />
            <PriceRow label="Exit"        value={t.exit_price.toFixed(2)} />
            <PriceRow label="Stop Loss"   value={t.stop_loss.toFixed(2)} />
            <PriceRow label="Take Profit" value={t.take_profit.toFixed(2)} />
            <PriceRow label="Size"        value={`${t.size} contract${t.size !== 1 ? "s" : ""}`} />
            <PriceRow label="Points"      value={`${t.pnl_points >= 0 ? "+" : ""}${t.pnl_points.toFixed(2)}`} />
          </div>

          {hasAgent && (
            <div className="flex items-center gap-3 pt-2 border-t border-border">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Agent Score</span>
                <AgentScoreBadge score={t.agent_score} />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Size Mult</span>
                <span className="text-xs font-semibold tabular text-foreground">{t.agent_mult?.toFixed(2)}x</span>
              </div>
              {hasCont && (
                <div className="flex flex-col gap-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wide">Type</span>
                  <ContinuationBadge isContinuation={t.is_continuation} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
