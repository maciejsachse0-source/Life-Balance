"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import type { Goal, Milestone, Task, TaskStatus } from "@/lib/types";

type Props = {
  goal: Goal;
  onUpdateTask: (milestoneId: string, taskId: string, patch: Partial<Task>) => void;
};

const COLUMNS: { id: TaskStatus; label: string; bg: string; accent: string }[] = [
  { id: "Todo", label: "Todo", bg: "bg-neutral-50", accent: "text-neutral-600" },
  { id: "InProgress", label: "W toku", bg: "bg-amber-50", accent: "text-amber-700" },
  { id: "Done", label: "Zrobione", bg: "bg-emerald-50", accent: "text-emerald-700" },
];

type Filter = "all" | string; // milestone id

type FlatTask = Task & { milestone: Milestone };

export function KanbanView({ goal, onUpdateTask }: Props) {
  const milestones = goal.milestones ?? [];
  const allTasks: FlatTask[] = useMemo(
    () =>
      milestones.flatMap((m) =>
        (m.tasks ?? []).map((t) => ({ ...t, milestone: m })),
      ),
    [milestones],
  );

  const [filter, setFilter] = useState<Filter>("all");
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  const filtered = filter === "all" ? allTasks : allTasks.filter((t) => t.milestoneId === filter);

  const handleDragEnd = (e: DragEndEvent) => {
    const taskId = e.active.id as string;
    const targetStatus = e.over?.id as TaskStatus | undefined;
    if (!targetStatus) return;
    const task = allTasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    onUpdateTask(task.milestoneId, taskId, {
      status: targetStatus,
      completedAt: targetStatus === "Done" ? new Date().toISOString() : undefined,
    });
  };

  if (allTasks.length === 0) {
    return (
      <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-6 text-center text-sm text-neutral-500">
        Brak zadań — najpierw dodaj milestone i zadania w widoku drzewa.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm">
        <label className="text-neutral-500">Filtr milestone:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-2 py-1 border border-neutral-200 rounded text-sm"
        >
          <option value="all">Wszystkie</option>
          {milestones.map((m) => (
            <option key={m.id} value={m.id}>
              {m.title}
            </option>
          ))}
        </select>
      </div>
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.id}
              status={col.id}
              label={col.label}
              bg={col.bg}
              accent={col.accent}
              tasks={filtered.filter((t) => t.status === col.id)}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  bg,
  accent,
  tasks,
}: {
  status: TaskStatus;
  label: string;
  bg: string;
  accent: string;
  tasks: FlatTask[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={`${bg} rounded-lg p-3 min-h-[200px] transition-colors ${
        isOver ? "ring-2 ring-indigo-400" : ""
      }`}
    >
      <header className="flex items-center justify-between mb-3 text-xs font-medium uppercase tracking-wider">
        <span className={accent}>{label}</span>
        <span className="text-neutral-400">{tasks.length}</span>
      </header>
      <div className="space-y-2">
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} />
        ))}
      </div>
    </div>
  );
}

function KanbanCard({ task }: { task: FlatTask }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });
  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    opacity: isDragging ? 0.6 : 1,
    cursor: isDragging ? "grabbing" : "grab",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white rounded-md border border-neutral-200 px-3 py-2 shadow-sm hover:shadow-md select-none"
    >
      <div className="text-sm font-medium leading-tight">{task.title}</div>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] text-neutral-500 truncate">{task.milestone.title}</span>
        <span className="text-[9px] uppercase text-neutral-400">{task.workType}</span>
      </div>
    </div>
  );
}
