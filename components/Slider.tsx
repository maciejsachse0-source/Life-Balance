"use client";

import { cn } from "@/lib/utils";

type Props = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  color?: string;
  className?: string;
};

export function Slider({ value, min = 0, max = 100, step = 0.5, onChange, color, className }: Props) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={cn(
        "w-full h-2 rounded-lg appearance-none cursor-pointer accent-indigo-500 bg-neutral-200",
        className,
      )}
      style={color ? ({ accentColor: color } as React.CSSProperties) : undefined}
    />
  );
}
