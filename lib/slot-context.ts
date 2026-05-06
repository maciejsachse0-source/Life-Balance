// Resolves what a calendar slot is "about" — either an explicitly assigned
// task/goal, or the top suggestion from the engine.
// Used by Week and Day views to render goal + milestone + task labels.

import type { AppState, Goal, GoalCharacter, Slot } from "./types";
import { suggestForSlot } from "./suggestions";
import { parseISO, startOfWeek } from "date-fns";

export type SlotContext = {
  goalId?: string;
  goalTitle?: string;
  milestoneTitle?: string;
  taskTitle?: string;
  routineProgress?: { done: number; target: number };
  character?: GoalCharacter;
  /** true → derived from suggestion engine; false → user explicitly assigned */
  isSuggestion: boolean;
};

const findGoal = (goals: Goal[], goalId: string) =>
  goals.find((g) => g.id === goalId);

const routineWeekProgress = (goal: Goal): { done: number; target: number } | undefined => {
  const cfg = goal.routineConfig;
  if (!cfg) return undefined;
  const target = cfg.frequency === "daily" ? 7 : (cfg.timesPerWeek ?? 1);
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 });
  const done = cfg.completions.filter(
    (c) => c.completed && parseISO(c.date) >= monday,
  ).length;
  return { done, target };
};

export function resolveSlotContext(state: AppState, slot: Slot): SlotContext {
  // 1. Task explicitly assigned
  if (slot.taskId) {
    for (const g of state.goals) {
      for (const m of g.milestones ?? []) {
        const t = (m.tasks ?? []).find((tt) => tt.id === slot.taskId);
        if (t) {
          return {
            goalId: g.id,
            goalTitle: g.title,
            milestoneTitle: m.title,
            taskTitle: t.title,
            character: g.character,
            isSuggestion: false,
          };
        }
      }
    }
  }

  // 2. Goal explicitly assigned
  if (slot.goalId) {
    const g = findGoal(state.goals, slot.goalId);
    if (g) {
      return {
        goalId: g.id,
        goalTitle: g.title,
        character: g.character,
        routineProgress: g.character === "Routine" ? routineWeekProgress(g) : undefined,
        isSuggestion: false,
      };
    }
  }

  // 3. Top suggestion from engine
  const suggestions = suggestForSlot(state, slot);
  const top = suggestions[0];
  if (top) {
    let milestoneTitle: string | undefined;
    if (top.task) {
      const m = (top.goal.milestones ?? []).find((mm) => mm.id === top.task!.milestoneId);
      milestoneTitle = m?.title;
    }
    return {
      goalId: top.goal.id,
      goalTitle: top.goal.title,
      milestoneTitle,
      taskTitle: top.task?.title,
      character: top.goal.character,
      routineProgress:
        top.goal.character === "Routine" ? routineWeekProgress(top.goal) : undefined,
      isSuggestion: true,
    };
  }

  return { isSuggestion: false };
}
