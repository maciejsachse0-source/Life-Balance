"use client";

import { useState } from "react";
import { Check, Trash2, Plus, Target, ChevronDown } from "lucide-react";
import type { Goal, Milestone, TaskStatus, WorkType } from "@/lib/types";
import { Heatmap } from "@/components/routine/Heatmap";

type Props = {
  goal: Goal;
  color: string;
  isMixed: boolean;
  goalProgress: number;
  milestoneProgress: (mid: string) => number;
  onAddMilestone: () => void;
  onAddTask: (
    mid: string,
    t: { title: string; status: TaskStatus; workType: WorkType },
  ) => string;
  onUpdateTask: (mid: string, tid: string, p: { status?: TaskStatus }) => void;
  onRemoveTask: (mid: string, tid: string) => void;
  onRemoveMilestone: (mid: string) => void;
  onMilestoneCharacterChange: (mid: string, ch: "Project" | "Routine") => void;
  onMilestoneRoutineToggle: (mid: string, date: string, currentlyDone: boolean) => void;
};

export function TreeView({
  goal,
  color,
  isMixed,
  goalProgress,
  milestoneProgress,
  onAddMilestone,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onRemoveMilestone,
  onMilestoneCharacterChange,
  onMilestoneRoutineToggle,
}: Props) {
  const milestones = goal.milestones ?? [];
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="grid md:grid-cols-[minmax(220px,300px)_1fr] gap-6 md:gap-10 items-start">
      <GoalNode goal={goal} color={color} progress={goalProgress} milestoneCount={milestones.length} />

      <div className="relative">
        {milestones.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-6 text-center text-sm text-neutral-500">
            Brak milestonów. Dodaj pierwszy →
          </div>
        ) : (
          <ul className="relative">
            {/* Pionowy pień łączący milestones */}
            <span
              aria-hidden
              className="absolute left-2 w-0.5 rounded-full"
              style={{
                background: color,
                opacity: 0.35,
                top: "1.25rem",
                bottom: "1.25rem",
              }}
            />

            {milestones.map((m) => {
              const isOpen = openId === m.id;
              const character: "Project" | "Routine" = isMixed
                ? m.character ?? "Project"
                : "Project";
              const prog =
                character === "Project"
                  ? milestoneProgress(m.id)
                  : routineProgress(m);
              const isDone = prog >= 100;

              return (
                <li key={m.id} className="relative pl-10 mb-3 last:mb-0">
                  {/* Wygięta gałąź od pnia do karty */}
                  <svg
                    aria-hidden
                    className="absolute left-0 top-0 pointer-events-none"
                    width="40"
                    height="48"
                    viewBox="0 0 40 48"
                  >
                    <path
                      d="M 8 0 Q 8 24, 38 24"
                      stroke={color}
                      strokeOpacity="0.45"
                      strokeWidth="2"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>

                  <MilestoneNode
                    m={m}
                    color={color}
                    isMixed={isMixed}
                    character={character}
                    progress={prog}
                    isDone={isDone}
                    isOpen={isOpen}
                    onToggle={() => setOpenId(isOpen ? null : m.id)}
                    onRemove={() => {
                      if (confirm("Usunąć milestone?")) onRemoveMilestone(m.id);
                    }}
                    onCharacterChange={(ch) => onMilestoneCharacterChange(m.id, ch)}
                    onAddTask={(t) => onAddTask(m.id, t)}
                    onUpdateTask={(tid, p) => onUpdateTask(m.id, tid, p)}
                    onRemoveTask={(tid) => onRemoveTask(m.id, tid)}
                    onRoutineToggle={(date, done) =>
                      onMilestoneRoutineToggle(m.id, date, done)
                    }
                  />
                </li>
              );
            })}

            {/* Przycisk dodania milestonu jako kolejny "liść" */}
            <li className="relative pl-10 mt-1">
              <svg
                aria-hidden
                className="absolute left-0 top-0 pointer-events-none"
                width="40"
                height="32"
                viewBox="0 0 40 32"
              >
                <path
                  d="M 8 0 Q 8 16, 38 16"
                  stroke={color}
                  strokeOpacity="0.25"
                  strokeWidth="2"
                  strokeDasharray="3 3"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <button
                onClick={onAddMilestone}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-500 hover:text-indigo-700 border border-dashed border-neutral-300 hover:border-indigo-400 rounded-lg bg-white"
              >
                <Plus size={14} /> Milestone
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}

function routineProgress(m: Milestone): number {
  const done = m.routineConfig?.completions.filter((c) => c.completed).length ?? 0;
  const total = m.routineConfig?.completions.length ?? 0;
  if (total === 0) return 0;
  return Math.min(100, (done / total) * 100);
}

function GoalNode({
  goal,
  color,
  progress,
  milestoneCount,
}: {
  goal: Goal;
  color: string;
  progress: number;
  milestoneCount: number;
}) {
  const doneCount = (goal.milestones ?? []).filter((m) => {
    const tasks = m.tasks ?? [];
    if (tasks.length === 0) return false;
    return tasks.every((t) => t.status === "Done");
  }).length;

  return (
    <div
      className="rounded-2xl p-5 text-white shadow-sm relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}cc)`,
      }}
    >
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-white/80 mb-2">
        <Target size={12} /> Cel
      </div>
      <h3 className="text-lg font-semibold leading-tight">{goal.title}</h3>
      {goal.deadline ? (
        <div className="mt-1 text-xs text-white/80">
          Do {new Date(goal.deadline).toLocaleDateString("pl")}
        </div>
      ) : null}

      <div className="mt-4">
        <div className="flex items-baseline justify-between text-white/90 mb-1">
          <span className="text-3xl font-bold tabular-nums">{Math.round(progress)}%</span>
          {milestoneCount > 0 ? (
            <span className="text-xs text-white/75">
              {doneCount}/{milestoneCount}{" "}
              {milestoneCount === 1 ? "milestone" : "milestonów"}
            </span>
          ) : null}
        </div>
        <div className="h-2 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-white transition-[width] duration-300"
            style={{ width: `${Math.min(100, progress)}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MilestoneNode({
  m,
  color,
  isMixed,
  character,
  progress,
  isDone,
  isOpen,
  onToggle,
  onRemove,
  onCharacterChange,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onRoutineToggle,
}: {
  m: Milestone;
  color: string;
  isMixed: boolean;
  character: "Project" | "Routine";
  progress: number;
  isDone: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onRemove: () => void;
  onCharacterChange: (ch: "Project" | "Routine") => void;
  onAddTask: (t: { title: string; status: TaskStatus; workType: WorkType }) => string;
  onUpdateTask: (taskId: string, p: { status?: TaskStatus }) => void;
  onRemoveTask: (taskId: string) => void;
  onRoutineToggle: (date: string, currentlyDone: boolean) => void;
}) {
  const tasksTotal = (m.tasks ?? []).length;
  const tasksDone = (m.tasks ?? []).filter((t) => t.status === "Done").length;

  return (
    <div className="bg-white border border-neutral-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
      <header
        className="flex items-center gap-3 p-3 cursor-pointer"
        onClick={onToggle}
      >
        {/* Status icon */}
        <span
          className={`flex-none w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors`}
          style={{
            background: isDone ? color : "transparent",
            borderColor: isDone ? color : `${color}80`,
          }}
          aria-label={isDone ? "Ukończony" : "W trakcie"}
        >
          {isDone ? <Check size={14} className="text-white" strokeWidth={3} /> : null}
        </span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-medium truncate ${isDone ? "text-neutral-400 line-through" : "text-neutral-900"}`}
            >
              {m.title}
            </span>
            {isMixed ? (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  character === "Project"
                    ? "bg-indigo-50 text-indigo-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {character === "Project" ? "Projekt" : "Rutyna"}
              </span>
            ) : null}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">
            {character === "Project"
              ? tasksTotal === 0
                ? "Brak zadań"
                : `${tasksDone}/${tasksTotal} ${tasksTotal === 1 ? "zadanie" : "zadań"}`
              : `${m.routineConfig?.completions.filter((c) => c.completed).length ?? 0} wykonań`}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold tabular-nums" style={{ color }}>
            {Math.round(progress)}%
          </span>
          <ChevronDown
            size={16}
            className={`text-neutral-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 text-neutral-300 hover:text-red-500"
            aria-label="Usuń milestone"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* Pasek postępu pod nagłówkiem */}
      <div className="px-3 pb-2">
        <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden">
          <div
            className="h-full transition-[width] duration-300"
            style={{
              width: `${progress}%`,
              background: `linear-gradient(90deg, ${color}90, ${color})`,
            }}
          />
        </div>
      </div>

      {isOpen ? (
        <div className="border-t border-neutral-100 p-3 space-y-2 bg-neutral-50/40 rounded-b-xl">
          {isMixed ? (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-neutral-500">Charakter:</span>
              <select
                value={character}
                onChange={(e) =>
                  onCharacterChange(e.target.value as "Project" | "Routine")
                }
                className="px-2 py-1 border border-neutral-200 rounded bg-white"
              >
                <option value="Project">Projekt (taski)</option>
                <option value="Routine">Rutyna (heatmap)</option>
              </select>
            </div>
          ) : null}
          {character === "Project" ? (
            <MilestoneTasks
              tasks={m.tasks ?? []}
              addTask={onAddTask}
              updateTask={onUpdateTask}
              removeTask={onRemoveTask}
            />
          ) : m.routineConfig ? (
            <Heatmap
              completions={m.routineConfig.completions}
              color={color}
              weeks={8}
              onToggle={onRoutineToggle}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MilestoneTasks({
  tasks,
  addTask,
  updateTask,
  removeTask,
}: {
  tasks: Array<{ id: string; title: string; status: TaskStatus; workType: WorkType }>;
  addTask: (t: { title: string; status: TaskStatus; workType: WorkType }) => string;
  updateTask: (taskId: string, p: { status?: TaskStatus }) => void;
  removeTask: (taskId: string) => void;
}) {
  const [newTitle, setNewTitle] = useState("");

  const cycleStatus = (s: TaskStatus): TaskStatus =>
    s === "Todo" ? "InProgress" : s === "InProgress" ? "Done" : "Todo";

  return (
    <div className="space-y-1.5">
      {tasks.map((t) => (
        <div key={t.id} className="flex items-center gap-2 text-sm">
          <button
            onClick={() => updateTask(t.id, { status: cycleStatus(t.status) })}
            className={`w-5 h-5 rounded border flex items-center justify-center ${
              t.status === "Done"
                ? "bg-emerald-500 border-emerald-500 text-white"
                : t.status === "InProgress"
                  ? "bg-amber-100 border-amber-400 text-amber-700"
                  : "border-neutral-300 bg-white"
            }`}
            title={t.status}
          >
            {t.status === "Done" ? <Check size={12} /> : t.status === "InProgress" ? "·" : ""}
          </button>
          <span
            className={`flex-1 ${t.status === "Done" ? "line-through text-neutral-400" : ""}`}
          >
            {t.title}
          </span>
          <span className="text-[10px] text-neutral-400 uppercase">{t.workType}</span>
          <button
            onClick={() => removeTask(t.id)}
            className="text-neutral-300 hover:text-red-500"
            aria-label="Usuń zadanie"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Nowe zadanie + Enter"
          className="flex-1 px-2 py-1 border border-neutral-200 rounded text-sm focus:outline-none focus:border-indigo-400 bg-white"
          onKeyDown={(e) => {
            if (e.key === "Enter" && newTitle.trim()) {
              addTask({ title: newTitle.trim(), status: "Todo", workType: "deep" });
              setNewTitle("");
            }
          }}
        />
      </div>
    </div>
  );
}
