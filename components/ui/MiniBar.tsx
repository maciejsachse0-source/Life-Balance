import { cn } from "@/lib/utils";

type Accent = "coral" | "peach" | "lavender" | "neutral";

const accentToVar: Record<Accent, string> = {
  coral: "var(--color-accent-coral)",
  peach: "var(--color-accent-peach)",
  lavender: "var(--color-accent-lavender)",
  neutral: "#a3a3a3",
};

type Props = {
  values: number[];
  max?: number;
  accent?: Accent;
  color?: string;
  height?: number;
  className?: string;
};

export function MiniBar({
  values,
  max,
  accent = "coral",
  color,
  height = 28,
  className,
}: Props) {
  const upper = max ?? Math.max(1, ...values);
  const fg = color ?? accentToVar[accent];
  return (
    <div
      className={cn("flex items-end gap-1", className)}
      style={{ height }}
      aria-hidden
    >
      {values.map((v, i) => {
        const pct = Math.min(100, Math.max(8, (v / upper) * 100));
        return (
          <span
            key={i}
            className="block rounded-[2px]"
            style={{
              width: 4,
              height: `${pct}%`,
              backgroundColor: fg,
              opacity: 0.55 + (pct / 100) * 0.45,
            }}
          />
        );
      })}
    </div>
  );
}
