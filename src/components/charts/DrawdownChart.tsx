"use client";

import { useMemo, useId } from "react";
import { AreaChart, Area, ResponsiveContainer, Tooltip, YAxis, ReferenceLine } from "recharts";

interface DrawdownChartProps {
  equityCurve: number[];
  height?: number;
}

function computeDrawdown(equity: number[]): number[] {
  let peak = equity[0] ?? 0;
  return equity.map((v) => {
    if (!isFinite(v)) return 0;
    if (v > peak) peak = v;
    return peak === 0 ? 0 : ((v - peak) / peak) * 100;
  });
}

export function DrawdownChart({ equityCurve, height = 90 }: DrawdownChartProps) {
  const uid = useId().replace(/:/g, "");
  const gradId = `ddGrad-${uid}`;

  const data = useMemo(() => {
    const clean = equityCurve.filter((v) => isFinite(v));
    return computeDrawdown(clean).map((v, i) => ({ i, dd: v }));
  }, [equityCurve]);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis domain={["auto", 0]} hide />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
        <Tooltip
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const v = payload[0].value as number;
            return (
              <div className="bg-card border border-border rounded px-2 py-1 text-xs tabular">
                <span className="text-loss">{v.toFixed(2)}%</span>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey="dd"
          stroke="#ef4444"
          strokeWidth={1.5}
          fill={`url(#${gradId})`}
          dot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
