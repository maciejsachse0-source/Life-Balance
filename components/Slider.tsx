"use client";

import { cn } from "@/lib/utils";

type Props = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
};

export function Slider({ value, min = 0, max = 100, step = 0.5, onChange, className }: Props) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn("ui-slider", className)}
    />
  );
}
