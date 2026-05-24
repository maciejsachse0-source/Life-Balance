import type { AppState, DayShort, RoutineConfig } from "./types";
import { addDays, format } from "date-fns";
import { startOfIsoWeek } from "./routine";

export type RoutineForToday = {
  key: string;
  kind: "goal" | "milestone";
  goalId: string;
  milestoneId?: string;
  pillarId: string;
  pillarColor: string;
  pillarName: string;
  goalTitle: string;
  routineTitle: string;
  cfg: RoutineConfig;
  doneToday: boolean;
  thisWeekDone: number;
  weeklyTarget: number;
  durationMinutes: number;
};

const DAY_INDEX_TO_SHORT: DayShort[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

function isScheduledToday(
  cfg: RoutineConfig,
  doneSet: Set<string>,
  today: Date,
): boolean {
  if (cfg.frequency === "daily") return true;
  if (cfg.frequency === "custom") {
    const dow = (today.getDay() + 6) % 7;
    return cfg.customDays?.includes(DAY_INDEX_TO_SHORT[dow]) ?? false;
  }
  // weekly: still show today if the weekly target isn't met yet
  const target = cfg.timesPerWeek ?? 1;
  const monday = startOfIsoWeek(today);
  let count = 0;
  for (let d = 0; d < 7; d++) {
    const dayStr = format(addDays(monday, d), "yyyy-MM-dd");
    if (doneSet.has(dayStr)) count++;
  }
  return count < target;
}

function computeWeekStats(
  cfg: RoutineConfig,
  today: Date,
): { thisWeekDone: number; weeklyTarget: number } {
  const monday = startOfIsoWeek(today);
  const doneSet = new Set(
    cfg.completions.filter((c) => c.completed).map((c) => c.date),
  );
  let thisWeekDone = 0;
  for (let d = 0; d < 7; d++) {
    const dayStr = format(addDays(monday, d), "yyyy-MM-dd");
    if (doneSet.has(dayStr)) thisWeekDone++;
  }
  const weeklyTarget =
    cfg.frequency === "daily"
      ? 7
      : cfg.frequency === "custom"
        ? (cfg.customDays?.length ?? 1)
        : (cfg.timesPerWeek ?? 1);
  return { thisWeekDone, weeklyTarget };
}

export function getRoutinesForToday(
  state: AppState,
  today: Date = new Date(),
): RoutineForToday[] {
  const todayStr = format(today, "yyyy-MM-dd");
  const pillarMap = new Map(state.layers.pillars.map((p) => [p.id, p]));
  const out: RoutineForToday[] = [];

  for (const goal of state.goals) {
    if (goal.status !== "Active") continue;
    const pillar = pillarMap.get(goal.pillarId);
    if (!pillar) continue;

    if (goal.character === "Routine" && goal.routineConfig) {
      const cfg = goal.routineConfig;
      const doneSet = new Set(
        cfg.completions.filter((c) => c.completed).map((c) => c.date),
      );
      if (!isScheduledToday(cfg, doneSet, today)) continue;
      const { thisWeekDone, weeklyTarget } = computeWeekStats(cfg, today);
      out.push({
        key: `g:${goal.id}`,
        kind: "goal",
        goalId: goal.id,
        pillarId: pillar.id,
        pillarColor: pillar.color,
        pillarName: pillar.name,
        goalTitle: goal.title,
        routineTitle: goal.title,
        cfg,
        doneToday: doneSet.has(todayStr),
        thisWeekDone,
        weeklyTarget,
        durationMinutes: cfg.durationMinutes,
      });
    }

    if (goal.character === "Mixed") {
      for (const m of goal.milestones ?? []) {
        if (m.character !== "Routine" || !m.routineConfig) continue;
        const cfg = m.routineConfig;
        const doneSet = new Set(
          cfg.completions.filter((c) => c.completed).map((c) => c.date),
        );
        if (!isScheduledToday(cfg, doneSet, today)) continue;
        const { thisWeekDone, weeklyTarget } = computeWeekStats(cfg, today);
        out.push({
          key: `m:${goal.id}:${m.id}`,
          kind: "milestone",
          goalId: goal.id,
          milestoneId: m.id,
          pillarId: pillar.id,
          pillarColor: pillar.color,
          pillarName: pillar.name,
          goalTitle: goal.title,
          routineTitle: m.title,
          cfg,
          doneToday: doneSet.has(todayStr),
          thisWeekDone,
          weeklyTarget,
          durationMinutes: cfg.durationMinutes,
        });
      }
    }
  }

  // Undone first, then alphabetical by pillar then routine
  out.sort((a, b) => {
    if (a.doneToday !== b.doneToday) return a.doneToday ? 1 : -1;
    const byPillar = a.pillarName.localeCompare(b.pillarName, "pl");
    if (byPillar !== 0) return byPillar;
    return a.routineTitle.localeCompare(b.routineTitle, "pl");
  });

  return out;
}
