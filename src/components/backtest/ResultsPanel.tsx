"use client";

import { BacktestResult } from "@/lib/api";
import { fmt } from "@/lib/format";
import { MetricCard } from "@/components/shared/MetricCard";
import { EquityChart } from "@/components/charts/EquityChart";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface ResultsPanelProps {
  result: BacktestResult;
  initialCapital: number;
}

export function ResultsPanel({ result, initialCapital }: ResultsPanelProps) {
  const { metrics, equity_curve, equity_timestamps } = result;

  return (
    <div className="flex flex-col gap-3">
      {/* Equity Curve */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Equity Curve</p>
        </div>
        <EquityChart data={equity_curve} timestamps={equity_timestamps} initialCapital={initialCapital} height={160} />
      </div>

      {/* Drawdown */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Drawdown</p>
          <span className="text-[11px] font-bold text-loss tabular">-{fmt.pctAbs(metrics.max_drawdown_pct)} max</span>
        </div>
        <DrawdownChart equityCurve={equity_curve} height={70} />
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2">
        <MetricCard label="Trades"    value={String(metrics.total_trades)}       positive={null} />
        <MetricCard label="Win Rate"  value={fmt.pctAbs(metrics.win_rate_pct)}   positive={metrics.win_rate_pct >= 50} />
        <MetricCard label="Prof. F."  value={fmt.num(metrics.profit_factor)}     positive={metrics.profit_factor >= 1} />
        <MetricCard label="Net P&L"   value={fmt.dollars(metrics.total_pnl)}     positive={metrics.total_pnl >= 0} />
        <MetricCard label="Sharpe"    value={fmt.num(metrics.sharpe_ratio)}      positive={null} />
        <MetricCard label="Max DD"    value={fmt.pctAbs(metrics.max_drawdown_pct)} positive={false} />
      </div>

      {/* Full report link */}
      <Link
        href="/analytics"
        className="flex items-center justify-center gap-1.5 py-3.5 rounded-xl bg-card border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-muted-foreground transition-colors"
      >
        View Full Analytics <ChevronRight size={14} />
      </Link>
    </div>
  );
}
