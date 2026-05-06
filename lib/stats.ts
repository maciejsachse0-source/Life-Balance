import type { AppState, Pillar, Slot } from "./types";
import { computeAllocation } from "./utils";
import {
  format,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  subWeeks,
  subMonths,
  isWithinInterval,
  parseISO,
} from "date-fns";

export type WeekStat = {
  weekStart: Date;
  pillarPercents: Record<string, number>; // % of weekly target
};

export type MonthStat = {
  month: Date;
  pillarPercents: Record<string, number>;
};

export type ConsistencyData = {
  months: Date[]; // 12 months
  pillarSeries: Record<string, number[]>; // h/week per month for each pillar
};

export type GoalLifecycleStat = {
  goalId: string;
  title: string;
  character: string;
  status: string;
  pillarColor: string;
  startedAt: string;
  endedAt?: string;
  progress: number;
};

const slotById = (state: AppState): Map<string, Slot> => {
  const map = new Map<string, Slot>();
  for (const s of state.calendar.template.slots) map.set(s.id, s);
  return map;
};

export function computeWeeklyOverview(state: AppState, weeks = 12): WeekStat[] {
  const allocation = computeAllocation(state.layers);
  const slotsMap = slotById(state);
  const today = new Date();
  const result: WeekStat[] = [];
  for (let w = weeks - 1; w >= 0; w--) {
    const weekStart = startOfWeek(subWeeks(today, w), { weekStartsOn: 1 });
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    const minByPillar: Record<string, number> = {};
    for (const c of state.slotCompletions) {
      if (!c.completed) continue;
      const d = parseISO(c.date);
      if (!isWithinInterval(d, { start: weekStart, end: weekEnd })) continue;
      const slot = slotsMap.get(c.slotId);
      if (!slot) continue;
      minByPillar[slot.pillarId] = (minByPillar[slot.pillarId] ?? 0) + slot.durationMinutes;
    }
    const pillarPercents: Record<string, number> = {};
    for (const p of state.layers.pillars) {
      const targetH = allocation.perPillar[p.id]?.hoursPerWeek ?? 0;
      const actualH = (minByPillar[p.id] ?? 0) / 60;
      pillarPercents[p.id] = targetH > 0 ? (actualH / targetH) * 100 : 0;
    }
    result.push({ weekStart, pillarPercents });
  }
  return result;
}

export function computeMonthlyTrace(state: AppState, months = 12): MonthStat[] {
  const allocation = computeAllocation(state.layers);
  const slotsMap = slotById(state);
  const today = new Date();
  const result: MonthStat[] = [];
  for (let m = months - 1; m >= 0; m--) {
    const month = startOfMonth(subMonths(today, m));
    const monthEnd = endOfMonth(month);
    const minByPillar: Record<string, number> = {};
    for (const c of state.slotCompletions) {
      if (!c.completed) continue;
      const d = parseISO(c.date);
      if (!isWithinInterval(d, { start: month, end: monthEnd })) continue;
      const slot = slotsMap.get(c.slotId);
      if (!slot) continue;
      minByPillar[slot.pillarId] = (minByPillar[slot.pillarId] ?? 0) + slot.durationMinutes;
    }
    const pillarPercents: Record<string, number> = {};
    for (const p of state.layers.pillars) {
      const targetH = (allocation.perPillar[p.id]?.hoursPerWeek ?? 0) * 4.33;
      const actualH = (minByPillar[p.id] ?? 0) / 60;
      pillarPercents[p.id] = targetH > 0 ? (actualH / targetH) * 100 : 0;
    }
    result.push({ month, pillarPercents });
  }
  return result;
}

export function computeConsistency(state: AppState, months = 12): ConsistencyData {
  const slotsMap = slotById(state);
  const today = new Date();
  const monthsArr: Date[] = [];
  const pillarSeries: Record<string, number[]> = Object.fromEntries(
    state.layers.pillars.map((p) => [p.id, []]),
  );
  for (let m = months - 1; m >= 0; m--) {
    const month = startOfMonth(subMonths(today, m));
    const monthEnd = endOfMonth(month);
    monthsArr.push(month);
    const minByPillar: Record<string, number> = {};
    for (const c of state.slotCompletions) {
      if (!c.completed) continue;
      const d = parseISO(c.date);
      if (!isWithinInterval(d, { start: month, end: monthEnd })) continue;
      const slot = slotsMap.get(c.slotId);
      if (!slot) continue;
      minByPillar[slot.pillarId] = (minByPillar[slot.pillarId] ?? 0) + slot.durationMinutes;
    }
    for (const p of state.layers.pillars) {
      const monthlyH = (minByPillar[p.id] ?? 0) / 60;
      const weekly = monthlyH / 4.33;
      pillarSeries[p.id].push(Number(weekly.toFixed(2)));
    }
  }
  return { months: monthsArr, pillarSeries };
}

export function computeGoalLifecycle(state: AppState): GoalLifecycleStat[] {
  const pillarMap = new Map<string, Pillar>();
  for (const p of state.layers.pillars) pillarMap.set(p.id, p);
  return state.goals.map((g) => {
    const pillarColor = pillarMap.get(g.pillarId)?.color ?? "#9ca3af";
    let progress = 0;
    if (g.character === "Project" || g.character === "Mixed") {
      const tasks = (g.milestones ?? []).flatMap((m) => m.tasks ?? []);
      progress = tasks.length > 0
        ? (tasks.filter((t) => t.status === "Done").length / tasks.length) * 100
        : 0;
    } else if (g.character === "Routine") {
      const total = g.routineConfig?.completions.length ?? 0;
      const done = g.routineConfig?.completions.filter((c) => c.completed).length ?? 0;
      progress = total > 0 ? (done / total) * 100 : 0;
    }
    return {
      goalId: g.id,
      title: g.title,
      character: g.character,
      status: g.status,
      pillarColor,
      startedAt: g.createdAt,
      endedAt: g.completedAt,
      progress,
    };
  });
}

export function colorForPercent(percent: number): string {
  if (percent === 0) return "#f4f4f5";
  if (percent < 60) return "#ef4444"; // red
  if (percent < 75) return "#facc15"; // yellow
  if (percent < 90) return "#a3e635"; // light green
  if (percent <= 110) return "#22c55e"; // green
  if (percent <= 130) return "#15803d"; // dark green
  return "#ea580c"; // orange (overload)
}

