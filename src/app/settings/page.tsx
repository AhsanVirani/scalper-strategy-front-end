"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { fetchHealth } from "@/lib/api";
import { Check, AlertCircle, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const apiUrl    = useStore((s) => s.apiUrl);
  const setApiUrl = useStore((s) => s.setApiUrl);

  const [draft,   setDraft]   = useState(apiUrl);
  const [status,  setStatus]  = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [errMsg,  setErrMsg]  = useState("");

  async function check() {
    setStatus("checking");
    setErrMsg("");
    try {
      await fetchHealth(draft.replace(/\/$/, ""));
      setApiUrl(draft.replace(/\/$/, ""));
      setStatus("ok");
    } catch (e) {
      setStatus("error");
      setErrMsg(e instanceof Error ? e.message : "Connection failed");
    }
  }

  return (
    <div className="flex flex-col pb-8">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-muted-foreground">Settings</p>
        <p className="text-2xl font-bold text-foreground mt-0.5">Configuration</p>
      </div>

      {/* API URL */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-4">API Server</p>

        <label className="text-xs text-muted-foreground block mb-1.5">Backend URL</label>
        <input
          value={draft}
          onChange={(e) => { setDraft(e.target.value); setStatus("idle"); }}
          placeholder="http://localhost:8000"
          className="w-full bg-secondary border border-border rounded-lg px-3 py-3 text-sm text-foreground font-mono mb-2"
        />
        <p className="text-[11px] text-muted-foreground mb-4">
          Local: <span className="text-foreground font-mono">http://localhost:8000</span> · Render.com: your deployed URL.
        </p>

        <button
          onClick={check}
          disabled={status === "checking"}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-secondary hover:bg-accent text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {status === "checking" && <Loader2 size={14} className="animate-spin" />}
          {status === "ok"       && <Check size={14} className="text-profit" />}
          {status === "error"    && <AlertCircle size={14} className="text-loss" />}
          {status === "idle"     ? "Test Connection" :
           status === "checking" ? "Checking…" :
           status === "ok"       ? "Connected — Saved!" :
           "Failed — Try Again"}
        </button>

        {status === "error" && errMsg && (
          <p className="text-xs text-loss mt-2">{errMsg}</p>
        )}
      </div>

      {/* Strategy info */}
      <div className="mx-4 mb-3 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Strategy</p>
        {[
          ["Strategy", "LVN/FVG Scalper"],
          ["Instrument", "MES Futures"],
          ["Timeframe", "1-min bars"],
          ["Point Value", "$5 / point"],
          ["Commission", "$0.62 / side"],
        ].map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="text-sm font-semibold">{value}</span>
          </div>
        ))}
      </div>

      {/* PWA install */}
      <div className="mx-4 rounded-xl border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Install on Phone</p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          <span className="font-semibold text-foreground">iOS Safari:</span> tap Share → Add to Home Screen.
          {" "}
          <span className="font-semibold text-foreground">Android Chrome:</span> tap ⋮ → Add to Home Screen.
        </p>
      </div>
    </div>
  );
}
