// Monthly balance calculations — see CLAUDE.md section 8

import type { AppState, Slot, SlotCompletion, Pillar } from "./types";
import { computeAllocation } from "./utils";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  differenceInCalendarDays,
  isWithinInterval,
} from "date-fns";

export type PillarBalance = {
  pillarId: string;
  expectedH: number;
  actualH: number;
  balance: number;
  percent: number;
  level: "calm" | "soft" | "medium" | "strong";
};

export const computePillarBalances = (state: AppState, today = new Date()): PillarBalance[] => {
  const allocation = computeAllocation(state.layers);
  const monthStart = startOfMonth(today);
  const monthEnd = endOfMonth(today);
  const totalDays = differenceInCalendarDays(monthEnd, monthStart) + 1;
  const elapsedDays = Math.min(totalDays, differenceInCalendarDays(today, monthStart) + 1);
  const slotsByMap = new Map<string, Slot>();
  for (const s of state.calendar.template.slots) slotsByMap.set(s.id, s);

  const completionsThisMonth: SlotCompletion[] = state.slotCompletions.filter((c) => {
    const d = new Date(c.date);
    return isWithinInterval(d, { start: monthStart, end: monthEnd }) && c.completed;
  });

  const balances: PillarBalance[] = state.layers.pillars.map((p) => {
    const monthlyNorm = (allocation.perPillar[p.id]?.hoursPerWeek ?? 0) * 4.33;
    const expectedH = monthlyNorm * (elapsedDays / totalDays);
    let actualMin = 0;
    for (const c of completionsThisMonth) {
      const slot = slotsByMap.get(c.slotId);
      if (slot && slot.pillarId === p.id) actualMin += slot.durationMinutes;
    }
    const actualH = actualMin / 60;
    const balance = actualH - expectedH;
    const percent = expectedH > 0 ? (actualH / expectedH) * 100 : 100;
    return {
      pillarId: p.id,
      expectedH,
      actualH,
      balance,
      percent,
      level: getInteractionLevel(percent),
    };
  });

  return balances;
};

export const computePillarBalancesWeekly = (
  state: AppState,
  today = new Date(),
): PillarBalance[] => {
  const allocation = computeAllocation(state.layers);
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const totalDays = 7;
  const elapsedDays = Math.min(totalDays, differenceInCalendarDays(today, weekStart) + 1);

  const slotsByMap = new Map<string, Slot>();
  for (const s of state.calendar.template.slots) slotsByMap.set(s.id, s);

  const completionsThisWeek: SlotCompletion[] = state.slotCompletions.filter((c) => {
    const d = new Date(c.date);
    return isWithinInterval(d, { start: weekStart, end: weekEnd }) && c.completed;
  });

  return state.layers.pillars.map((p) => {
    const weeklyNorm = allocation.perPillar[p.id]?.hoursPerWeek ?? 0;
    const expectedH = weeklyNorm * (elapsedDays / totalDays);
    let actualMin = 0;
    for (const c of completionsThisWeek) {
      const slot = slotsByMap.get(c.slotId);
      if (slot && slot.pillarId === p.id) actualMin += slot.durationMinutes;
    }
    const actualH = actualMin / 60;
    const balance = actualH - expectedH;
    const percent = expectedH > 0 ? (actualH / expectedH) * 100 : 100;
    return {
      pillarId: p.id,
      expectedH,
      actualH,
      balance,
      percent,
      level: getInteractionLevel(percent),
    };
  });
};

const getInteractionLevel = (percent: number): PillarBalance["level"] => {
  if (percent >= 95 && percent <= 110) return "calm";
  if ((percent >= 85 && percent < 95) || (percent > 110 && percent <= 115)) return "soft";
  if ((percent >= 75 && percent < 85) || (percent > 115 && percent <= 125)) return "medium";
  return "strong";
};

export const getPillar = (state: AppState, id: string): Pillar | undefined =>
  state.layers.pillars.find((p) => p.id === id);
