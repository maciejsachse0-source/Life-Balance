"use client";

import { Trees, KanbanSquare, GanttChart } from "lucide-react";
import type { GoalView } from "@/lib/types";

type Props = {
  value: GoalView;
  onChange: (v: GoalView) => void;
};

export function GoalViewSwitcher({ value, onChange }: Props) {
  const items: { id: GoalView; label: string; icon: React.ReactNode }[] = [
    { id: "tree", label: "Drzewo", icon: <Trees size={14} /> },
    { id: "kanban", label: "Kanban", icon: <KanbanSquare size={14} /> },
    { id: "roadmap", label: "Roadmap", icon: <GanttChart size={14} /> },
  ];
  return (
    <div className="inline-flex bg-neutral-100 rounded-lg p-0.5 text-sm">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
            value === it.id
              ? "bg-white shadow-sm font-medium"
              : "text-neutral-500 hover:text-neutral-800"
          }`}
        >
          {it.icon}
          {it.label}
        </button>
      ))}
    </div>
  );
}
