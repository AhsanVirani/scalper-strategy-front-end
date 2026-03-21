"use client";

import { useStore } from "@/lib/store";
import { fmt } from "@/lib/format";
import { EmptyState } from "@/components/shared/EmptyState";
import { EquityChart } from "@/components/charts/EquityChart";
import { DrawdownChart } from "@/components/charts/DrawdownChart";
import { TradeBadge } from "@/components/shared/TradeBadge";
import Link from "next/link";
import { FlaskConical, ChevronRight, TrendingUp, TrendingDown, DollarSign, BarChart2, Percent, Hash } from "lucide-react";
import type { Trade } from "@/lib/api";
import { cn } from "@/lib/utils";

function TopStatCard({
  label,
  value,
  sub,
  positive,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  positive?: boolean | null;
  icon: React.ElementType;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="w-7 h-7 rounded-md bg-secondary flex items-center justify-center">
          <Icon size={13} className="text-muted-foreground" />
        </div>
      </div>
      <p className={cn(
        "text-xl font-bold tabular",
        positive === true && "text-profit",
        positive === false && "text-loss",
        positive === null && "text-foreground",
      )}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function StreakDot({ trade }: { trade: Trade }) {
  const isWin = (trade.pnl_dollars ?? 0) > 0;
  return (
    <div
      title={`${fmt.dollars(trade.pnl_dollars)} (${fmt.r(trade.r_multiple)})`}
      style={{ opacity: isWin ? 1 : 0.8 }}
      className={cn(
        "w-4 h-4 rounded-full flex-shrink-0",
        isWin ? "bg-profit" : "bg-loss"
      )}
    />
  );
}

function AgentBadge({ score }: { score: number }) {
  if (score >= 2) {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-[hsl(217_91%_60%/0.15)] text-[hsl(217,91%,60%)] border border-[hsl(217_91%_60%/0.25)]">ELITE</span>;
  }
  if (score <= -2) {
    return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-loss/10 text-loss border border-loss/20">POOR</span>;
  }
  return <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-secondary text-muted-foreground border border-border">NEUTRAL</span>;
}

export default function DashboardPage() {
  const result = useStore((s) => s.result);
  const params = useStore((s) => s.params);

  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-6 pb-2 md:px-8">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Dashboard</p>
          <p className="text-2xl font-bold text-foreground mt-1">LVN/FVG Scalper</p>
        </div>
        <EmptyState
          icon={FlaskConical}
          title="No backtest results"
          description="Run a backtest to see your equity curve, metrics and trade log."
        />
        <div className="px-4 pb-6 mt-auto md:px-8">
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
  const recentTrades = trades.slice(-5).reverse();
  const last20 = trades.slice(-20);
  const isProfit = metrics.total_pnl >= 0;

  return (
    <div className="flex flex-col gap-0 pb-8 px-4 md:px-8 pt-6">
      {/* Header */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Dashboard</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">LVN/FVG Scalper</p>
        </div>
        <div className={`flex items-center gap-1 text-sm font-bold ${isProfit ? "text-profit" : "text-loss"}`}>
          {isProfit ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          {fmt.pct(metrics.total_return_pct)}
        </div>
      </div>

      {/* Top stats row — 4 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <TopStatCard
          label="Total P&L"
          value={fmt.dollars(metrics.total_pnl)}
          sub={`${fmt.pct(metrics.total_return_pct)} return`}
          positive={metrics.total_pnl >= 0}
          icon={DollarSign}
        />
        <TopStatCard
          label="Win Rate"
          value={fmt.pctAbs(metrics.win_rate_pct)}
          sub={`${metrics.winning_trades}W / ${metrics.losing_trades}L`}
          positive={metrics.win_rate_pct >= 50}
          icon={Percent}
        />
        <TopStatCard
          label="Profit Factor"
          value={fmt.num(metrics.profit_factor)}
          sub={`Sharpe ${fmt.num(metrics.sharpe_ratio)}`}
          positive={metrics.profit_factor >= 1}
          icon={BarChart2}
        />
        <TopStatCard
          label="Total Trades"
          value={String(metrics.total_trades)}
          sub={`${fmt.dollars(metrics.avg_trade)} avg`}
          positive={null}
          icon={Hash}
        />
      </div>

      {/* Equity chart — full width */}
      <div className="rounded-xl border border-border bg-card overflow-hidden mb-4">
        <div className="px-4 pt-3 pb-1 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Equity Curve</p>
          <p className="text-sm font-bold tabular text-foreground">{fmt.dollars(metrics.final_equity)}</p>
        </div>
        <EquityChart data={equity_curve} timestamps={equity_timestamps} initialCapital={params.initial_capital} height={180} />
      </div>

      {/* 2-col: drawdown + streak */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-4 pt-3 pb-1 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Drawdown</p>
            <span className="text-[11px] font-bold text-loss tabular">
              -{fmt.pctAbs(metrics.max_drawdown_pct)} max
            </span>
          </div>
          <DrawdownChart equityCurve={equity_curve} height={80} />
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
            Last {last20.length} Trades
          </p>
          <div className="flex flex-wrap gap-1.5">
            {last20.map((t, i) => <StreakDot key={i} trade={t} />)}
          </div>
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-profit" />
              <span className="text-[10px] text-muted-foreground">Win</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-loss opacity-80" />
              <span className="text-[10px] text-muted-foreground">Loss</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent trades */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Recent Trades</p>
          <Link href="/trades" className="flex items-center gap-0.5 text-[11px] text-muted-foreground hover:text-foreground">
            All trades <ChevronRight size={12} />
          </Link>
        </div>
        <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
          {recentTrades.map((t, i) => {
            const hasAgent = t.agent_score !== undefined && t.agent_score !== null;
            return (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <TradeBadge direction={t.direction} exitReason={t.exit_reason} />
                    {hasAgent && <AgentBadge score={t.agent_score} />}
                  </div>
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
