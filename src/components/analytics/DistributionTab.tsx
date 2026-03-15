"use client";

import { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Trade } from "@/lib/api";
import { fmt } from "@/lib/format";

interface DistributionTabProps {
  trades: Trade[];
}

function buildHistogram(values: number[], bins = 12, isR = false): { label: string; count: number; midpoint: number }[] {
  const clean = values.filter((v) => isFinite(v) && !isNaN(v));
  if (clean.length === 0) return [];
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  const range = max - min || 1;
  const binWidth = range / bins;

  return Array.from({ length: bins }, (_, i) => {
    const lo = min + i * binWidth;
    const hi = lo + binWidth;
    const midpoint = (lo + hi) / 2;
    const count = clean.filter((v) => i === bins - 1 ? v >= lo && v <= hi : v >= lo && v < hi).length;
    let label: string;
    if (isR) {
      label = `${midpoint >= 0 ? "+" : ""}${midpoint.toFixed(1)}R`;
    } else {
      const abs = Math.abs(midpoint);
      label = abs >= 1000
        ? `${midpoint >= 0 ? "+" : "-"}$${(abs / 1000).toFixed(1)}k`
        : `${midpoint >= 0 ? "+" : ""}$${Math.round(midpoint)}`;
    }
    return { label, count, midpoint };
  });
}

function getR(t: Trade): number {
  return t.r_multiple;
}

function makeTooltip(formatter: (v: number) => string) {
  return function TooltipContent({ active, payload }: { active?: boolean; payload?: readonly { payload: { midpoint: number; count: number } }[] }) {
    if (!active || !payload?.[0]) return null;
    const { midpoint, count } = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="text-muted-foreground">{formatter(midpoint)}</p>
        <p className="font-bold text-foreground">{count} trade{count !== 1 ? "s" : ""}</p>
      </div>
    );
  };
}
const PnlTooltip = makeTooltip((v) => `${v >= 0 ? "+" : ""}${fmt.dollars(v)}`);
const RTooltip   = makeTooltip((v) => `${v >= 0 ? "+" : ""}${v.toFixed(2)}R`);

export function DistributionTab({ trades }: DistributionTabProps) {
  const pnlHist = useMemo(() => buildHistogram(trades.map((t) => t.pnl_dollars)), [trades]);
  const rHist   = useMemo(() => buildHistogram(trades.map(getR), 12, true), [trades]);

  const exitCounts = useMemo(() => {
    const map: Record<string, { count: number; pnl: number; wins: number }> = {};
    for (const t of trades) {
      if (!map[t.exit_reason]) map[t.exit_reason] = { count: 0, pnl: 0, wins: 0 };
      map[t.exit_reason].count++;
      map[t.exit_reason].pnl += t.pnl_dollars;
      if (t.pnl_dollars > 0) map[t.exit_reason].wins++;
    }
    return Object.entries(map)
      .map(([reason, { count, pnl, wins }]) => ({
        reason, count, pnl,
        pct: trades.length ? (count / trades.length * 100) : 0,
        wr: count > 0 ? (wins / count * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [trades]);

  return (
    <div className="flex flex-col gap-3">
      {/* P&L histogram */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">P&L Distribution</p>
        <p className="text-[11px] text-muted-foreground mb-3">Dollar result per trade — x = profit bucket, y = # trades</p>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={pnlHist} margin={{ top: 4, right: 4, left: -16, bottom: 20 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 8, fill: "rgba(160,175,200,0.6)" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<PnlTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={32}>
              {pnlHist.map((e, i) => (
                <Cell key={i} fill={e.midpoint >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* R-multiple histogram */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">R-Multiple Distribution</p>
        <p className="text-[11px] text-muted-foreground mb-3">P&L as multiples of your stop — +1R = made back exactly what you risked</p>
        <ResponsiveContainer width="100%" height={170}>
          <BarChart data={rHist} margin={{ top: 4, right: 4, left: -16, bottom: 20 }}>
            <XAxis
              dataKey="label"
              tick={{ fontSize: 8, fill: "rgba(160,175,200,0.6)" }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              angle={-40}
              textAnchor="end"
              interval={0}
            />
            <YAxis tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip content={<RTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={32}>
              {rHist.map((e, i) => (
                <Cell key={i} fill={e.midpoint >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Exit reasons */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Exit Reasons</p>
        {exitCounts.map(({ reason, count, pct, pnl, wr }) => (
          <div key={reason} className="py-2.5 border-b border-border last:border-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{reason}</span>
                <span className="text-[10px] text-muted-foreground">{count} · {fmt.pctAbs(pct)}</span>
              </div>
              <span className={`text-sm font-bold tabular ${pnl >= 0 ? "text-profit" : "text-loss"}`}>
                {fmt.dollars(pnl)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-profit" style={{ width: `${wr}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-12 text-right tabular">{fmt.pctAbs(wr)} WR</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
