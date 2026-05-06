"use client";

import type { Goal, Milestone } from "@/lib/types";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";
import { CalendarClock } from "lucide-react";

type Props = {
  goal: Goal;
  color: string;
};

export function RoadmapView({ goal, color }: Props) {
  const ms = goal.milestones ?? [];
  const today = new Date();

  // Determine date range — from earliest createdAt or today, to latest deadline
  const candidateDates: Date[] = [today];
  if (goal.deadline) candidateDates.push(parseISO(goal.deadline));
  for (const m of ms) {
    if (m.deadline) candidateDates.push(parseISO(m.deadline));
  }
  const startDate = today;
  const endDate = new Date(
    Math.max(...candidateDates.map((d) => d.getTime())),
  );
  const totalDays = Math.max(1, differenceInCalendarDays(endDate, startDate));

  if (ms.length === 0) {
    return (
      <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-6 text-center text-sm text-neutral-500">
        Brak milestonów — dodaj pierwszy w widoku drzewa.
      </div>
    );
  }

  const milestoneProgress = (m: Milestone): number => {
    const tasks = m.tasks ?? [];
    if (tasks.length === 0) return 0;
    return (tasks.filter((t) => t.status === "Done").length / tasks.length) * 100;
  };

  const sortedMs = [...ms].sort((a, b) => {
    const ad = a.deadline ? parseISO(a.deadline).getTime() : Infinity;
    const bd = b.deadline ? parseISO(b.deadline).getTime() : Infinity;
    return ad - bd;
  });

  return (
    <div className="bg-white border border-neutral-200 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4 text-sm text-neutral-500">
        <CalendarClock size={14} />
        <span>
          {format(startDate, "d MMM", { locale: pl })} →{" "}
          {format(endDate, "d MMM yyyy", { locale: pl })} ({totalDays} dni)
        </span>
      </div>

      <div className="relative w-full h-[140px] border-l border-b border-neutral-200">
        {/* Month gridlines */}
        {Array.from({ length: 5 }, (_, i) => i * 25).map((pct) => (
          <div
            key={pct}
            className="absolute top-0 bottom-0 border-l border-dashed border-neutral-100"
            style={{ left: `${pct}%` }}
          />
        ))}

        {/* Today marker */}
        <div className="absolute top-0 bottom-0 w-px bg-indigo-500" style={{ left: "0%" }}>
          <span className="absolute -top-5 -translate-x-1/2 text-[10px] text-indigo-600 bg-white px-1">
            dziś
          </span>
        </div>

        {/* Milestones */}
        {sortedMs.map((m, i) => {
          const dl = m.deadline ? parseISO(m.deadline) : endDate;
          const days = differenceInCalendarDays(dl, startDate);
          const left = (days / totalDays) * 100;
          const prog = milestoneProgress(m);
          const top = 12 + (i % 3) * 38; // stagger vertically
          return (
            <div
              key={m.id}
              className="absolute -translate-x-1/2"
              style={{ left: `${Math.max(0, Math.min(100, left))}%`, top }}
            >
              <div
                className="px-2.5 py-1.5 rounded-md text-[11px] shadow-sm border min-w-[120px] max-w-[180px]"
                style={{
                  backgroundColor: `${color}15`,
                  borderColor: color,
                  color: "#262626",
                }}
              >
                <div className="font-medium leading-tight truncate">{m.title}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 h-1 bg-white/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${prog}%`, backgroundColor: color }}
                    />
                  </div>
                  <span className="text-[9px] text-neutral-500 tabular-nums">
                    {Math.round(prog)}%
                  </span>
                </div>
                {m.deadline ? (
                  <div className="text-[9px] text-neutral-500 mt-0.5">
                    {format(parseISO(m.deadline), "d MMM", { locale: pl })}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-neutral-400 mt-3">
        Kafelki ułożone wg deadline'u. Brak deadline'u = na końcu osi.
      </p>
    </div>
  );
}
