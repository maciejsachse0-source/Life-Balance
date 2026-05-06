"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const lastView = useStore((s) => s.settings.lastCalendarView);
  const setLastView = useStore((s) => s.setLastCalendarView);

  // Default redirect /calendar -> last remembered view (initial: week)
  useEffect(() => {
    if (pathname === "/calendar") router.replace(`/calendar/${lastView}`);
  }, [pathname, lastView, router]);

  const cur = pathname.split("/")[2] ?? lastView;

  return (
    <div className="pb-20">
      <header className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Kalendarz</h1>
          <nav className="flex bg-neutral-100 rounded-lg p-0.5 text-sm">
            {(["month", "week", "day"] as const).map((v) => (
              <Link
                key={v}
                href={`/calendar/${v}`}
                onClick={() => setLastView(v)}
                className={`px-3 py-1.5 rounded-md transition-colors ${
                  cur === v ? "bg-white shadow-sm font-medium" : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {v === "month" ? "Miesiąc" : v === "week" ? "Tydzień" : "Dzień"}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <BottomNav />
    </div>
  );
}
