// Lightweight activity metrics for the dashboard monitor strip.
// Computes today / this-week / streak / 7-day completion counts based on
// slot completions + template schedule.

import { addDays, format, isAfter, isSameDay, parseISO, subDays } from "date-fns";
import type { AppState, DayOfWeek, Slot } from "./types";
import { startOfIsoWeek } from "./routine";

export type ActivityStats = {
  todayCompleted: number;
  todayScheduled: number;
  weekCompletedH: number;
  weekScheduledH: number;
  weekPct: number;
  streakDays: number;
  /** 7 entries, oldest first; each = number of completed slots on that day */
  dailyCompletions: number[];
  /** parallel labels (e.g. "Pn", "Wt", ...) for the 7 bars, oldest first */
  dailyLabels: string[];
  thoughtsThisWeek: number;
  hasAnyHistory: boolean;
};

const SHORT_DAY = ["Nd", "Pn", "Wt", "Śr", "Cz", "Pt", "So"];

export function computeActivityStats(
  state: AppState,
  today: Date = new Date(),
): ActivityStats {
  const slots = state.calendar.template.slots;
  const completions = state.slotCompletions;

  const todayStr = format(today, "yyyy-MM-dd");
  const todayDow = today.getDay() as DayOfWeek;

  // Today
  const todayScheduledSlots: Slot[] = slots.filter((s) => s.dayOfWeek === todayDow);
  const todayScheduled = todayScheduledSlots.length;
  const todayCompleted = completions.filter(
    (c) => c.date === todayStr && c.completed,
  ).length;

  // This ISO week (Mon → today)
  const monday = startOfIsoWeek(today);
  const slotsByDow = new Map<DayOfWeek, Slot[]>();
  for (const s of slots) {
    const arr = slotsByDow.get(s.dayOfWeek) ?? [];
    arr.push(s);
    slotsByDow.set(s.dayOfWeek, arr);
  }

  let weekScheduledMin = 0;
  for (let i = 0; i <= 6; i++) {
    const d = addDays(monday, i);
    if (isAfter(d, today) && !isSameDay(d, today)) break;
    const dow = d.getDay() as DayOfWeek;
    for (const s of slotsByDow.get(dow) ?? []) {
      weekScheduledMin += s.durationMinutes;
    }
  }

  const slotMap = new Map(slots.map((s) => [s.id, s]));
  let weekCompletedMin = 0;
  const completedDates = new Set<string>();
  for (const c of completions) {
    if (!c.completed) continue;
    const d = parseISO(c.date);
    if (d >= monday && d <= today) {
      const slot = slotMap.get(c.slotId);
      if (slot) weekCompletedMin += slot.durationMinutes;
      completedDates.add(c.date);
    }
  }

  const weekCompletedH = weekCompletedMin / 60;
  const weekScheduledH = weekScheduledMin / 60;
  const weekPct =
    weekScheduledH > 0 ? Math.round((weekCompletedH / weekScheduledH) * 100) : 0;

  // 7-day completion bars (oldest first)
  const dailyCompletions: number[] = [];
  const dailyLabels: string[] = [];
  const allCompletedByDay = new Map<string, number>();
  for (const c of completions) {
    if (!c.completed) continue;
    allCompletedByDay.set(c.date, (allCompletedByDay.get(c.date) ?? 0) + 1);
  }
  for (let i = 6; i >= 0; i--) {
    const d = subDays(today, i);
    const ds = format(d, "yyyy-MM-dd");
    dailyCompletions.push(allCompletedByDay.get(ds) ?? 0);
    dailyLabels.push(SHORT_DAY[d.getDay()]);
  }

  // Streak: count consecutive days back from today with ≥1 completion.
  // If today has nothing yet but yesterday did, we still count from yesterday
  // (don't punish a fresh morning).
  let streakDays = 0;
  let cursor = today;
  if (!allCompletedByDay.has(format(cursor, "yyyy-MM-dd"))) {
    cursor = subDays(cursor, 1);
  }
  while (allCompletedByDay.has(format(cursor, "yyyy-MM-dd"))) {
    streakDays += 1;
    cursor = subDays(cursor, 1);
  }

  // Thoughts this week
  const thoughtsThisWeek = state.thoughts.filter((t) => {
    const d = parseISO(t.createdAt);
    return d >= monday && d <= today;
  }).length;

  const hasAnyHistory =
    completions.some((c) => c.completed) || state.thoughts.length > 0;

  return {
    todayCompleted,
    todayScheduled,
    weekCompletedH,
    weekScheduledH,
    weekPct,
    streakDays,
    dailyCompletions,
    dailyLabels,
    thoughtsThisWeek,
    hasAnyHistory,
  };
}
