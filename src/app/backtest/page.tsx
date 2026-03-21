"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { runBacktest, type BacktestParams } from "@/lib/api";
import { ParamSlider } from "@/components/backtest/ParamSlider";
import { ResultsPanel } from "@/components/backtest/ResultsPanel";
import { Switch } from "@/components/ui/switch";
import { ChevronDown, ChevronUp, Play, RotateCcw, Loader2, Bot } from "lucide-react";

const QUICK_RANGES: { label: string; months: number | null }[] = [
  { label: "1M", months: 1 },
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "ALL", months: null },
];

function subtractMonths(months: number): string {
  const d = new Date();
  d.setDate(1); // avoid month-boundary issues
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

export default function BacktestPage() {
  const params     = useStore((s) => s.params);
  const setParam   = useStore((s) => s.setParam);
  const resetParams = useStore((s) => s.resetParams);
  const result     = useStore((s) => s.result);
  const setResult  = useStore((s) => s.setResult);
  const isLoading  = useStore((s) => s.isLoading);
  const setLoading = useStore((s) => s.setLoading);
  const error      = useStore((s) => s.error);
  const setError   = useStore((s) => s.setError);
  const apiUrl     = useStore((s) => s.apiUrl);

  const [showAdvanced, setShowAdvanced] = useState(false);

  async function handleRun() {
    setError(null);
    setLoading(true);
    if (params.start_date >= params.end_date) {
      setError("Start date must be before end date.");
      setLoading(false);
      return;
    }
    try {
      // Only send the fields the frontend exposes — everything else falls back
      // to config.toml defaults on the server, matching `python -m scalper dryrun`.
      const overrides: BacktestParams = {
        start_date: params.start_date,
        end_date: params.end_date,
        stop_loss_min_points: params.stop_loss_min_points,
        stop_loss_max_points: params.stop_loss_max_points,
        take_profit_min_points: params.take_profit_min_points,
        take_profit_max_points: params.take_profit_max_points,
        breakeven_r: params.breakeven_r,
        entry_zone_percent: params.entry_zone_percent,
        risk_per_trade_dollars: params.risk_per_trade_dollars,
        max_daily_loss: params.max_daily_loss,
        max_trades_per_day: params.max_trades_per_day,
        initial_capital: params.initial_capital,
        avoid_lunch: params.avoid_lunch,
        rth_only: params.rth_only,
      };
      const data = await runBacktest(apiUrl, overrides);
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function applyQuickRange(months: number | null) {
    const today = new Date().toISOString().slice(0, 10);
    setParam("end_date", today);
    setParam("start_date", months ? subtractMonths(months) : "2020-01-01");
  }

  return (
    <div className="flex flex-col gap-0 pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Backtest</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">Configure & Run</p>
        </div>
        <button
          onClick={resetParams}
          className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg px-3 py-2"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      {/* Date range */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Date Range</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">Start</label>
            <input
              type="date"
              value={params.start_date}
              onChange={(e) => setParam("start_date", e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground tabular"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1.5">End</label>
            <input
              type="date"
              value={params.end_date}
              onChange={(e) => setParam("end_date", e.target.value)}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground tabular"
            />
          </div>
        </div>
        <div className="flex gap-1.5">
          {QUICK_RANGES.map(({ label, months }) => (
            <button
              key={label}
              onClick={() => applyQuickRange(months)}
              className="flex-1 py-2 text-xs font-semibold rounded-lg bg-secondary hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Strategy parameters */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">Strategy</p>
        <div className="flex flex-col gap-5">
          <ParamSlider label="Stop Loss (pts)"      value={params.stop_loss_min_points}      min={3}   max={15}   step={0.5}  onChange={(v) => { setParam("stop_loss_min_points", v); setParam("stop_loss_max_points", v); }} />
          <ParamSlider label="Take Profit Min (pts)" value={params.take_profit_min_points}    min={5}   max={30}   step={0.5}  onChange={(v) => setParam("take_profit_min_points", v)} />
          <ParamSlider label="Take Profit Max (pts)" value={params.take_profit_max_points}    min={10}  max={50}   step={0.5}  onChange={(v) => setParam("take_profit_max_points", v)} />
          <ParamSlider label="Breakeven R"           value={params.breakeven_r}               min={0}   max={3}    step={0.25} onChange={(v) => setParam("breakeven_r", v)} />
          <ParamSlider label="Entry Zone %"          value={params.entry_zone_percent}        min={0.5} max={0.95} step={0.05} onChange={(v) => setParam("entry_zone_percent", v)} />
        </div>
      </div>

      {/* Advanced */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center justify-between w-full"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Risk & Filters</p>
          {showAdvanced ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
        </button>

        {showAdvanced && (
          <div className="flex flex-col gap-5 mt-4 pt-4 border-t border-border">
            <ParamSlider label="Risk per Trade ($)"  value={params.risk_per_trade_dollars} min={50}   max={500}   step={25}   onChange={(v) => setParam("risk_per_trade_dollars", v)} />
            <ParamSlider label="Max Daily Loss ($)"  value={params.max_daily_loss}         min={100}  max={1000}  step={50}   onChange={(v) => setParam("max_daily_loss", v)} />
            <ParamSlider label="Max Trades / Day"    value={params.max_trades_per_day}     min={1}    max={10}    step={1}    onChange={(v) => setParam("max_trades_per_day", v)} />
            <ParamSlider label="Initial Capital ($)" value={params.initial_capital}        min={1000} max={100000} step={1000} onChange={(v) => setParam("initial_capital", v)} />
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">Avoid Lunch (12–14 ET)</span>
              <Switch checked={params.avoid_lunch} onCheckedChange={(v) => setParam("avoid_lunch", v)} />
            </div>
            <div className="flex items-center justify-between py-1">
              <span className="text-sm text-muted-foreground">RTH Only (9:30–16:00 ET)</span>
              <Switch checked={params.rth_only} onCheckedChange={(v) => setParam("rth_only", v)} />
            </div>
          </div>
        )}
      </div>

      {/* Agent config info */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Bot size={14} className="text-[hsl(217,91%,60%)]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Agent Sizing</p>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-[hsl(217_91%_60%/0.15)] text-[hsl(217,91%,60%)] border border-[hsl(217_91%_60%/0.25)]">
            ENABLED
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Agent dynamically sizes positions based on 5 scoring criteria. Score range: −4 to +4. Multiplier range: 0.25× to 1.5×.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 mb-3 rounded-xl border border-loss/30 bg-loss/10 px-4 py-3">
          <p className="text-sm text-loss font-medium">{error}</p>
        </div>
      )}

      {/* Run button */}
      <div className="mx-4 mb-4">
        <button
          onClick={handleRun}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-profit hover:brightness-110 disabled:opacity-60 text-black font-bold text-sm transition-all"
        >
          {isLoading
            ? <><Loader2 size={18} className="animate-spin" /> Running simulation…</>
            : <><Play size={16} fill="currentColor" /> Run Backtest</>}
        </button>
      </div>

      {/* Results */}
      {result && !isLoading && (
        <div className="mx-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Results</p>
          <ResultsPanel result={result} initialCapital={params.initial_capital} />
        </div>
      )}
    </div>
  );
}
