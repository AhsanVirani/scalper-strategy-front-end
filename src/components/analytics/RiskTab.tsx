"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, AreaChart, Area,
} from "recharts";
import type { Trade } from "@/lib/api";
import { fmt } from "@/lib/format";

interface RiskTabProps {
  trades: Trade[];
}

function tip(children: React.ReactNode) {
  return (
    <div className="bg-card border border-border rounded-lg px-3 py-2 text-xs shadow-lg">
      {children}
    </div>
  );
}

function WRTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload: { i: number; wr: number } }[] }) {
  if (!active || !payload?.[0]) return null;
  const { i, wr } = payload[0].payload;
  return tip(<><p className="text-muted-foreground">Trade {i}</p><p className={`font-bold ${wr >= 50 ? "text-profit" : "text-loss"}`}>{wr.toFixed(1)}% WR</p></>);
}

function RTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload: { i: number; r: number } }[] }) {
  if (!active || !payload?.[0]) return null;
  const { i, r } = payload[0].payload;
  return tip(<><p className="text-muted-foreground">Trade {i}</p><p className={`font-bold ${r >= 0 ? "text-profit" : "text-loss"}`}>{r >= 0 ? "+" : ""}{r.toFixed(2)}R</p></>);
}

function DayTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload: { date: string; pnl: number } }[] }) {
  if (!active || !payload?.[0]) return null;
  const { date, pnl } = payload[0].payload;
  return tip(<><p className="text-muted-foreground">{date}</p><p className={`font-bold tabular ${pnl >= 0 ? "text-profit" : "text-loss"}`}>{pnl >= 0 ? "+" : ""}{fmt.dollars(pnl)}</p></>);
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color ?? "text-foreground"}`}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

/** Sequence of last N trades shown as colored dots */
function StreakDots({ trades }: { trades: Trade[] }) {
  const last = trades.slice(-40);
  return (
    <div className="flex flex-wrap gap-1">
      {last.map((t, i) => (
        <div
          key={i}
          title={`${fmt.dollars(t.pnl_dollars)}`}
          className={`w-3 h-3 rounded-sm ${t.pnl_dollars > 0 ? "bg-profit" : "bg-loss"}`}
          style={{ opacity: 0.55 + (i / last.length) * 0.45 }}
        />
      ))}
    </div>
  );
}

function PnlPeriodChart({
  daily, weekly, monthly,
}: {
  daily: { date: string; pnl: number }[];
  weekly: { date: string; pnl: number }[];
  monthly: { date: string; pnl: number }[];
}) {
  const [tab, setTab] = useState<"daily" | "weekly" | "monthly">("daily");
  const data = tab === "daily" ? daily : tab === "weekly" ? weekly : monthly;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">P&amp;L by Period</p>
        <div className="flex gap-1">
          {(["daily", "weekly", "monthly"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide transition-colors ${
                tab === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "daily" ? "D" : t === "weekly" ? "W" : "M"}
            </button>
          ))}
        </div>
      </div>
      {data.length === 0 ? null : (
        <ResponsiveContainer width="100%" height={130}>
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="date" tick={{ fontSize: 9, fill: "rgba(160,175,200,0.6)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" />
            <Tooltip content={<DayTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="pnl" radius={[3, 3, 0, 0]} maxBarSize={40}>
              {data.map((e, i) => (
                <Cell key={i} fill={e.pnl >= 0 ? "#22c55e" : "#ef4444"} fillOpacity={0.85} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export function RiskTab({ trades }: RiskTabProps) {
  const runningWR = useMemo(() => {
    let wins = 0;
    return trades.map((t, i) => {
      if (t.pnl_dollars > 0) wins++;
      return { i: i + 1, wr: (wins / (i + 1)) * 100 };
    });
  }, [trades]);

  const runningR = useMemo(() => {
    let cumR = 0;
    return trades.map((t, i) => {
      cumR += isFinite(t.r_multiple) ? t.r_multiple : 0;
      return { i: i + 1, r: +cumR.toFixed(3) };
    });
  }, [trades]);

  const dailyPnl = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of trades) {
      const key = fmt.dateShort(t.entry_time);
      map[key] = (map[key] ?? 0) + t.pnl_dollars;
    }
    return Object.entries(map).map(([date, pnl]) => ({ date, pnl: +pnl.toFixed(2) }));
  }, [trades]);

  const weeklyPnl = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of trades) {
      const d = new Date(t.entry_time);
      // ISO week: find Monday of this week
      const day = d.getDay() || 7;
      const mon = new Date(d);
      mon.setDate(d.getDate() - day + 1);
      const key = mon.toISOString().slice(0, 10);
      map[key] = (map[key] ?? 0) + t.pnl_dollars;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
      .map(([date, pnl]) => ({ date: `W ${date.slice(5)}`, pnl: +pnl.toFixed(2) }));
  }, [trades]);

  const monthlyPnl = useMemo(() => {
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const map: Record<string, number> = {};
    for (const t of trades) {
      const d = new Date(t.entry_time);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map[key] = (map[key] ?? 0) + t.pnl_dollars;
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
      .map(([key, pnl]) => {
        const [y, m] = key.split("-");
        return { date: `${MONTHS[parseInt(m) - 1]} ${y.slice(2)}`, pnl: +pnl.toFixed(2) };
      });
  }, [trades]);

  // Streak stats
  const { maxW, maxL, curW, curL } = useMemo(() => {
    let maxW = 0, maxL = 0, curW = 0, curL = 0;
    for (const t of trades) {
      if (t.pnl_dollars > 0) { curW++; curL = 0; maxW = Math.max(maxW, curW); }
      else { curL++; curW = 0; maxL = Math.max(maxL, curL); }
    }
    return { maxW, maxL, curW, curL };
  }, [trades]);

  // Drawdown from peak
  const drawdown = useMemo(() => {
    let peak = 0, maxDD = 0, cumPnl = 0;
    for (const t of trades) {
      cumPnl += t.pnl_dollars;
      if (cumPnl > peak) peak = cumPnl;
      const dd = peak - cumPnl;
      if (dd > maxDD) maxDD = dd;
    }
    return maxDD;
  }, [trades]);

  // Profit factor
  const { profitFactor, avgWin, avgLoss } = useMemo(() => {
    const wins = trades.filter(t => t.pnl_dollars > 0);
    const losses = trades.filter(t => t.pnl_dollars < 0);
    const grossWin = wins.reduce((s, t) => s + t.pnl_dollars, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl_dollars, 0));
    return {
      profitFactor: grossLoss > 0 ? grossWin / grossLoss : Infinity,
      avgWin: wins.length ? grossWin / wins.length : 0,
      avgLoss: losses.length ? grossLoss / losses.length : 0,
    };
  }, [trades]);

  const finalR = runningR[runningR.length - 1]?.r ?? 0;
  const currentWR = runningWR[runningWR.length - 1]?.wr ?? 0;

  return (
    <div className="flex flex-col gap-3">

      {/* Key risk stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Profit Factor" value={isFinite(profitFactor) ? profitFactor.toFixed(2) : "∞"} sub="gross win / gross loss" color={profitFactor >= 1.5 ? "text-profit" : profitFactor >= 1 ? "text-yellow-400" : "text-loss"} />
        <StatCard label="Max Drawdown" value={fmt.dollars(drawdown)} sub="peak → trough" color="text-loss" />
        <StatCard label="Avg Win" value={fmt.dollars(avgWin)} color="text-profit" />
        <StatCard label="Avg Loss" value={fmt.dollars(avgLoss)} color="text-loss" />
      </div>

      {/* Streak visual */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Trade Sequence (last 40)</p>
        <StreakDots trades={trades} />
        <div className="grid grid-cols-4 gap-2 mt-3">
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Max W Streak</p>
            <p className="text-lg font-bold text-profit">{maxW}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Max L Streak</p>
            <p className="text-lg font-bold text-loss">{maxL}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Cur Streak</p>
            <p className={`text-lg font-bold ${curW > 0 ? "text-profit" : "text-loss"}`}>{curW > 0 ? `+${curW}W` : `-${curL}L`}</p>
          </div>
          <div className="text-center">
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
            <p className={`text-lg font-bold ${currentWR >= 50 ? "text-profit" : "text-loss"}`}>{currentWR.toFixed(1)}%</p>
          </div>
        </div>
      </div>

      {/* Rolling WR */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Rolling Win Rate</p>
        <p className="text-[11px] text-muted-foreground mb-3">Win rate as each trade settles — converges toward true edge</p>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={runningWR} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="wrGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false} />
            <ReferenceLine y={50} stroke="rgba(255,255,255,0.2)" strokeDasharray="4 4" label={{ value: "50%", position: "right", fontSize: 8, fill: "rgba(255,255,255,0.3)" }} />
            <Tooltip content={<WRTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
            <Area type="monotone" dataKey="wr" stroke="#22c55e" strokeWidth={2} fill="url(#wrGrad)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Cumulative R */}
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-0.5">Cumulative R</p>
        <p className="text-[11px] text-muted-foreground mb-3">
          Total R earned over time — slope shows edge quality&nbsp;·&nbsp;
          <span className={`font-bold ${finalR >= 0 ? "text-profit" : "text-loss"}`}>{finalR >= 0 ? "+" : ""}{finalR.toFixed(1)}R total</span>
        </p>
        <ResponsiveContainer width="100%" height={130}>
          <AreaChart data={runningR} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="rGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="i" tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 9, fill: "rgba(160,175,200,0.5)" }} tickLine={false} axisLine={false} />
            <ReferenceLine y={0} stroke="rgba(255,255,255,0.15)" />
            <Tooltip content={<RTooltip />} cursor={{ stroke: "rgba(255,255,255,0.08)" }} />
            <Area type="monotone" dataKey="r" stroke="#60a5fa" strokeWidth={2} fill="url(#rGrad)" dot={false} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* P&L bar chart — Daily / Weekly / Monthly */}
      <PnlPeriodChart daily={dailyPnl} weekly={weeklyPnl} monthly={monthlyPnl} />

    </div>
  );
}
