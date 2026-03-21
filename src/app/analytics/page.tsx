"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { EmptyState } from "@/components/shared/EmptyState";
import { OverviewTab } from "@/components/analytics/OverviewTab";
import { DistributionTab } from "@/components/analytics/DistributionTab";
import { TimeTab } from "@/components/analytics/TimeTab";
import { RiskTab } from "@/components/analytics/RiskTab";
import { AgentTab } from "@/components/analytics/AgentTab";
import { BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt } from "@/lib/format";

type Tab = "overview" | "distribution" | "time" | "risk" | "agent";

const TABS: { key: Tab; label: string }[] = [
  { key: "overview",     label: "Overview" },
  { key: "distribution", label: "Distrib." },
  { key: "time",         label: "Time" },
  { key: "risk",         label: "Risk" },
  { key: "agent",        label: "Agent" },
];

export default function AnalyticsPage() {
  const result = useStore((s) => s.result);
  const [tab, setTab] = useState<Tab>("overview");

  if (!result) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-6 pb-2">
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Analytics</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">Deep Dive</p>
        </div>
        <EmptyState icon={BarChart2} title="No data yet" description="Run a backtest to see analytics." />
      </div>
    );
  }

  const { metrics, trades, analytics } = result;

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-3">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Analytics</p>
        <div className="flex items-end justify-between mt-0.5">
          <p className="text-2xl font-bold text-foreground">Deep Dive</p>
          <p className={`text-sm font-bold tabular ${metrics.total_pnl >= 0 ? "text-profit" : "text-loss"}`}>
            {fmt.dollars(metrics.total_pnl)}
          </p>
        </div>
      </div>

      {/* Sub-tab bar */}
      <div className="mx-4 mb-4 flex gap-1 bg-card border border-border rounded-xl p-1">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex-1 py-2 text-xs font-bold rounded-lg transition-colors",
              tab === key
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="px-4">
        {tab === "overview"     && <OverviewTab metrics={metrics} analytics={analytics} />}
        {tab === "distribution" && <DistributionTab analytics={analytics} />}
        {tab === "time"         && <TimeTab analytics={analytics} />}
        {tab === "risk"         && <RiskTab analytics={analytics} metrics={metrics} trades={trades} />}
        {tab === "agent"        && <AgentTab analytics={analytics} />}
      </div>
    </div>
  );
}
