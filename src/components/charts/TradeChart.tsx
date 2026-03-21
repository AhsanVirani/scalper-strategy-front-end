"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  createSeriesMarkers,
  ColorType,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  LineSeries,
} from "lightweight-charts";
import type { IChartApi, Time } from "lightweight-charts";
import { useStore } from "@/lib/store";
import { fetchTradeBars } from "@/lib/api";
import type { Trade, TradeBarsResult } from "@/lib/api";

export function TradeChart({ trade }: { trade: Trade }) {
  const apiUrl = useStore((s) => s.apiUrl);
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [data, setData] = useState<TradeBarsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTradeBars(apiUrl, trade)
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch((e) => { if (!cancelled) { setError(e.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [apiUrl, trade.entry_time, trade.exit_time]);

  useEffect(() => {
    if (!data || !containerRef.current) return;

    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 260,
      layout: {
        background: { type: ColorType.Solid, color: "#111620" },
        textColor: "#6b7280",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1e2535" },
        horzLines: { color: "#1e2535" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#3b4a6b", labelBackgroundColor: "#1e2535" },
        horzLine: { color: "#3b4a6b", labelBackgroundColor: "#1e2535" },
      },
      rightPriceScale: { borderColor: "#1e2535", scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: "#1e2535", timeVisible: true, secondsVisible: false, fixLeftEdge: true, fixRightEdge: true },
    });
    chartRef.current = chart;

    const isLong = data.direction.toUpperCase() === "LONG";
    const t0 = data.bars[0].time as Time;
    const t1 = data.bars[data.bars.length - 1].time as Time;

    // Candlesticks
    const candles = chart.addSeries(CandlestickSeries, {
      upColor: "#00c076", downColor: "#ff3b30",
      borderUpColor: "#00c076", borderDownColor: "#ff3b30",
      wickUpColor: "#00c076", wickDownColor: "#ff3b30",
    });
    candles.setData(data.bars.map((b) => ({
      time: b.time as Time, open: b.open, high: b.high, low: b.low, close: b.close,
    })));

    // Entry / SL / TP lines
    const entryLine = chart.addSeries(LineSeries, {
      color: "#3b82f6", lineWidth: 1, lineStyle: LineStyle.Solid,
      lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false, title: "Entry",
    });
    entryLine.setData([{ time: t0, value: data.entry_price }, { time: t1, value: data.entry_price }]);

    const slLine = chart.addSeries(LineSeries, {
      color: "#ff3b30", lineWidth: 1, lineStyle: LineStyle.Dashed,
      lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false, title: "SL",
    });
    slLine.setData([{ time: t0, value: data.initial_stop_loss }, { time: t1, value: data.initial_stop_loss }]);

    const tpLine = chart.addSeries(LineSeries, {
      color: "#00c076", lineWidth: 1, lineStyle: LineStyle.Dashed,
      lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false, title: "TP",
    });
    tpLine.setData([{ time: t0, value: data.take_profit }, { time: t1, value: data.take_profit }]);

    // FVG impulse zone (the level that created the trade on retracement)
    if (data.gap_top > 0 && data.gap_bot > 0) {
      const fvgTop = chart.addSeries(LineSeries, {
        color: "#f59e0b", lineWidth: 1, lineStyle: LineStyle.Dotted,
        lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false, title: "FVG↑",
      });
      fvgTop.setData([{ time: t0, value: data.gap_top }, { time: t1, value: data.gap_top }]);

      const fvgBot = chart.addSeries(LineSeries, {
        color: "#f59e0b", lineWidth: 1, lineStyle: LineStyle.Dotted,
        lastValueVisible: true, priceLineVisible: false, crosshairMarkerVisible: false, title: "FVG↓",
      });
      fvgBot.setData([{ time: t0, value: data.gap_bot }, { time: t1, value: data.gap_bot }]);
    }

    // Entry + exit markers
    const exitWin = isLong ? data.exit_price > data.entry_price : data.exit_price < data.entry_price;
    createSeriesMarkers(candles, [
      {
        time: data.entry_time as Time,
        position: isLong ? "belowBar" : "aboveBar",
        color: "#3b82f6",
        shape: isLong ? "arrowUp" : "arrowDown",
        text: isLong ? "BUY" : "SELL",
        size: 1,
      },
      {
        time: data.exit_time as Time,
        position: isLong ? "aboveBar" : "belowBar",
        color: exitWin ? "#00c076" : "#ff3b30",
        shape: isLong ? "arrowDown" : "arrowUp",
        text: "EXIT",
        size: 1,
      },
    ]);

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current)
        chartRef.current.resize(containerRef.current.clientWidth, 260);
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [data]);

  if (loading) return (
    <div className="w-full h-[260px] bg-card rounded-lg flex items-center justify-center">
      <p className="text-xs text-muted-foreground animate-pulse">Loading chart…</p>
    </div>
  );

  if (error) return (
    <div className="w-full h-[260px] bg-card rounded-lg flex items-center justify-center">
      <p className="text-xs text-loss">Chart unavailable</p>
    </div>
  );

  return <div ref={containerRef} className="w-full rounded-lg overflow-hidden" />;
}
