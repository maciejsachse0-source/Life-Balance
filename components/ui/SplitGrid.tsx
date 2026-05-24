import { cn } from "@/lib/utils";

type SplitGridProps = {
  children: React.ReactNode;
  cols?: 2 | 3;
  gap?: 4 | 5 | 6;
  className?: string;
};

/**
 * Responsive multi-column grid for organizing cards horizontally on wide screens.
 * Single column on mobile, splits into N columns at lg (1024px+).
 *
 * For asymmetric splits (e.g. 7/5), use raw Tailwind:
 *   <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
 *     <div className="lg:col-span-7 space-y-5">…</div>
 *     <div className="lg:col-span-5 space-y-5">…</div>
 *   </div>
 */
export function SplitGrid({
  children,
  cols = 2,
  gap = 5,
  className,
}: SplitGridProps) {
  const colsClass = cols === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  const gapClass = gap === 4 ? "gap-4" : gap === 6 ? "gap-6" : "gap-5";
  return (
    <div className={cn("grid grid-cols-1", colsClass, gapClass, className)}>
      {children}
    </div>
  );
}

type ColumnProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Vertical card stack within a grid column. Wraps children with space-y-5
 * matching the AppShell rhythm.
 */
export function Column({ children, className }: ColumnProps) {
  return <div className={cn("space-y-5", className)}>{children}</div>;
}
