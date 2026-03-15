"use client";

import { useEffect, useRef } from "react";
import { createChart, ColorType, LineStyle, AreaSeries, LineSeries } from "lightweight-charts";

interface EquityChartProps {
  data: number[];
  /** Unix seconds per bar, aligned with data. */
  timestamps?: number[];
  initialCapital?: number;
  height?: number;
}

export function EquityChart({ data, timestamps, initialCapital = 10000, height = 220 }: EquityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const clean = data.filter((v) => typeof v === "number" && isFinite(v));
    if (clean.length === 0) return;

    const last = clean[clean.length - 1];
    const isProfit = last >= initialCapital;
    const lineColor = isProfit ? "#22c55e" : "#ef4444";
    const topColor  = isProfit ? "rgba(34,197,94,0.18)" : "rgba(239,68,68,0.15)";

    const useTs = timestamps && timestamps.length >= clean.length;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "rgba(160,175,200,0.6)",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "rgba(255,255,255,0.03)" },
        horzLines: { color: "rgba(255,255,255,0.05)" },
      },
      crosshair: {
        vertLine: { color: "rgba(160,175,200,0.3)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1e2230" },
        horzLine: { color: "rgba(160,175,200,0.3)", width: 1, style: LineStyle.Dashed, labelBackgroundColor: "#1e2230" },
      },
      rightPriceScale: {
        borderColor: "rgba(255,255,255,0.06)",
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: "rgba(255,255,255,0.06)",
        timeVisible: useTs ? true : false,
        secondsVisible: false,
        rightOffset: 2,
      },
      handleScroll: true,
      handleScale: true,
    });

    const area = chart.addSeries(AreaSeries, {
      lineColor,
      topColor,
      bottomColor: "rgba(0,0,0,0)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      crosshairMarkerVisible: true,
      crosshairMarkerRadius: 4,
      crosshairMarkerBackgroundColor: lineColor,
    });

    const baseline = chart.addSeries(LineSeries, {
      color: "rgba(255,255,255,0.15)",
      lineWidth: 1,
      lineStyle: LineStyle.Dashed,
      priceLineVisible: false,
      lastValueVisible: false,
      crosshairMarkerVisible: false,
    });

    // Downsample to ≤2000 points so chart stays fast, preserving shape
    const step = Math.max(1, Math.floor(clean.length / 2000));
    const indices = new Set<number>();
    for (let i = 0; i < clean.length; i += step) indices.add(i);
    indices.add(0);
    indices.add(clean.length - 1);
    const sorted = Array.from(indices).sort((a, b) => a - b);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pts = sorted.map((i) => ({ time: (useTs ? timestamps![i] : i + 1) as any, value: clean[i] }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const basePts = sorted.map((i) => ({ time: (useTs ? timestamps![i] : i + 1) as any, value: initialCapital }));

    area.setData(pts);
    baseline.setData(basePts);
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, [data, timestamps, initialCapital]);

  return <div ref={containerRef} style={{ height }} className="w-full" />;
}
