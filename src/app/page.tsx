"use client";

import { useStore } from "@/lib/store";
import { fmt } from "@/lib/format";
import { MetricCard } from "@/components/shared/MetricCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { EquityChart } from "@/components/charts/EquityChart";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { TradeBadge } from "@/components/shared/TradeBadge";
import Link from "next/link";
import { FlaskConical, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";

export default function DashboardPage() {
  const result = useStore((s) => s.result);
  const params = useStore((s) => s.params);

  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-6 pb-2">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Dashboard</p>
          <p className="text-2xl font-bold text-foreground mt-1">LVN/FVG Scalper</p>
        </div>
        <EmptyState
          icon={FlaskConical}
          title="No backtest results"
          description="Run a backtest to see your equity curve, metrics and trade log."
        />
        <div className="px-4 pb-6 mt-auto">
          <Link
            href="/backtest"
            className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-profit text-black font-bold text-sm"
          >
            Run First Backtest <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const { metrics, equity_curve, equity_timestamps, trades } = result;
  const recentTrades = [...trades].reverse().slice(0, 5);
  const isProfit = metrics.total_pnl >= 0;

  return (
    <div className="flex flex-col gap-0 pb-6">
      {/* Header */}
      <div className="px-4 pt-6 pb-3 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Dashboard</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">LVN/FVG Scalper</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
          {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          {fmt.pct(metrics.total_return_pct)}
        </div>
      </div>

      {/* Hero equity number */}
      <div className="px-4 pb-4">
        <p className="text-4xl font-bold tabular text-foreground">
          {fmt.dollars(metrics.final_equity)}
        </p>
        <p className={`text-sm font-semibold tabular mt-1 ${isProfit ? "text-profit" : "text-loss"}`}>
          {isProfit ? "+" : ""}{fmt.dollars(metrics.total_pnl)} total P&L
        </p>
      </div>

      {/* Equity Curve */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 pt-3 pb-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Equity Curve</p>
        </div>
        <EquityChart data={equity_curve} timestamps={equity_timestamps} initialCapital={params.initial_capital} height={180} />
      </div>

      {/* Drawdown */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card overflow-hidden">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Drawdown</p>
          <span className="text-[11px] font-bold text-loss tabular">
            -{fmt.pctAbs(metrics.max_drawdown_pct)} max
          </span>
        </div>
        <DrawdownChart equityCurve={equity_curve} height={80} />
      </div>

      {/* Metrics grid */}
      <div className="px-4 mb-3 grid grid-cols-3 gap-2">
        <MetricCard label="Win Rate"  value={fmt.pctAbs(metrics.win_rate_pct)}  positive={metrics.win_rate_pct >= 50} />
        <MetricCard label="Prof. F."  value={fmt.num(metrics.profit_factor)}     positive={metrics.profit_factor >= 1} />
        <MetricCard label="Sharpe"    value={fmt.num(metrics.sharpe_ratio)}      positive={null} />
        <MetricCard label="Avg Win"   value={fmt.dollars(metrics.avg_win)}       positive={true} />
        <MetricCard label="Avg Loss"  value={fmt.dollars(metrics.avg_loss)}      positive={false} />
        <MetricCard label="Trades"    value={String(metrics.total_trades)}       positive={null} />
      </div>

      {/* Recent trades */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Trades</p>
          <Link href="/trades" className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground">
            All trades <ChevronRight size={12} />
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {recentTrades.map((t, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <div className="flex flex-col gap-1">
                <TradeBadge direction={t.direction} exitReason={t.exit_reason} />
                <p className="text-[11px] text-muted-foreground tabular">
                  {fmt.time(t.entry_time)} → {fmt.time(t.exit_time)}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold tabular ${t.pnl_dollars >= 0 ? "text-profit" : "text-loss"}`}>
                  {fmt.dollars(t.pnl_dollars)}
                </p>
                <p className={`text-[11px] font-semibold tabular ${t.r_multiple >= 0 ? "text-profit" : "text-loss"}`}>
                  {fmt.r(t.r_multiple)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
