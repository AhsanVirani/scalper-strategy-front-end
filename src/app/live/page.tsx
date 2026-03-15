"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { type LiveMessage } from "@/lib/api";
import { TradeBadge } from "@/components/shared/TradeBadge";
import { fmt } from "@/lib/format";
import { Radio, Wifi, WifiOff } from "lucide-react";

export default function LivePage() {
  const apiUrl = useStore((s) => s.apiUrl);
  const [msg,       setMsg]       = useState<LiveMessage | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let dead = false;

    function connect() {
      if (dead) return;
      const wsBase = apiUrl.replace(/^http/, "ws");
      ws = new WebSocket(`${wsBase}/live`);
      ws.onopen    = () => setConnected(true);
      ws.onclose   = () => { setConnected(false); if (!dead) setTimeout(connect, 3000); };
      ws.onerror   = () => setConnected(false);
      ws.onmessage = (e) => {
        try { setMsg(JSON.parse(e.data)); setConnected(true); } catch { /* skip */ }
      };
    }

    connect();
    return () => { dead = true; ws?.close(); };
  }, [apiUrl]);

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Live</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">Live Monitor</p>
        </div>
        <div className={`flex items-center gap-1.5 text-xs font-bold ${connected ? "text-profit" : "text-muted-foreground"}`}>
          {connected ? <Wifi size={14} /> : <WifiOff size={14} />}
          {connected ? "Connected" : "Disconnected"}
        </div>
      </div>

      {/* Phase 2 notice */}
      {msg?.phase === "phase-2-not-yet-live" && (
        <div className="mx-4 mb-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-4 py-3">
          <p className="text-sm font-semibold text-yellow-400">Phase 2 — Live engine not yet connected</p>
          <p className="text-xs text-yellow-400/70 mt-1">WebSocket is connected. Live engine will stream here.</p>
        </div>
      )}

      {/* Equity */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card p-4 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Account Equity</p>
          <p className="text-3xl font-bold tabular mt-1">
            {msg?.equity != null ? fmt.dollars(msg.equity) : "—"}
          </p>
        </div>
        <Radio size={28} className="text-muted-foreground" />
      </div>

      {/* Open position */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Open Position</p>
        {msg?.position ? (
          <div className="flex flex-col gap-3">
            <TradeBadge direction={msg.position.direction as "LONG" | "SHORT"} />
            <div className="grid grid-cols-3 gap-3">
              <InfoItem label="Entry"      value={msg.position.entry_price.toFixed(2)} />
              <InfoItem label="Contracts"  value={String(msg.position.contracts)} />
              <InfoItem
                label="Unrealized"
                value={fmt.dollars(msg.position.unrealized_pnl)}
                positive={msg.position.unrealized_pnl >= 0}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No open position</p>
        )}
      </div>

      {/* Pending signal */}
      {msg?.pending_signal && (
        <div className="mx-4 mb-3 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-1">Pending Signal</p>
          <p className="text-sm font-bold text-blue-300">
            {msg.pending_signal.direction} @ {msg.pending_signal.entry.toFixed(2)}
          </p>
        </div>
      )}

      {/* Today's trades */}
      <div className="mx-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Today&apos;s Trades</p>
        {!msg?.today_trades?.length ? (
          <div className="rounded-xl border border-border bg-card px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No trades today</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-card overflow-hidden">
            {msg.today_trades.map((t, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <TradeBadge direction={t.direction} exitReason={t.exit_reason} />
                <p className={`text-sm font-bold tabular ${t.pnl_dollars >= 0 ? "text-profit" : "text-loss"}`}>
                  {fmt.dollars(t.pnl_dollars)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {msg?.timestamp && (
        <p className="text-center text-[11px] text-muted-foreground/40 mt-4">
          {new Date(msg.timestamp).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

function InfoItem({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-bold tabular mt-0.5 ${positive === true ? "text-profit" : positive === false ? "text-loss" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}
