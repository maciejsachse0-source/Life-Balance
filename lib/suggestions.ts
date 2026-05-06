// 4-step suggestion engine — see CLAUDE.md section 7
//
// Step 1: filter by pillar
// Step 2: filter by workType compatibility
// Step 3: score priority (weight + deadline + continuation + under/overrep)
// Step 4: present top suggestion + alternatives

import type { AppState, Goal, Slot, Task, WorkType } from "./types";
import { differenceInCalendarDays, isAfter, parseISO, subDays } from "date-fns";

export type SuggestionCandidate = {
  goal: Goal;
  task?: Task;
  priority: number;
  reasons: string[];
};

const workTypeCompatible = (slot: WorkType, candidate: WorkType): boolean => {
  if (slot === "buffer") return true;
  if (slot === candidate) return true;
  switch (slot) {
    case "deep":
      return candidate === "creative";
    case "shallow":
      return candidate === "admin";
    case "admin":
      return candidate === "shallow";
    case "creative":
      return candidate === "deep";
    case "physical":
    case "social":
    case "reflective":
    case "routine":
      return false;
    default:
      return false;
  }
};

const deadlineProximity = (deadline?: string): number => {
  if (!deadline) return 5;
  const days = differenceInCalendarDays(parseISO(deadline), new Date());
  if (days < 0) return 30; // overdue
  if (days <= 7) return 30;
  if (days <= 14) return 20;
  if (days <= 30) return 10;
  return 5;
};

const wasContinued = (state: AppState, goalId: string, taskId?: string): boolean => {
  const today = new Date();
  const yesterday = subDays(today, 1);
  // Look for any slot completion linked to this goal/task in last 2 days
  for (const c of state.slotCompletions) {
    if (!c.completed) continue;
    const slot = state.calendar.template.slots.find((s) => s.id === c.slotId);
    if (!slot) continue;
    const date = parseISO(c.date);
    if (!isAfter(date, subDays(yesterday, 1))) continue;
    if (taskId && slot.taskId === taskId) return true;
    if (!taskId && slot.goalId === goalId) return true;
  }
  return false;
};

const goalSlotsInLastNDays = (state: AppState, goalId: string, days: number): number => {
  const cutoff = subDays(new Date(), days);
  let count = 0;
  for (const c of state.slotCompletions) {
    if (!c.completed) continue;
    if (parseISO(c.date) < cutoff) continue;
    const slot = state.calendar.template.slots.find((s) => s.id === c.slotId);
    if (!slot) continue;
    if (slot.goalId === goalId) count++;
  }
  return count;
};

const pillarSlotsInLastNDays = (state: AppState, pillarId: string, days: number): number => {
  const cutoff = subDays(new Date(), days);
  let count = 0;
  for (const c of state.slotCompletions) {
    if (!c.completed) continue;
    if (parseISO(c.date) < cutoff) continue;
    const slot = state.calendar.template.slots.find((s) => s.id === c.slotId);
    if (!slot || slot.pillarId !== pillarId) continue;
    count++;
  }
  return count;
};

export function suggestForSlot(state: AppState, slot: Slot): SuggestionCandidate[] {
  const pillarGoals = state.goals.filter(
    (g) => g.pillarId === slot.pillarId && g.status === "Active",
  );

  const candidates: SuggestionCandidate[] = [];

  for (const goal of pillarGoals) {
    if (goal.character === "Project" || goal.character === "Mixed") {
      // Drill into milestones/tasks
      const tasks: Task[] = (goal.milestones ?? []).flatMap((m) => m.tasks ?? []);
      const openTasks = tasks.filter((t) => t.status !== "Done");
      for (const task of openTasks) {
        if (!workTypeCompatible(slot.workType, task.workType)) continue;

        const reasons: string[] = [];
        let priority = (goal.weight ?? 5) * 10;

        const dl = deadlineProximity(task.deadline ?? goal.deadline);
        priority += dl;
        if (dl >= 20) reasons.push(`deadline blisko (+${dl})`);

        if (wasContinued(state, goal.id, task.id)) {
          priority += 25;
          reasons.push("kontynuacja (+25)");
        }

        const recentSlots = goalSlotsInLastNDays(state, goal.id, 5);
        const recentSlots3 = goalSlotsInLastNDays(state, goal.id, 3);
        if (recentSlots === 0) {
          priority += 20;
          reasons.push("zaniedbany 5 dni (+20)");
        } else if (recentSlots <= 1) {
          priority += 10;
          reasons.push("zaniedbany 3 dni (+10)");
        }

        const pillarSlots = pillarSlotsInLastNDays(state, slot.pillarId, 3);
        if (pillarSlots > 0) {
          const ratio = recentSlots3 / pillarSlots;
          if (ratio > 0.5) {
            priority -= 30;
            reasons.push("nadreprezentacja (-30)");
          } else if (ratio > 0.35) {
            priority -= 15;
            reasons.push("nadreprezentacja (-15)");
          }
        }

        // Manual reassign penalty
        if (task.manualReassignCount >= 3) {
          priority -= 5;
          reasons.push("często zmieniany (-5)");
        }

        candidates.push({ goal, task, priority, reasons });
      }
    } else if (goal.character === "Routine") {
      const cfg = goal.routineConfig;
      if (!cfg) continue;
      if (!workTypeCompatible(slot.workType, cfg.workType)) continue;

      // Routine priority: weekly target gap
      const weekTarget = cfg.frequency === "daily" ? 7 : (cfg.timesPerWeek ?? 1);
      const today = new Date();
      const monday = subDays(today, ((today.getDay() + 6) % 7));
      const doneThisWeek = cfg.completions.filter(
        (c) => c.completed && parseISO(c.date) >= monday,
      ).length;
      if (doneThisWeek >= weekTarget) continue;

      const need = weekTarget - doneThisWeek;
      const remainingDays = 7 - ((today.getDay() + 6) % 7);
      let priority = (goal.weight ?? 5) * 10 + 15;
      const reasons: string[] = [`rutyna (${doneThisWeek}/${weekTarget})`];
      if (need >= remainingDays) {
        priority += 30;
        reasons.push("nie zdąży się (+30)");
      } else if (need === remainingDays) {
        priority += 20;
        reasons.push("ostatnia szansa (+20)");
      }
      candidates.push({ goal, priority, reasons });
    }
  }

  candidates.sort((a, b) => b.priority - a.priority);
  return candidates;
}
