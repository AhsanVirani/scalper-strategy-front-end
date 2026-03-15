"use client";

import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, Cell,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import type { Trade } from "@/lib/api";
import { fmt } from "@/lib/format";

interface TimeTabProps {
  trades: Trade[];
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Mon","Tue","Wed","Thu","Fri"];

function pnlByKey(trades: Trade[], getKey: (t: Trade) => string) {
  const map: Record<string, { pnl: number; count: number; wins: number }> = {};
  for (const t of trades) {
    const k = getKey(t);
    if (!map[k]) map[k] = { pnl: 0, count: 0, wins: 0 };
    map[k].pnl += t.pnl_dollars;
    map[k].count++;
    if (t.pnl_dollars > 0) map[k].wins++;
  }
  return map;
}

function BarTip({ active, payload }: { active?: boolean; payload?: readonly { payload: { label: string; pnl: number; count: number; wins: number } }[] }) {
  if (!active || !payload?.[0]) return null;
  const { label, pnl, count, wins } = payload[0].payload;
  const wr = count > 0 ? ((wins / count) * 100).toFixed(0) : "0";
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg space-y-0.5">
      <p className="font-bold text-foreground">{label}</p>
      <p className={pnl >= 0 ? "text-profit" : "text-loss"}>{fmt.dollars(pnl)}</p>
      <p className="text-muted-foreground">{count} trades · {wr}% WR</p>
    </div>
  );
}

function BubbleTip({ active, payload }: { active?: boolean; payload?: readonly { payload: { hour: string; pnl: number; absZ: number } }[] }) {
  if (!active || !payload?.[0]) return null;
  const { hour, pnl, absZ } = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg space-y-0.5">
      <p className="font-bold text-foreground">{hour} ET</p>
      <p className={pnl >= 0 ? "text-profit" : "text-loss"}>{fmt.dollars(pnl)}</p>
      <p className="text-muted-foreground">|{fmt.dollars(absZ)}|</p>
    </div>
  );
}

function DurationTip({ active, payload }: { active?: boolean; payload?: readonly { payload: { mins: number; pnl: number; label: string } }[] }) {
  if (!active || !payload?.[0]) return null;
  const { mins, pnl, label } = payload[0].payload;
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg space-y-0.5">
      <p className="font-bold text-foreground">{label}</p>
      <p className="text-muted-foreground">{mins} min hold</p>
      <p className={pnl >= 0 ? "text-profit" : "text-loss"}>{fmt.dollars(pnl)}</p>
    </div>
  );
}

function ColorBar({ data }: { data: { label: string; pnl: number; count: number; wins: number }[] }) {
  if (data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={130}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(160,175,200,0.6)" }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false} />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
        <Tooltip content={<BarTip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
        <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={40}>
          {data.map((e, i) => (
            <Cell key={i} fill={e.pnl >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.85} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TimeTab({ trades }: TimeTabProps) {
  const byHour = useMemo(() => {
    const m = pnlByKey(trades, (t) => {
      const h = new Date(t.entry_time).toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" });
      return h.padStart(2, "0") + ":00";
    });
    return Object.entries(m).sort(([a], [b]) => a.localeCompare(b)).map(([label, v]) => ({ label, ...v }));
  }, [trades]);

  const byDay = useMemo(() => {
    const m = pnlByKey(trades, (t) => DAYS[new Date(t.entry_time).getDay() - 1] ?? "?");
    return DAYS.filter((d) => m[d]).map((d) => ({ label: d, ...(m[d] ?? { pnl: 0, count: 0, wins: 0 }) }));
  }, [trades]);

  const byMonth = useMemo(() => {
    const m = pnlByKey(trades, (t) => MONTHS[new Date(t.entry_time).getMonth()]);
    return MONTHS.filter((mo) => m[mo]).map((mo) => ({ label: mo, ...m[mo] }));
  }, [trades]);

  // Bubble scatter: x = hour, y = pnl, z = |pnl| (bubble size)
  const bubbleData = useMemo(() => trades.map((t) => {
    const d = new Date(t.entry_time);
    const h = parseInt(d.toLocaleString("en-US", { hour: "numeric", hour12: false, timeZone: "America/New_York" }));
    const minStr = d.toLocaleString("en-US", { minute: "2-digit", timeZone: "America/New_York" });
    return {
      x: h + parseInt(minStr) / 60,
      y: t.pnl_dollars,
      z: Math.max(Math.abs(t.pnl_dollars), 10),
      absZ: Math.abs(t.pnl_dollars),
      pnl: t.pnl_dollars,
      hour: `${String(h).padStart(2, "0")}:${minStr}`,
    };
  }), [trades]);

  const bubbleWinners = bubbleData.filter((d) => d.pnl >= 0);
  const bubbleLosers  = bubbleData.filter((d) => d.pnl < 0);

  // Duration scatter: x = hold time (mins), y = pnl
  const durationData = useMemo(() => trades.map((t) => {
    const mins = Math.round((new Date(t.exit_time).getTime() - new Date(t.entry_time).getTime()) / 60000);
    return {
      x: Math.min(mins, 65), y: t.pnl_dollars,
      z: Math.max(Math.abs(t.pnl_dollars), 10),
      pnl: t.pnl_dollars, mins,
      label: `${t.direction.toUpperCase()} · ${t.exit_reason}`,
    };
  }), [trades]);

  const durWinners = durationData.filter((d) => d.pnl >= 0);
  const durLosers  = durationData.filter((d) => d.pnl < 0);

  return (
    <div className="flex flex-col gap-3">

      {/* Bubble scatter: profit by time of day */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Profit Scatter — Time of Day</p>
        <p className="text-[11px] text-muted-foreground mb-3">Each bubble = one trade. Bigger bubble = bigger dollar move. x = ET hour</p>
        <ResponsiveContainer width="100%" height={200}>
          <ScatterChart margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
            <XAxis
              type="number" dataKey="x" name="hour"
              domain={[9, 16]} ticks={[9,10,11,12,13,14,15,16]}
              tickFormatter={(v: number) => `${v}:00`}
              tick={{ fontSize: 9, fill: "rgba(160,175,200,0.6)" }} tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            />
            <YAxis
              type="number" dataKey="y" name="pnl"
              tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false}
              tickFormatter={(v: number) => `$${Math.round(v)}`}
            />
            <ZAxis type="number" dataKey="z" range={[20, 350]} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <Tooltip content={<BubbleTip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }} />
            <Scatter data={bubbleWinners} fill="#22c55e" fillOpacity={0.5} />
            <Scatter data={bubbleLosers}  fill="#ef4444" fillOpacity={0.5} />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex gap-4 mt-1">
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-profit inline-block" /> Profit
          </span>
          <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className="w-2 h-2 rounded-full bg-loss inline-block" /> Loss
          </span>
        </div>
      </div>

      {/* Trade duration scatter */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Trade Duration vs P&L</p>
        <p className="text-[11px] text-muted-foreground mb-3">x = hold time in minutes, y = dollar result. Trades past 60m are force-closed at market.</p>
        <ResponsiveContainer width="100%" height={185}>
          <ScatterChart margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
            <XAxis
              type="number" dataKey="x" name="mins"
              domain={[0, 65]} ticks={[0, 10, 20, 30, 40, 50, 60]}
              tick={{ fontSize: 9, fill: "rgba(160,175,200,0.6)" }} tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              tickFormatter={(v: number) => `${v}m`}
            />
            <YAxis
              type="number" dataKey="y" name="pnl"
              tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false}
              tickFormatter={(v: number) => `$${Math.round(v)}`}
            />
            <ZAxis type="number" dataKey="z" range={[15, 250]} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 4" />
            <ReferenceLine x={60} stroke="rgba(251,146,60,0.4)" strokeDasharray="3 3" label={{ value: "60m cap", position: "top", fontSize: 8, fill: "rgba(251,146,60,0.6)" }} />
            <Tooltip content={<DurationTip />} cursor={{ strokeDasharray: "3 3", stroke: "rgba(255,255,255,0.1)" }} />
            <Scatter data={durWinners} fill="#22c55e" fillOpacity={0.5} />
            <Scatter data={durLosers}  fill="#ef4444" fillOpacity={0.5} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Hour bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Total P&L by Hour (ET)</p>
        <ColorBar data={byHour} />
      </div>

      {/* Day of week */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">P&L by Day of Week</p>
        <ColorBar data={byDay} />
      </div>

      {/* Monthly */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">P&L by Month</p>
        <ColorBar data={byMonth} />
      </div>
    </div>
  );
}
