import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  width?: "narrow" | "default" | "wide" | "full";
};

const widthMap = {
  narrow: "max-w-2xl",            // ~672px — focused single-column (forms, reading)
  default: "max-w-screen-xl",     // ~1280px — most pages
  wide: "max-w-screen-2xl",       // ~1536px — grid-heavy (stats, calculator)
  full: "max-w-none",             // edge-to-edge (calendar, fullscreen tools)
};

export function AppShell({ children, className, width = "default" }: Props) {
  return (
    <div className="app-gradient">
      <main
        className={cn(
          "w-full mx-auto pl-20 sm:pl-24 pr-4 sm:pr-6 py-6 sm:py-10 space-y-5",
          widthMap[width],
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}
