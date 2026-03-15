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
  config_used: Record<string, unknown>;
}

// ── Derived metrics (computed from trades on frontend — not in backend) ────────

export interface DerivedMetrics {
  largest_win: number;
  largest_loss: number;
  avg_win_r: number;
  avg_loss_r: number;
  recovery_factor: number;
  max_consec_wins: number;
  max_consec_losses: number;
}

export function deriveMetrics(trades: Trade[], metrics: Metrics): DerivedMetrics {
  const safe = (v: number) => (isFinite(v) && !isNaN(v) ? v : 0);

  const winners = trades.filter((t) => t.pnl_dollars > 0);
  const losers = trades.filter((t) => t.pnl_dollars < 0);

  const largest_win = safe(winners.length ? Math.max(...winners.map((t) => t.pnl_dollars)) : 0);
  const largest_loss = safe(losers.length ? Math.min(...losers.map((t) => t.pnl_dollars)) : 0);

  const winRs = winners.map((t) => t.r_multiple).filter((v) => isFinite(v) && !isNaN(v));
  const lossRs = losers.map((t) => t.r_multiple).filter((v) => isFinite(v) && !isNaN(v));
  const avg_win_r = safe(winRs.length ? winRs.reduce((a, b) => a + b, 0) / winRs.length : 0);
  const avg_loss_r = safe(lossRs.length ? lossRs.reduce((a, b) => a + b, 0) / lossRs.length : 0);

  const recovery_factor = safe(
    metrics.max_drawdown_dollars > 0 ? metrics.total_pnl / metrics.max_drawdown_dollars : 0
  );

  let maxW = 0, maxL = 0, curW = 0, curL = 0;
  for (const t of trades) {
    if (t.pnl_dollars > 0) { curW++; curL = 0; maxW = Math.max(maxW, curW); }
    else { curL++; curW = 0; maxL = Math.max(maxL, curL); }
  }

  return { largest_win, largest_loss, avg_win_r, avg_loss_r, recovery_factor, max_consec_wins: maxW, max_consec_losses: maxL };
}

// ── API calls ─────────────────────────────────────────────────────────────────

export async function runBacktest(apiUrl: string, params: BacktestParams): Promise<BacktestResult> {
  const res = await fetch(`${apiUrl}/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
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
  const wsBase = apiUrl.replace(/^http/, "ws");
  const ws = new WebSocket(`${wsBase}/live`);
  ws.onmessage = (e) => { try { onMessage(JSON.parse(e.data)); } catch { /* skip */ } };
  ws.onclose = onClose ?? (() => {});
  return ws;
}
