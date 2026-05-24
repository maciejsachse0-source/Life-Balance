"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  isWeekend,
} from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DayOfWeek, Slot } from "@/lib/types";

export default function MonthCalendarPage() {
  const hydrated = useHydrated();
  const slots = useStore((s) => s.calendar.template.slots);
  const pillars = useStore((s) => s.layers.pillars);
  const [cursor, setCursor] = useState(new Date());

  if (!hydrated) return <Spinner />;

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const slotsByDay = new Map<DayOfWeek, Slot[]>();
  for (let d = 0 as DayOfWeek; d < 7; d = ((d + 1) as DayOfWeek)) {
    slotsByDay.set(d, slots.filter((s) => s.dayOfWeek === d));
    if (d === 6) break;
  }

  const totalDayMin = (day: DayOfWeek) =>
    (slotsByDay.get(day) ?? []).reduce((acc, s) => acc + s.durationMinutes, 0);
  const pillarMin = (day: DayOfWeek, pillarId: string) =>
    (slotsByDay.get(day) ?? [])
      .filter((s) => s.pillarId === pillarId)
      .reduce((acc, s) => acc + s.durationMinutes, 0);

  const formatHours = (min: number) => {
    if (min < 60) return `${min}m`;
    const h = min / 60;
    return Number.isInteger(h) ? `${h}h` : `${h.toFixed(1)}h`;
  };

  const isCurrentMonth = isSameMonth(cursor, new Date());

  return (
    <main className="px-4 sm:px-6 py-5">
      <div className="flex items-center justify-between mb-5 gap-3">
        <button
          onClick={() => setCursor((c) => subMonths(c, 1))}
          aria-label="Poprzedni miesiąc"
          className="p-2 hover:bg-white/70 rounded-full transition-colors text-neutral-700"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-baseline gap-3 min-w-0">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 capitalize truncate">
            {format(cursor, "LLLL", { locale: pl })}
          </h2>
          <span className="text-base sm:text-lg text-neutral-400 font-medium tabular-nums">
            {format(cursor, "yyyy")}
          </span>
          {!isCurrentMonth && (
            <button
              onClick={() => setCursor(new Date())}
              className="ml-2 px-3 py-1 rounded-full bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors shrink-0"
            >
              Dziś
            </button>
          )}
        </div>

        <button
          onClick={() => setCursor((c) => addMonths(c, 1))}
          aria-label="Następny miesiąc"
          className="p-2 hover:bg-white/70 rounded-full transition-colors text-neutral-700"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-[10px] uppercase tracking-[0.18em] font-medium text-neutral-500 mb-2">
        {["Pon", "Wt", "Śr", "Czw", "Pt", "Sob", "Nd"].map((d, i) => (
          <div
            key={d}
            className={`text-center ${i >= 5 ? "text-neutral-400" : ""}`}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const inMonth = isSameMonth(d, cursor);
          const dow = getDay(d) as DayOfWeek;
          const totalMin = totalDayMin(dow);
          const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          const weekend = isWeekend(d);

          const shares = pillars
            .map((p) => ({ p, m: pillarMin(dow, p.id) }))
            .filter(({ m }) => m > 0)
            .sort((a, b) => b.m - a.m);

          const topShares = shares.slice(0, 4);
          const restMin = shares.slice(4).reduce((acc, s) => acc + s.m, 0);

          return (
            <div
              key={d.toISOString()}
              className={[
                "rounded-xl min-h-[150px] p-2.5 flex flex-col border transition-shadow",
                inMonth
                  ? weekend
                    ? "bg-white/70 border-neutral-200"
                    : "bg-white border-neutral-200"
                  : "bg-neutral-50/40 border-transparent",
                inMonth ? "hover:shadow-[0_4px_14px_-6px_rgba(50,40,80,0.18)]" : "",
              ].join(" ")}
            >
              <div className="flex items-baseline justify-between mb-2">
                <div
                  className={`flex items-center gap-1.5 text-sm font-semibold ${
                    inMonth ? "text-neutral-900" : "text-neutral-300"
                  }`}
                >
                  {isToday && (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-neutral-900 text-white text-xs">
                      {format(d, "d")}
                    </span>
                  )}
                  {!isToday && <span>{format(d, "d")}</span>}
                </div>
                {inMonth && totalMin > 0 && (
                  <div className="text-[10px] text-neutral-400 tabular-nums">
                    {formatHours(totalMin)}
                  </div>
                )}
              </div>

              {inMonth && totalMin > 0 ? (
                <>
                  <div className="flex h-1.5 rounded-full overflow-hidden mb-2 bg-neutral-100">
                    {shares.map(({ p, m }) => (
                      <div
                        key={p.id}
                        style={{ width: `${(m / totalMin) * 100}%`, backgroundColor: p.color }}
                        title={`${p.name}: ${formatHours(m)} · ${Math.round((m / totalMin) * 100)}%`}
                      />
                    ))}
                  </div>
                  <ul className="space-y-1 mt-0.5">
                    {topShares.map(({ p, m }) => (
                      <li
                        key={p.id}
                        className="flex items-center gap-1.5 text-[11px] leading-tight"
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: p.color }}
                        />
                        <span className="truncate flex-1 text-neutral-700">{p.name}</span>
                        <span className="text-neutral-500 tabular-nums shrink-0">
                          {formatHours(m)}
                        </span>
                        <span className="text-neutral-400 font-medium tabular-nums shrink-0 w-7 text-right">
                          {Math.round((m / totalMin) * 100)}%
                        </span>
                      </li>
                    ))}
                    {shares.length > 4 && (
                      <li className="text-[10px] text-neutral-400 pl-3 tabular-nums">
                        +{shares.length - 4} więcej · {formatHours(restMin)}
                      </li>
                    )}
                  </ul>
                </>
              ) : inMonth ? (
                <div className="text-[10px] text-neutral-300 mt-auto">Brak planu</div>
              ) : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}
