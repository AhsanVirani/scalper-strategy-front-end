/**
 * API client — thin wrapper around the FastAPI backend.
 * Field names match the Python MetricsOut / TradeOut models exactly.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BacktestParams {
  start_date?: string;
  end_date?: string;
  risk_per_trade_dollars?: number;
  max_daily_loss?: number;
  max_trades_per_day?: number;
  initial_capital?: number;
  stop_loss_min_points?: number;
  stop_loss_max_points?: number;
  take_profit_min_points?: number;
  take_profit_max_points?: number;
  breakeven_r?: number;
  entry_zone_percent?: number;
  avoid_lunch?: boolean;
  rth_only?: boolean;
}

/** Matches Python TradeOut exactly */
export interface Trade {
  entry_time: string;
  exit_time: string;
  direction: string;
  entry_price: number;
  exit_price: number;
  stop_loss: number;          // final SL (may have moved to breakeven)
  take_profit: number;        // final TP
  initial_stop_loss: number;  // SL at open — use this for R
  initial_take_profit: number;
  size: number;
  pnl_points: number;
  pnl_dollars: number;
  exit_reason: string;
  r_multiple: number;
  is_continuation: boolean;
  agent_score: number;        // -4 to +4
  agent_mult: number;         // 0.25 to 1.5
  gap_top: number;            // FVG impulse zone top
  gap_bot: number;            // FVG impulse zone bottom
}

/** Matches Python MetricsOut exactly */
export interface Metrics {
  total_trades: number;
  winning_trades: number;
  losing_trades: number;
  win_rate_pct: number;       // 0–100
  profit_factor: number;
  total_pnl: number;
  gross_profit: number;
  gross_loss: number;
  avg_win: number;
  avg_loss: number;
  avg_trade: number;
  total_return_pct: number;   // percentage
  max_drawdown_pct: number;   // positive percentage
  max_drawdown_dollars: number;
  sharpe_ratio: number;
  final_equity: number;
}

export interface BacktestResult {
  trades: Trade[];
  equity_curve: number[];
  equity_timestamps: number[];  // Unix seconds, aligned with equity_curve
  metrics: Metrics;
  analytics: AnalyticsOut;
  config_used: Record<string, unknown>;
}

// ── Analytics (pre-computed by backend) ───────────────────────────────────────

export interface HistBin { label: string; count: number; midpoint: number; }
export interface ExitReasonStat { reason: string; count: number; pct: number; total_pnl: number; win_rate_pct: number; }
export interface PeriodPnl { label: string; pnl: number; count: number; wins: number; }
export interface BubblePoint { x: number; y: number; z: number; pnl: number; hour: string; }
export interface DurationPoint { x: number; y: number; z: number; pnl: number; mins: number; label: string; }
export interface WRPoint { i: number; wr: number; }
export interface RPoint { i: number; r: number; }
export interface AgentTierStat {
  label: string;       // "ELITE" | "GOOD" | "NEUTRAL" | "WEAK" | "POOR"
  score_range: string; // "+3 to +4"
  count: number;
  wins: number;
  win_rate_pct: number;
  total_pnl: number;
  avg_pnl: number;
}

export interface AgentStats {
  avg_score_winners: number;
  avg_score_losers: number;
  continuation_win_rate_pct: number;
  continuation_count: number;
  reversal_win_rate_pct: number;
  reversal_count: number;
  mult_buckets: Array<{ label: string; count: number; pct: number }>;
  tiers: AgentTierStat[];
}
export interface AnalyticsOut {
  largest_win: number;
  largest_loss: number;
  avg_win_r: number;
  avg_loss_r: number;
  recovery_factor: number;
  max_consec_wins: number;
  max_consec_losses: number;
  current_streak: number;
  running_wr: WRPoint[];
  cumulative_r: RPoint[];
  daily_pnl: PeriodPnl[];
  weekly_pnl: PeriodPnl[];
  monthly_pnl: PeriodPnl[];
  pnl_histogram: HistBin[];
  r_histogram: HistBin[];
  exit_reasons: ExitReasonStat[];
  by_hour: PeriodPnl[];
  by_day: PeriodPnl[];
  by_month: PeriodPnl[];
  bubble_scatter: BubblePoint[];
  duration_scatter: DurationPoint[];
  agent: AgentStats;
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function runBacktest(apiUrl: string, params: BacktestParams): Promise<BacktestResult> {
  const res = await fetch(`${apiUrl}/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(120000), // 2 min max
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error((err as { detail?: string }).detail ?? "Backtest failed");
  }
  return res.json();
}

export async function fetchHealth(apiUrl: string): Promise<{ status: string }> {
  const res = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(5000) });
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}

// ── Trade bars ────────────────────────────────────────────────────────────────

export interface OHLCBar { time: number; open: number; high: number; low: number; close: number; volume: number; }

export interface TradeBarsResult {
  bars: OHLCBar[];
  entry_time: number;
  exit_time: number;
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  initial_stop_loss: number;
  take_profit: number;
  direction: string;
  gap_top: number;
  gap_bot: number;
}

export async function fetchTradeBars(apiUrl: string, trade: Trade): Promise<TradeBarsResult> {
  const params = new URLSearchParams({
    entry_time: trade.entry_time,
    exit_time: trade.exit_time,
    entry_price: String(trade.entry_price),
    exit_price: String(trade.exit_price),
    stop_loss: String(trade.stop_loss),
    initial_stop_loss: String(trade.initial_stop_loss),
    take_profit: String(trade.take_profit),
    direction: trade.direction,
    gap_top: String(trade.gap_top ?? 0),
    gap_bot: String(trade.gap_bot ?? 0),
    bars_before: "25",
    bars_after: "10",
  });
  const res = await fetch(`${apiUrl}/trade-bars?${params}`);
  if (!res.ok) throw new Error("Failed to fetch trade bars");
  return res.json();
}

// ── WebSocket ─────────────────────────────────────────────────────────────────

export type LiveMessage = {
  position: null | { direction: string; entry_price: number; contracts: number; unrealized_pnl: number };
  equity: number | null;
  today_trades: Trade[];
  pending_signal: null | { direction: string; entry: number };
  timestamp: string;
  phase?: string;
};

export function connectLiveFeed(apiUrl: string, onMessage: (msg: LiveMessage) => void, onClose?: () => void): WebSocket {
  const wsBase = apiUrl.replace(/^https?:\/\//, (match) => match.startsWith("https") ? "wss://" : "ws://");
  const ws = new WebSocket(`${wsBase}/live`);
  ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch { /* skip */ } };
  ws.onclose = onClose ?? (() => {});
  return ws;
}
