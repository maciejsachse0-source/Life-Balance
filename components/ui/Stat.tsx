import { cn } from "@/lib/utils";

type HeroProps = {
  label?: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  className?: string;
};

export function StatHero({ label, value, unit, className }: HeroProps) {
  return (
    <div className={cn("mb-6", className)}>
      {label ? <div className="stat-label mb-2">{label}</div> : null}
      <div className="flex items-baseline gap-2">
        <span className="text-6xl sm:text-7xl font-bold tracking-tight text-neutral-900 leading-none">
          {value}
        </span>
        {unit ? (
          <span className="text-2xl text-neutral-500 font-medium">{unit}</span>
        ) : null}
      </div>
    </div>
  );
}

type StatProps = {
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  dotColor?: string;
  viz?: React.ReactNode;
  className?: string;
};

export function Stat({ label, value, unit, dotColor, viz, className }: StatProps) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="stat-label mb-1.5 flex items-center">
        {dotColor ? (
          <span
            className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
            style={{ backgroundColor: dotColor }}
          />
        ) : null}
        <span className="truncate">{label}</span>
      </div>
      <div className="flex items-end justify-between gap-3">
        <div className="flex items-baseline gap-1 min-w-0">
          <span className="text-3xl font-bold tracking-tight text-neutral-900 truncate leading-none">
            {value}
          </span>
          {unit ? (
            <span className="text-sm text-neutral-500 font-medium">{unit}</span>
          ) : null}
        </div>
        {viz ? <div className="shrink-0">{viz}</div> : null}
      </div>
    </div>
  );
}

type GridProps = {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3;
};

export function StatGrid({ children, className, cols = 2 }: GridProps) {
  return (
    <div
      className={cn(
        "grid gap-x-8 gap-y-6",
        cols === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}
