"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart2, FlaskConical, List, TrendingUp, Radio } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: TrendingUp },
  { href: "/backtest", label: "Backtest", icon: FlaskConical },
  { href: "/trades", label: "Trades", icon: List },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/live", label: "Live", icon: Radio },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden flex-shrink-0 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 min-w-[56px] py-1 px-2 rounded-lg transition-colors",
                active
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon
                size={20}
                className={cn(
                  "transition-colors",
                  active && "text-[hsl(152,100%,38%)]"
                )}
              />
              <span className={cn("text-[10px] font-medium", active && "text-[hsl(152,100%,38%)]")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
