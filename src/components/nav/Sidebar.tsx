"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, FlaskConical, List, TrendingUp, Radio, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/",          label: "Dashboard",  icon: TrendingUp },
  { href: "/backtest",  label: "Backtest",   icon: FlaskConical },
  { href: "/trades",    label: "Trades",     icon: List },
  { href: "/analytics", label: "Analytics",  icon: BarChart2 },
  { href: "/live",      label: "Live",       icon: Radio },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 border-r border-border bg-card h-full">
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[hsl(217_91%_60%/0.15)]">
          <Zap size={16} className="text-[hsl(217,91%,60%)]" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground tracking-tight">LVN Scalper</p>
          <p className="text-[10px] text-muted-foreground">Trading Platform</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 px-3 py-4 flex-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-[hsl(217_91%_60%/0.12)] text-[hsl(217,91%,60%)] border border-[hsl(217_91%_60%/0.2)]"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              <Icon size={16} className={cn(active && "text-[hsl(217,91%,60%)]")} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Version badge */}
      <div className="px-5 py-4 border-t border-border">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-secondary text-[10px] font-bold text-muted-foreground tracking-wider uppercase">
          v2.0
        </span>
      </div>
    </aside>
  );
}
