import type { AppState, DayShort, RoutineConfig } from "./types";
import { addDays, format, isAfter, startOfDay } from "date-fns";
import { startOfIsoWeek } from "./routine";

export type HabitWeekDay = {
  date: string; // YYYY-MM-DD
  dowIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0=Mon ... 6=Sun
  scheduled: boolean;
  done: boolean;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
};

export type HabitWeekItem = {
  key: string;
  kind: "goal" | "milestone";
  goalId: string;
  milestoneId?: string;
  pillarId: string;
  pillarColor: string;
  pillarName: string;
  pillarIcon: string;
  parentGoalTitle: string;
  habitTitle: string;
  cfg: RoutineConfig;
  days: HabitWeekDay[];
  weeklyDone: number;
  weeklyTarget: number;
  weeklyPercent: number;
  durationMinutes: number;
  currentStreak: number;
  totalDone: number;
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

export const DAY_LABELS_PL: Record<DayShort, string> = {
  mon: "Pn",
  tue: "Wt",
  wed: "Śr",
  thu: "Cz",
  fri: "Pt",
  sat: "So",
  sun: "Nd",
};

function isDayScheduled(
  cfg: RoutineConfig,
  dowIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6,
): boolean {
  if (cfg.frequency === "daily") return true;
  if (cfg.frequency === "custom") {
    return cfg.customDays?.includes(DAY_INDEX_TO_SHORT[dowIndex]) ?? false;
  }
  // weekly:N — every day is a potential candidate (no fixed days)
  return true;
}

function computeWeekDays(
  cfg: RoutineConfig,
  reference: Date,
): HabitWeekDay[] {
  const monday = startOfIsoWeek(reference);
  const todayStart = startOfDay(reference);
  const doneSet = new Set(
    cfg.completions.filter((c) => c.completed).map((c) => c.date),
  );

  const days: HabitWeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);
    const dateStart = startOfDay(date);
    const dateStr = format(date, "yyyy-MM-dd");
    const dowIndex = i as 0 | 1 | 2 | 3 | 4 | 5 | 6;
    const isToday = dateStr === format(reference, "yyyy-MM-dd");
    const isFuture = isAfter(dateStart, todayStart);
    days.push({
      date: dateStr,
      dowIndex,
      scheduled: isDayScheduled(cfg, dowIndex),
      done: doneSet.has(dateStr),
      isPast: !isToday && !isFuture,
      isToday,
      isFuture,
    });
  }
  return days;
}

function computeWeeklyTarget(cfg: RoutineConfig): number {
  if (cfg.frequency === "daily") return 7;
  if (cfg.frequency === "custom") return cfg.customDays?.length ?? 0;
  return cfg.timesPerWeek ?? 1;
}

function computeCurrentStreak(cfg: RoutineConfig, reference: Date): number {
  const doneSet = new Set(
    cfg.completions.filter((c) => c.completed).map((c) => c.date),
  );
  let streak = 0;

  if (cfg.frequency === "daily") {
    let cursor = startOfDay(reference);
    const todayStr = format(cursor, "yyyy-MM-dd");
    if (!doneSet.has(todayStr)) {
      cursor = addDays(cursor, -1);
    }
    while (true) {
      const s = format(cursor, "yyyy-MM-dd");
      if (doneSet.has(s)) {
        streak += 1;
        cursor = addDays(cursor, -1);
      } else {
        break;
      }
    }
    return streak;
  }

  if (cfg.frequency === "custom") {
    const days = cfg.customDays ?? [];
    if (days.length === 0) return 0;
    let cursor = startOfDay(reference);
    // walk back day-by-day, only counting scheduled days
    let firstMissedNonScheduled = true;
    while (true) {
      const dowIndex = ((cursor.getDay() + 6) % 7) as
        | 0
        | 1
        | 2
        | 3
        | 4
        | 5
        | 6;
      const scheduled = days.includes(DAY_INDEX_TO_SHORT[dowIndex]);
      const s = format(cursor, "yyyy-MM-dd");
      if (scheduled) {
        if (doneSet.has(s)) {
          streak += 1;
          cursor = addDays(cursor, -1);
          firstMissedNonScheduled = false;
        } else {
          // allow today/yesterday to be unfinished without breaking streak
          if (firstMissedNonScheduled) {
            cursor = addDays(cursor, -1);
            firstMissedNonScheduled = false;
            continue;
          }
          break;
        }
      } else {
        cursor = addDays(cursor, -1);
      }
      if (streak > 365) break;
    }
    return streak;
  }

  // weekly:N — count consecutive past weeks meeting the target
  const target = cfg.timesPerWeek ?? 1;
  let weeksBack = 0;
  while (true) {
    const monday = addDays(startOfIsoWeek(reference), -weeksBack * 7);
    let countInWeek = 0;
    for (let d = 0; d < 7; d++) {
      const s = format(addDays(monday, d), "yyyy-MM-dd");
      if (doneSet.has(s)) countInWeek++;
    }
    if (countInWeek >= target) {
      streak += 1;
      weeksBack += 1;
    } else if (weeksBack === 0) {
      // grace for current week
      weeksBack += 1;
    } else {
      break;
    }
    if (weeksBack > 200) break;
  }
  return streak;
}

function buildItem(
  base: Omit<HabitWeekItem, "days" | "weeklyDone" | "weeklyTarget" | "weeklyPercent" | "currentStreak" | "totalDone">,
  reference: Date,
): HabitWeekItem {
  const cfg = base.cfg;
  const days = computeWeekDays(cfg, reference);
  const weeklyTarget = computeWeeklyTarget(cfg);
  const weeklyDone = days.filter((d) => d.done).length;
  const weeklyPercent =
    weeklyTarget > 0 ? Math.round((weeklyDone / weeklyTarget) * 100) : 0;
  const currentStreak = computeCurrentStreak(cfg, reference);
  const totalDone = cfg.completions.filter((c) => c.completed).length;
  return {
    ...base,
    days,
    weeklyDone,
    weeklyTarget,
    weeklyPercent,
    currentStreak,
    totalDone,
  };
}

export function getHabitsForWeek(
  state: AppState,
  reference: Date = new Date(),
): HabitWeekItem[] {
  const pillarMap = new Map(state.layers.pillars.map((p) => [p.id, p]));
  const out: HabitWeekItem[] = [];

  for (const goal of state.goals) {
    if (goal.status !== "Active") continue;
    const pillar = pillarMap.get(goal.pillarId);
    if (!pillar) continue;

    if (goal.character === "Routine" && goal.routineConfig) {
      out.push(
        buildItem(
          {
            key: `g:${goal.id}`,
            kind: "goal",
            goalId: goal.id,
            pillarId: pillar.id,
            pillarColor: pillar.color,
            pillarName: pillar.name,
            pillarIcon: pillar.icon,
            parentGoalTitle: goal.title,
            habitTitle: goal.title,
            cfg: goal.routineConfig,
            durationMinutes: goal.routineConfig.durationMinutes,
          },
          reference,
        ),
      );
    }

    if (goal.character === "Mixed") {
      for (const m of goal.milestones ?? []) {
        if (m.character !== "Routine" || !m.routineConfig) continue;
        out.push(
          buildItem(
            {
              key: `m:${goal.id}:${m.id}`,
              kind: "milestone",
              goalId: goal.id,
              milestoneId: m.id,
              pillarId: pillar.id,
              pillarColor: pillar.color,
              pillarName: pillar.name,
              pillarIcon: pillar.icon,
              parentGoalTitle: goal.title,
              habitTitle: m.title,
              cfg: m.routineConfig,
              durationMinutes: m.routineConfig.durationMinutes,
            },
            reference,
          ),
        );
      }
    }
  }

  out.sort((a, b) => {
    const byPillar = a.pillarName.localeCompare(b.pillarName, "pl");
    if (byPillar !== 0) return byPillar;
    return a.habitTitle.localeCompare(b.habitTitle, "pl");
  });

  return out;
}

export type HabitsWeekSummary = {
  habitsCount: number;
  totalSlots: number;
  doneSlots: number;
  overallPercent: number;
  onTrackCount: number; // habits at >= 100% (or close)
};

export function summarizeHabitsWeek(
  items: HabitWeekItem[],
): HabitsWeekSummary {
  let totalSlots = 0;
  let doneSlots = 0;
  let onTrackCount = 0;
  for (const it of items) {
    totalSlots += it.weeklyTarget;
    doneSlots += Math.min(it.weeklyDone, it.weeklyTarget);
    if (it.weeklyPercent >= 100) onTrackCount += 1;
  }
  return {
    habitsCount: items.length,
    totalSlots,
    doneSlots,
    overallPercent:
      totalSlots > 0 ? Math.round((doneSlots / totalSlots) * 100) : 0,
    onTrackCount,
  };
}
