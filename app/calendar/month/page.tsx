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

  // Build pillar duration per dayOfWeek (template-based proportions)
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

  return (
    <main className="max-w-6xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCursor((c) => subMonths(c, 1))}
          className="p-1.5 hover:bg-neutral-100 rounded"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-medium">{format(cursor, "LLLL yyyy", { locale: pl })}</div>
        <button
          onClick={() => setCursor((c) => addMonths(c, 1))}
          className="p-1.5 hover:bg-neutral-100 rounded"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs text-center text-neutral-500 mb-1">
        {["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d) => {
          const inMonth = isSameMonth(d, cursor);
          const dow = getDay(d) as DayOfWeek; // 0..6 Sun-Sat
          const totalMin = totalDayMin(dow);
          const isToday = format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
          return (
            <div
              key={d.toISOString()}
              className={`bg-white border rounded-md min-h-[80px] p-1.5 ${
                inMonth ? "border-neutral-200" : "border-neutral-100 bg-neutral-50/50"
              } ${isToday ? "ring-2 ring-indigo-500" : ""}`}
            >
              <div className={`text-xs font-medium mb-1 ${inMonth ? "text-neutral-800" : "text-neutral-400"}`}>
                {format(d, "d")}
              </div>
              {inMonth && totalMin > 0 ? (
                <div className="flex h-1.5 rounded overflow-hidden">
                  {pillars.map((p) => {
                    const m = pillarMin(dow, p.id);
                    if (!m) return null;
                    const pct = (m / totalMin) * 100;
                    return (
                      <div
                        key={p.id}
                        style={{ width: `${pct}%`, backgroundColor: p.color }}
                        title={`${p.name}: ${(m / 60).toFixed(1)}h`}
                      />
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </main>
  );
}
