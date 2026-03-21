"use client";

import { AnalyticsOut, AgentTierStat } from "@/lib/api";
import { fmt } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AgentTabProps {
  analytics: AnalyticsOut;
}

const TIER_COLOR: Record<string, string> = {
  ELITE:   "text-[hsl(217,91%,65%)]",
  GOOD:    "text-profit",
  NEUTRAL: "text-muted-foreground",
  WEAK:    "text-[hsl(38,95%,55%)]",
  POOR:    "text-loss",
};

const TIER_BAR: Record<string, string> = {
  ELITE:   "bg-[hsl(217,91%,60%)]",
  GOOD:    "bg-profit",
  NEUTRAL: "bg-muted-foreground",
  WEAK:    "bg-[hsl(38,95%,55%)]",
  POOR:    "bg-loss",
};

const TIER_BG: Record<string, string> = {
  ELITE:   "bg-[hsl(217_91%_60%/0.08)] border-[hsl(217_91%_60%/0.2)]",
  GOOD:    "bg-profit/5 border-profit/20",
  NEUTRAL: "bg-secondary border-border",
  WEAK:    "bg-[hsl(38_95%_55%/0.08)] border-[hsl(38_95%_55%/0.2)]",
  POOR:    "bg-loss/5 border-loss/20",
};

function TierCard({ tier, maxCount }: { tier: AgentTierStat; maxCount: number }) {
  const barW = maxCount > 0 ? (tier.count / maxCount) * 100 : 0;
  const wrW  = tier.win_rate_pct;

  return (
    <div className={cn("rounded-xl border p-4", TIER_BG[tier.label] ?? "bg-card border-border")}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-bold tracking-wide", TIER_COLOR[tier.label])}>
            {tier.label}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono">
            score {tier.score_range}
          </span>
        </div>
        <span className="text-[11px] text-muted-foreground tabular">
          {tier.count} trade{tier.count !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Trade count bar */}
      <div className="h-1.5 rounded-full bg-border/60 overflow-hidden mb-3">
        <div
          className={cn("h-full rounded-full transition-all", TIER_BAR[tier.label] ?? "bg-foreground")}
          style={{ width: `${barW}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Win Rate</p>
          <p className={cn("text-sm font-bold tabular", tier.win_rate_pct >= 50 ? "text-profit" : "text-loss")}>
            {tier.win_rate_pct.toFixed(0)}%
          </p>
          <div className="mt-1 h-1 rounded-full bg-border/60 overflow-hidden">
            <div className={cn("h-full rounded-full", tier.win_rate_pct >= 50 ? "bg-profit" : "bg-loss")}
              style={{ width: `${wrW}%` }} />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Total P&L</p>
          <p className={cn("text-sm font-bold tabular", tier.total_pnl >= 0 ? "text-profit" : "text-loss")}>
            {fmt.dollars(tier.total_pnl)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">Avg P&L</p>
          <p className={cn("text-sm font-bold tabular", tier.avg_pnl >= 0 ? "text-profit" : "text-loss")}>
            {fmt.dollars(tier.avg_pnl)}
          </p>
        </div>
      </div>

      {/* W/L count */}
      <p className="text-[10px] text-muted-foreground mt-2 tabular">
        {tier.wins}W · {tier.count - tier.wins}L
      </p>
    </div>
  );
}

export function AgentTab({ analytics }: AgentTabProps) {
  const { agent } = analytics;
  const { tiers } = agent;
  const maxCount = tiers.length ? Math.max(...tiers.map((t) => t.count)) : 1;

  const scoreDiff = agent.avg_score_winners - agent.avg_score_losers;

  return (
    <div className="flex flex-col gap-3">

      {/* Score summary */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Score Quality</p>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-secondary/60 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Winners</p>
            <p className="text-lg font-bold text-profit tabular">
              {agent.avg_score_winners >= 0 ? "+" : ""}{agent.avg_score_winners.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">avg score</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Losers</p>
            <p className="text-lg font-bold text-loss tabular">
              {agent.avg_score_losers >= 0 ? "+" : ""}{agent.avg_score_losers.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">avg score</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-3 text-center">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Edge</p>
            <p className={cn("text-lg font-bold tabular", scoreDiff >= 0 ? "text-profit" : "text-loss")}>
              {scoreDiff >= 0 ? "+" : ""}{scoreDiff.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">W minus L</p>
          </div>
        </div>
      </div>

      {/* Continuation vs Reversal */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Continuation vs Reversal</p>
        <div className="flex flex-col gap-3">
          {[
            { label: "Continuation", wr: agent.continuation_win_rate_pct, count: agent.continuation_count, color: "bg-[hsl(217,91%,60%)]" },
            { label: "Reversal",     wr: agent.reversal_win_rate_pct,     count: agent.reversal_count,     color: "bg-profit" },
          ].map(({ label, wr, count, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs tabular text-foreground font-semibold">
                  {wr.toFixed(0)}% WR · {count} trades
                </span>
              </div>
              <div className="h-2 rounded-full bg-border overflow-hidden">
                <div className={cn("h-full rounded-full", color)} style={{ width: `${wr}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Per-tier breakdown */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2 px-0.5">
          Performance by Agent Tier
        </p>
        {tiers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No agent data available.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {tiers.map((tier) => (
              <TierCard key={tier.label} tier={tier} maxCount={maxCount} />
            ))}
          </div>
        )}
      </div>

      {/* Size multiplier distribution */}
      {agent.mult_buckets.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Size Multiplier Distribution</p>
          <div className="flex flex-col gap-2">
            {agent.mult_buckets.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground w-12 flex-shrink-0">{b.label}</span>
                <div className="flex-1 h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full rounded-full bg-[hsl(217,91%,60%)]" style={{ width: `${b.pct}%` }} />
                </div>
                <span className="text-xs tabular text-foreground w-8 text-right">{b.count}</span>
                <span className="text-[10px] text-muted-foreground w-10 text-right">{b.pct.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
