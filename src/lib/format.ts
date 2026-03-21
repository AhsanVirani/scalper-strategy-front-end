/** Shared formatting helpers — all NaN/Infinity safe */

function safe(v: number, fallback = 0): number {
  return isFinite(v) && !isNaN(v) ? v : fallback;
}

export const fmt = {
  dollars: (v: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(safe(v)),

  /** Pass a percentage value directly (already ×100) */
  pct: (v: number, decimals = 1) => {
    const n = safe(v);
    return `${n >= 0 ? "+" : ""}${n.toFixed(decimals)}%`;
  },

  pctAbs: (v: number, decimals = 1) => `${safe(v).toFixed(decimals)}%`,

  r: (v: number) => {
    const n = safe(v);
    return `${n >= 0 ? "+" : ""}${n.toFixed(2)}R`;
  },

  num: (v: number, decimals = 2) => safe(v).toFixed(decimals),

  /** ISO string → "HH:MM" in ET */
  time: (iso: string) =>
    new Date(iso).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/New_York",
    }),

  /** ISO string → "Mar 12  14:35" in ET */
  dateTime: (iso: string) => {
    const d = new Date(iso);
    const date = d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" });
    const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "America/New_York" });
    return `${date}  ${time}`;
  },

  /** ISO string → "Mar 12" */
  dateShort: (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      timeZone: "America/New_York",
    }),

  /** ISO string → "Monday, March 12, 2026" */
  dateGroup: (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    }),

  /** ISO string → "Mar 12, 2026" */
  dateLong: (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "America/New_York",
    }),
};
