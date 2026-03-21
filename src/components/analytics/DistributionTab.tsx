"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { AnalyticsOut } from "@/lib/api";
import { fmt } from "@/lib/format";

interface DistributionTabProps {
  analytics: AnalyticsOut;
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

export function DistributionTab({ analytics: a }: DistributionTabProps) {
  const pnlHist = a.pnl_histogram;
  const rHist   = a.r_histogram;

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
        {a.exit_reasons.map(({ reason, count, pct, total_pnl, win_rate_pct }) => (
          <div key={reason} className="py-2.5 border-b border-border last:border-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">{reason}</span>
                <span className="text-[10px] text-muted-foreground">{count} · {fmt.pctAbs(pct)}</span>
              </div>
              <span className={`text-sm font-bold tabular ${total_pnl >= 0 ? "text-profit" : "text-loss"}`}>
                {fmt.dollars(total_pnl)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <div className="h-full rounded-full bg-profit" style={{ width: `${win_rate_pct}%` }} />
              </div>
              <span className="text-[10px] text-muted-foreground w-12 text-right tabular">{fmt.pctAbs(win_rate_pct)} WR</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
