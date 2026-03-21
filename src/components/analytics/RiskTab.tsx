"use client";

import { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, AreaChart, Area,
} from "recharts";
import type { AnalyticsOut, Metrics, Trade } from "@/lib/api";
import { fmt } from "@/lib/format";

interface RiskTabProps {
  analytics: AnalyticsOut;
  metrics: Metrics;
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

function DayTooltip({ active, payload }: { active?: boolean; payload?: readonly { payload: { label: string; pnl: number } }[] }) {
  if (!active || !payload?.[0]) return null;
  const { label, pnl } = payload[0].payload;
  return tip(<><p className="text-muted-foreground">{label}</p><p className={`font-bold tabular ${pnl >= 0 ? "text-profit" : "text-loss"}`}>{pnl >= 0 ? "+" : ""}{fmt.dollars(pnl)}</p></>);
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
  daily: { label: string; pnl: number }[];
  weekly: { label: string; pnl: number }[];
  monthly: { label: string; pnl: number }[];
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
            <XAxis dataKey="label" tick={{ fontSize: 9, fill: "rgba(160,175,200,0.6)" }} tickLine={false} axisLine={false} />
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

export function RiskTab({ analytics: a, metrics: m, trades }: RiskTabProps) {
  const runningWR = a.running_wr;
  const runningR  = a.cumulative_r;

  const finalR      = runningR[runningR.length - 1]?.r ?? 0;
  const currentWR   = runningWR[runningWR.length - 1]?.wr ?? 0;

  const maxW = a.max_consec_wins;
  const maxL = a.max_consec_losses;

  // current_streak: positive = win streak, negative = loss streak
  const streak = a.current_streak;
  const curW = streak > 0 ? streak : 0;
  const curL = streak < 0 ? Math.abs(streak) : 0;

  return (
    <div className="flex flex-col gap-3">

      {/* Key risk stats */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard label="Profit Factor" value={isFinite(m.profit_factor) ? m.profit_factor.toFixed(2) : "∞"} sub="gross win / gross loss" color={m.profit_factor >= 1.5 ? "text-profit" : m.profit_factor >= 1 ? "text-yellow-400" : "text-loss"} />
        <StatCard label="Max Drawdown" value={fmt.dollars(m.max_drawdown_dollars)} sub="peak → trough" color="text-loss" />
        <StatCard label="Avg Win" value={fmt.dollars(m.avg_win)} color="text-profit" />
        <StatCard label="Avg Loss" value={fmt.dollars(m.avg_loss)} color="text-loss" />
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
      <PnlPeriodChart daily={a.daily_pnl} weekly={a.weekly_pnl} monthly={a.monthly_pnl} />

    </div>
  );
}
