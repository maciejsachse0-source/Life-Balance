"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { SideNav } from "@/components/SideNav";
import { useStore } from "@/lib/store";
import { useEffect } from "react";

export default function CalendarLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const lastView = useStore((s) => s.settings.lastCalendarView);
  const setLastView = useStore((s) => s.setLastCalendarView);

  useEffect(() => {
    if (pathname === "/calendar") router.replace(`/calendar/${lastView}`);
  }, [pathname, lastView, router]);

  const cur = pathname.split("/")[2] ?? lastView;

  return (
    <div className="app-gradient">
      <header className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-neutral-200">
        <div className="pl-20 sm:pl-24 pr-4 sm:pr-6 py-3 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="stat-label">Kalendarz</div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 leading-tight capitalize">
              {cur === "month" ? "Miesiąc" : cur === "week" ? "Tydzień" : "Dzień"}
            </h1>
          </div>
          <nav className="flex bg-white border border-neutral-200 rounded-full p-0.5 text-sm shrink-0">
            {(["month", "week", "day"] as const).map((v) => (
              <Link
                key={v}
                href={`/calendar/${v}`}
                onClick={() => setLastView(v)}
                className={`px-3 py-1 rounded-full transition-colors ${
                  cur === v
                    ? "bg-neutral-900 text-white font-medium"
                    : "text-neutral-600 hover:text-neutral-900"
                }`}
              >
                {v === "month" ? "Miesiąc" : v === "week" ? "Tydzień" : "Dzień"}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <div className="pl-20 sm:pl-24">{children}</div>
      <SideNav />
    </div>
  );
}
