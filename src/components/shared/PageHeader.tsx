import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, right, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between px-4 pt-5 pb-2", className)}>
      <div>
        <h1 className="text-xs font-bold tracking-[0.18em] uppercase text-muted-foreground">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">{subtitle}</p>
        )}
      </div>
      {right && <div>{right}</div>}
    </div>
  );
}
