import type { Goal, RoutineCompletion } from "./types";
import { format, subDays, parseISO, differenceInCalendarDays } from "date-fns";

export type RoutineStats = {
  currentStreak: number;
  longestStreak: number;
  thisWeekDone: number;
  weeklyTarget: number;
  totalDone: number;
};

export function getRoutineStats(goal: Goal): RoutineStats | null {
  if (!goal.routineConfig) return null;
  const cfg = goal.routineConfig;
  const completions = (cfg.completions ?? []).filter((c) => c.completed);
  const sortedDates = [...completions]
    .map((c) => c.date)
    .sort((a, b) => (a < b ? 1 : -1)); // newest first

  // Current streak: count back from today
  const today = format(new Date(), "yyyy-MM-dd");
  let currentStreak = 0;
  let cursor = new Date();
  if (cfg.frequency === "daily") {
    while (true) {
      const d = format(cursor, "yyyy-MM-dd");
      if (sortedDates.includes(d)) {
        currentStreak += 1;
        cursor = subDays(cursor, 1);
      } else if (d === today && !sortedDates.includes(today)) {
        // Today not yet done — keep counting from yesterday
        cursor = subDays(cursor, 1);
      } else {
        break;
      }
    }
  } else {
    // weekly/custom — streak counts consecutive weeks meeting target
    const target = cfg.timesPerWeek ?? 1;
    const dates = new Set(sortedDates);
    let weeksBack = 0;
    while (true) {
      const monday = startOfIsoWeek(subDays(new Date(), weeksBack * 7));
      let countInWeek = 0;
      for (let d = 0; d < 7; d++) {
        const dayStr = format(subDays(monday, -d), "yyyy-MM-dd");
        if (dates.has(dayStr)) countInWeek++;
      }
      if (countInWeek >= target) {
        currentStreak += 1;
        weeksBack += 1;
      } else if (weeksBack === 0) {
        weeksBack += 1; // give the current week some grace
      } else {
        break;
      }
    }
  }

  // Longest streak: longest run of consecutive days (works approximate for daily)
  let longestStreak = 0;
  let run = 0;
  const sortedAsc = [...sortedDates].reverse();
  for (let i = 0; i < sortedAsc.length; i++) {
    if (i === 0) {
      run = 1;
    } else {
      const prev = parseISO(sortedAsc[i - 1]);
      const curr = parseISO(sortedAsc[i]);
      if (differenceInCalendarDays(curr, prev) === 1) {
        run += 1;
      } else {
        run = 1;
      }
    }
    if (run > longestStreak) longestStreak = run;
  }

  // This week
  const monday = startOfIsoWeek(new Date());
  let thisWeekDone = 0;
  for (let d = 0; d < 7; d++) {
    const dayStr = format(subDays(monday, -d), "yyyy-MM-dd");
    if (sortedDates.includes(dayStr)) thisWeekDone++;
  }

  const weeklyTarget =
    cfg.frequency === "daily" ? 7 : cfg.frequency === "custom" ? (cfg.customDays?.length ?? 1) : (cfg.timesPerWeek ?? 1);

  return {
    currentStreak,
    longestStreak,
    thisWeekDone,
    weeklyTarget,
    totalDone: completions.length,
  };
}

export function startOfIsoWeek(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1; // Monday is start
  const monday = new Date(d);
  monday.setDate(d.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export function buildHeatmapMatrix(
  completions: RoutineCompletion[],
  weeks = 12,
): Array<Array<{ date: string; done: boolean }>> {
  const today = new Date();
  const monday = startOfIsoWeek(today);
  const start = subDays(monday, (weeks - 1) * 7);
  const doneSet = new Set(completions.filter((c) => c.completed).map((c) => c.date));

  const matrix: Array<Array<{ date: string; done: boolean }>> = [];
  for (let w = 0; w < weeks; w++) {
    const week: Array<{ date: string; done: boolean }> = [];
    for (let d = 0; d < 7; d++) {
      const dayDate = subDays(start, -(w * 7 + d));
      const dateStr = format(dayDate, "yyyy-MM-dd");
      week.push({ date: dateStr, done: doneSet.has(dateStr) });
    }
    matrix.push(week);
  }
  return matrix;
}
