"use client";

import { Metrics, AnalyticsOut } from "@/lib/api";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
  metrics: Metrics;
  analytics: AnalyticsOut;
}

function Row({ label, value, positive }: { label: string; value: string; positive?: boolean | null }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(
        "text-sm font-semibold tabular",
        positive === true  && "text-profit",
        positive === false && "text-loss",
      )}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{title}</p>
      {children}
    </div>
  );
}


export function OverviewTab({ metrics: m, analytics: a }: OverviewTabProps) {
  const winPct = m.total_trades > 0 ? (m.winning_trades / m.total_trades) * 100 : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Win/loss visual bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-profit text-sm font-bold">{m.winning_trades}W</span>
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {fmt.pctAbs(m.win_rate_pct)} Win Rate
          </span>
          <span className="text-loss text-sm font-bold">{m.losing_trades}L</span>
        </div>
        <div className="h-2 rounded-full bg-loss/10 overflow-hidden">
          <div className="h-full rounded-full bg-profit" style={{ width: `${winPct}%` }} />
        </div>
      </div>

      <Section title="P&L">
        <Row label="Total P&L"     value={fmt.dollars(m.total_pnl)}     positive={m.total_pnl >= 0} />
        <Row label="Total Return"  value={fmt.pct(m.total_return_pct)}   positive={m.total_return_pct >= 0} />
        <Row label="Gross Profit"  value={fmt.dollars(m.gross_profit)}   positive={true} />
        <Row label="Gross Loss"    value={fmt.dollars(m.gross_loss)}     positive={false} />
        <Row label="Profit Factor" value={fmt.num(m.profit_factor)}      positive={m.profit_factor >= 1} />
      </Section>

      <Section title="Averages">
        <Row label="Avg Win"      value={fmt.dollars(m.avg_win)}        positive={true} />
        <Row label="Avg Loss"     value={fmt.dollars(m.avg_loss)}       positive={false} />
        <Row label="Avg Trade"    value={fmt.dollars(m.avg_trade)}      positive={m.avg_trade >= 0} />
        <Row label="Largest Win"  value={fmt.dollars(a.largest_win)}    positive={true} />
        <Row label="Largest Loss" value={fmt.dollars(a.largest_loss)}   positive={false} />
        <Row label="Avg Win (R)"  value={fmt.r(a.avg_win_r)}            positive={true} />
        <Row label="Avg Loss (R)" value={fmt.r(a.avg_loss_r)}           positive={false} />
      </Section>

      <Section title="Risk">
        <Row label="Sharpe Ratio"    value={fmt.num(m.sharpe_ratio)}              positive={null} />
        <Row label="Max Drawdown"    value={`-${fmt.pctAbs(m.max_drawdown_pct)}`} positive={false} />
        <Row label="Max DD ($)"      value={fmt.dollars(m.max_drawdown_dollars)}  positive={false} />
        <Row label="Recovery Factor" value={fmt.num(a.recovery_factor)}           positive={a.recovery_factor >= 1} />
        <Row label="Win Streak"      value={String(a.max_consec_wins)}            positive={true} />
        <Row label="Loss Streak"     value={String(a.max_consec_losses)}          positive={false} />
      </Section>

      <Section title="Trades">
        <Row label="Total"      value={String(m.total_trades)}                              positive={null} />
        <Row label="Winners"    value={`${m.winning_trades} (${fmt.pctAbs(m.win_rate_pct)})`} positive={true} />
        <Row label="Losers"     value={`${m.losing_trades} (${fmt.pctAbs(100 - m.win_rate_pct)})`} positive={false} />
        <Row label="Expectancy" value={fmt.dollars(m.avg_trade)}                            positive={m.avg_trade >= 0} />
      </Section>

    </div>
  );
}
