"use client";

import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface ParamSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  className?: string;
}

export function ParamSlider({
  label,
  value,
  min,
  max,
  step = 0.25,
  unit = "",
  onChange,
  className,
}: ParamSliderProps) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {typeof value === "number" && value % 1 !== 0
            ? value.toFixed(2)
            : value}
          {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(vals) => {
          const v = Array.isArray(vals) ? vals[0] : vals;
          if (typeof v === "number") onChange(v);
        }}
        className="w-full"
      />
    </div>
  );
}
