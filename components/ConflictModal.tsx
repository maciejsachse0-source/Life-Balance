"use client";

import type { Slot } from "@/lib/types";
import { Modal } from "./Modal";
import { canMerge } from "@/lib/slot-edit";
import { minuteToTimeStr, DAY_NAMES_LONG } from "@/lib/utils";

type Resolution = "replace" | "push" | "merge" | "cancel";

type Props = {
  open: boolean;
  draft: Slot | null;
  conflicts: Slot[];
  draftLabel: string;
  conflictLabels: Record<string, string>;
  onResolve: (resolution: Resolution) => void;
};

export function ConflictModal({
  open,
  draft,
  conflicts,
  draftLabel,
  conflictLabels,
  onResolve,
}: Props) {
  if (!open || !draft || conflicts.length === 0) return null;
  const mergeAllowed = canMerge(draft, conflicts);

  return (
    <Modal open={open} onClose={() => onResolve("cancel")} title="Konflikt slotów">
      <div className="space-y-4">
        <div className="text-sm text-neutral-700">
          <p className="mb-2">
            Edytowany slot <b>{draftLabel}</b> w {DAY_NAMES_LONG[draft.dayOfWeek]} (
            {minuteToTimeStr(draft.startMinute)}–
            {minuteToTimeStr(draft.startMinute + draft.durationMinutes)}) koliduje z:
          </p>
          <ul className="text-xs space-y-1">
            {conflicts.map((c) => (
              <li key={c.id} className="bg-amber-50 border border-amber-200 rounded px-2 py-1">
                <b>{conflictLabels[c.id] ?? "?"}</b> · {minuteToTimeStr(c.startMinute)}–
                {minuteToTimeStr(c.startMinute + c.durationMinutes)}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid gap-2">
          <ResolveBtn
            title="Spychnij"
            subtitle="Przesuwa kolidujące sloty dalej w czasie (default)"
            onClick={() => onResolve("push")}
            primary
          />
          <ResolveBtn
            title="Zastąp"
            subtitle="Usuwa kolidujące sloty"
            onClick={() => onResolve("replace")}
          />
          {mergeAllowed ? (
            <ResolveBtn
              title="Połącz"
              subtitle="Sloty tego samego filaru — łączą się w jeden dłuższy"
              onClick={() => onResolve("merge")}
            />
          ) : null}
          <ResolveBtn title="Anuluj" subtitle="Cofnij edycję" onClick={() => onResolve("cancel")} />
        </div>
      </div>
    </Modal>
  );
}

function ResolveBtn({
  title,
  subtitle,
  onClick,
  primary,
}: {
  title: string;
  subtitle: string;
  onClick: () => void;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`text-left px-4 py-3 rounded-lg border ${
        primary
          ? "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
          : "border-neutral-200 hover:border-neutral-400"
      }`}
    >
      <div className="font-medium text-sm">{title}</div>
      <div className="text-xs text-neutral-500">{subtitle}</div>
    </button>
  );
}
