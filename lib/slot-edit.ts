import type { Slot } from "./types";
import { uid } from "./utils";

export const overlaps = (a: Slot, b: Slot): boolean => {
  if (a.dayOfWeek !== b.dayOfWeek) return false;
  const aEnd = a.startMinute + a.durationMinutes;
  const bEnd = b.startMinute + b.durationMinutes;
  return a.startMinute < bEnd && b.startMinute < aEnd;
};

export const findConflicts = (slots: Slot[], draft: Slot): Slot[] =>
  slots.filter((s) => s.id !== draft.id && overlaps(s, draft));

// "Push" resolution — move all conflicting slots later by the overlap delta
export const pushConflictsLater = (
  slots: Slot[],
  draft: Slot,
  conflicts: Slot[],
): Slot[] => {
  const draftEnd = draft.startMinute + draft.durationMinutes;
  return slots.map((s) => {
    if (!conflicts.find((c) => c.id === s.id)) return s;
    if (s.dayOfWeek !== draft.dayOfWeek) return s;
    // Push the slot to start at draftEnd
    const newStart = Math.min(24 * 60 - 30, draftEnd);
    return { ...s, startMinute: newStart };
  });
};

// "Replace" resolution — remove conflicting slots
export const replaceConflicts = (slots: Slot[], conflicts: Slot[]): Slot[] => {
  const ids = new Set(conflicts.map((c) => c.id));
  return slots.filter((s) => !ids.has(s.id));
};

// "Merge" resolution — only when same pillar. Combine into one slot covering both ranges.
export const canMerge = (draft: Slot, conflicts: Slot[]): boolean => {
  return conflicts.every((c) => c.pillarId === draft.pillarId);
};

export const mergeWithConflicts = (
  slots: Slot[],
  draft: Slot,
  conflicts: Slot[],
): { merged: Slot; rest: Slot[] } => {
  const all = [draft, ...conflicts];
  const minStart = Math.min(...all.map((s) => s.startMinute));
  const maxEnd = Math.max(...all.map((s) => s.startMinute + s.durationMinutes));
  const merged: Slot = {
    ...draft,
    id: draft.id || uid(),
    startMinute: minStart,
    durationMinutes: maxEnd - minStart,
  };
  const ids = new Set([draft.id, ...conflicts.map((c) => c.id)]);
  return {
    merged,
    rest: slots.filter((s) => !ids.has(s.id)),
  };
};

// Snap minute to nearest step (default 30)
export const snapMinute = (m: number, step = 30): number =>
  Math.round(m / step) * step;

export const clampMinute = (m: number, min = 0, max = 24 * 60 - 30): number =>
  Math.max(min, Math.min(max, m));
