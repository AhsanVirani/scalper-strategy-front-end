/**
 * Zustand global store.
 * Params match Python BacktestRequest field names exactly.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { BacktestParams, BacktestResult } from "./api";

export const DEFAULT_PARAMS: Required<BacktestParams> = {
  start_date: "2025-03-07",
  end_date: "2026-03-14",
  risk_per_trade_dollars: 200,
  max_daily_loss: 400,
  max_trades_per_day: 4,
  initial_capital: 10000,
  stop_loss_min_points: 8,
  stop_loss_max_points: 8,
  take_profit_min_points: 10,
  take_profit_max_points: 25,
  breakeven_r: 1.0,
  entry_zone_percent: 0.75,
  avoid_lunch: true,
  rth_only: true,
};

interface AppStore {
  params: Required<BacktestParams>;
  setParam: <K extends keyof BacktestParams>(key: K, value: BacktestParams[K]) => void;
  resetParams: () => void;

  result: BacktestResult | null;
  setResult: (r: BacktestResult | null) => void;

  isLoading: boolean;
  setLoading: (v: boolean) => void;
  error: string | null;
  setError: (e: string | null) => void;

  apiUrl: string;
  setApiUrl: (url: string) => void;
}

export const useStore = create<AppStore>()(
  persist(
    (set) => ({
      params: { ...DEFAULT_PARAMS },
      setParam: (key, value) => set((s) => ({ params: { ...s.params, [key]: value } })),
      resetParams: () => set({ params: { ...DEFAULT_PARAMS } }),

      result: null,
      setResult: (result) => set({ result }),

      isLoading: false,
      setLoading: (isLoading) => set({ isLoading }),
      error: null,
      setError: (error) => set({ error }),

      apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000",
      setApiUrl: (apiUrl) => set({ apiUrl }),
    }),
    {
      name: "trading-store-v3",
      partialize: (s) => ({ params: s.params, apiUrl: s.apiUrl }),
    }
  )
);
