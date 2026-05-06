"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { BottomNav } from "@/components/BottomNav";
import { Modal } from "@/components/Modal";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import type { TaskStatus, WorkType, RoutineConfig, GoalView } from "@/lib/types";
import { Heatmap } from "@/components/routine/Heatmap";
import { getRoutineStats } from "@/lib/routine";
import { GoalViewSwitcher } from "@/components/goal/GoalViewSwitcher";
import { KanbanView } from "@/components/goal/KanbanView";
import { RoadmapView } from "@/components/goal/RoadmapView";
import { TreeView } from "@/components/goal/TreeView";
import { format } from "date-fns";

export default function GoalDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const goal = useStore((s) => s.goals.find((g) => g.id === id));
  const pillars = useStore((s) => s.layers.pillars);
  const addMilestone = useStore((s) => s.addMilestone);
  const removeMilestone = useStore((s) => s.removeMilestone);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const removeTask = useStore((s) => s.removeTask);
  const removeGoal = useStore((s) => s.removeGoal);
  const updateMilestone = useStore((s) => s.updateMilestone);
  const toggleRoutineCompletion = useStore((s) => s.toggleRoutineCompletion);
  const setRoutineConfig = useStore((s) => s.setRoutineConfig);
  const lastViewMap = useStore((s) => s.settings.lastGoalViewPerGoalId);
  const setLastGoalView = useStore((s) => s.setLastGoalView);
  const [showAddMilestone, setShowAddMilestone] = useState(false);

  if (!hydrated) return <Spinner />;
  if (!goal) {
    return (
      <main className="p-8 text-center">
        <p className="text-neutral-500">Cel nie znaleziony.</p>
        <Link href="/dashboard" className="text-indigo-600">
          ← Dashboard
        </Link>
      </main>
    );
  }

  const pillar = pillars.find((p) => p.id === goal.pillarId);

  const milestoneProgress = (mid: string): number => {
    const m = goal.milestones?.find((x) => x.id === mid);
    if (!m?.tasks?.length) return 0;
    const done = m.tasks.filter((t) => t.status === "Done").length;
    return (done / m.tasks.length) * 100;
  };

  const goalProgress = (): number => {
    const ms = goal.milestones ?? [];
    if (ms.length === 0) return 0;
    return ms.reduce((acc, m) => acc + milestoneProgress(m.id), 0) / ms.length;
  };

  return (
    <main className="pb-24">
      <header
        className="px-4 py-6 sm:px-6 text-white"
        style={{
          background: pillar
            ? `linear-gradient(135deg, ${pillar.color}, ${pillar.color}cc)`
            : "linear-gradient(135deg,#525252,#262626)",
        }}
      >
        <div className="max-w-5xl mx-auto">
          <Link
            href={pillar ? `/pillar/${pillar.id}` : "/dashboard"}
            className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3"
          >
            <ArrowLeft size={14} /> {pillar?.name ?? "Dashboard"}
          </Link>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wider text-white/70 mb-1">
                {goal.character} · {goal.status}
                {goal.deadline ? ` · do ${new Date(goal.deadline).toLocaleDateString("pl")}` : ""}
              </div>
              <h1 className="text-3xl font-bold">{goal.title}</h1>
              {goal.vision ? <p className="mt-2 text-white/80">{goal.vision}</p> : null}
              <div className="mt-4">
                <div className="text-xs text-white/70 mb-1">Postęp: {Math.round(goalProgress())}%</div>
                <div className="h-1.5 rounded-full bg-white/20 overflow-hidden">
                  <div
                    className="h-full bg-white"
                    style={{ width: `${Math.min(100, goalProgress())}%` }}
                  />
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!confirm("Usunąć cel?")) return;
                removeGoal(goal.id);
                if (typeof window !== "undefined") {
                  window.location.href = pillar ? `/pillar/${pillar.id}` : "/dashboard";
                }
              }}
              className="p-2 hover:bg-white/10 rounded text-white/70"
              aria-label="Usuń cel"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        {goal.character === "Routine" ? (
          <RoutineView
            goal={goal}
            color={pillar?.color ?? "#6366f1"}
            onToggle={(date, currentlyDone) =>
              toggleRoutineCompletion(goal.id, date, !currentlyDone)
            }
            onConfigChange={(c) => setRoutineConfig(goal.id, c)}
          />
        ) : (
          <ProjectMixedSection
            goal={goal}
            color={pillar?.color ?? "#6366f1"}
            currentView={lastViewMap[goal.id] ?? "tree"}
            onViewChange={(v) => setLastGoalView(goal.id, v)}
            goalProgress={goalProgress()}
            milestoneProgress={milestoneProgress}
            onAddMilestone={() => setShowAddMilestone(true)}
            onAddTask={(mid, t) => addTask(goal.id, mid, t)}
            onUpdateTask={(mid, tid, p) => updateTask(goal.id, mid, tid, p)}
            onRemoveTask={(mid, tid) => removeTask(goal.id, mid, tid)}
            onRemoveMilestone={(mid) => removeMilestone(goal.id, mid)}
            onMilestoneCharacterChange={(mid, ch) =>
              updateMilestone(goal.id, mid, {
                character: ch,
                routineConfig:
                  ch === "Routine"
                    ? {
                        frequency: "daily",
                        durationMinutes: 30,
                        workType: "physical",
                        completions: [],
                      }
                    : undefined,
                tasks: ch === "Project" ? [] : undefined,
              })
            }
            onMilestoneRoutineToggle={(mid, date, done) => {
              const m = (goal.milestones ?? []).find((x) => x.id === mid);
              if (!m?.routineConfig) return;
              const existing = m.routineConfig.completions.find((c) => c.date === date);
              const completions = existing
                ? m.routineConfig.completions.map((c) =>
                    c.date === date ? { ...c, completed: !done } : c,
                  )
                : [
                    ...m.routineConfig.completions,
                    { id: crypto.randomUUID(), date, completed: !done },
                  ];
              updateMilestone(goal.id, mid, {
                routineConfig: { ...m.routineConfig, completions },
              });
            }}
          />
        )}
      </section>

      <Modal
        open={showAddMilestone}
        onClose={() => setShowAddMilestone(false)}
        title="Nowy milestone"
      >
        <MilestoneForm
          onCancel={() => setShowAddMilestone(false)}
          onSubmit={(title) => {
            addMilestone(goal.id, {
              title,
              order: (goal.milestones ?? []).length,
              tasks: [],
            });
            setShowAddMilestone(false);
          }}
        />
      </Modal>

      <BottomNav />
    </main>
  );
}

function MilestoneForm({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (title: string) => void;
}) {
  const [title, setTitle] = useState("");
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-neutral-500 mb-1">Tytuł</label>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Np. Rozdział 3"
          className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          onKeyDown={(e) => {
            if (e.key === "Enter" && title.trim()) onSubmit(title.trim());
          }}
        />
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm">
          Anuluj
        </button>
        <button
          onClick={() => onSubmit(title.trim())}
          disabled={!title.trim()}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:bg-neutral-300"
        >
          Dodaj
        </button>
      </div>
    </div>
  );
}

function ProjectMixedSection({
  goal,
  color,
  currentView,
  onViewChange,
  goalProgress,
  milestoneProgress,
  onAddMilestone,
  onAddTask,
  onUpdateTask,
  onRemoveTask,
  onRemoveMilestone,
  onMilestoneCharacterChange,
  onMilestoneRoutineToggle,
}: {
  goal: Parameters<typeof KanbanView>[0]["goal"];
  color: string;
  currentView: GoalView;
  onViewChange: (v: GoalView) => void;
  goalProgress: number;
  milestoneProgress: (mid: string) => number;
  onAddMilestone: () => void;
  onAddTask: (mid: string, t: { title: string; status: TaskStatus; workType: WorkType }) => string;
  onUpdateTask: (mid: string, tid: string, p: { status?: TaskStatus }) => void;
  onRemoveTask: (mid: string, tid: string) => void;
  onRemoveMilestone: (mid: string) => void;
  onMilestoneCharacterChange: (mid: string, ch: "Project" | "Routine") => void;
  onMilestoneRoutineToggle: (mid: string, date: string, currentlyDone: boolean) => void;
}) {
  const isMixed = goal.character === "Mixed";

  return (
    <>
      <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
          {currentView === "tree" ? "Drzewo" : currentView === "kanban" ? "Kanban" : "Roadmap"}
        </h2>
        <div className="flex items-center gap-3">
          <GoalViewSwitcher value={currentView} onChange={onViewChange} />
          <button
            onClick={onAddMilestone}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus size={14} /> Milestone
          </button>
        </div>
      </div>

      {currentView === "kanban" ? (
        <KanbanView
          goal={goal}
          onUpdateTask={(mid, tid, patch) => onUpdateTask(mid, tid, patch)}
        />
      ) : currentView === "roadmap" ? (
        <RoadmapView goal={goal} color={color} />
      ) : (
        <TreeView
          goal={goal}
          color={color}
          isMixed={isMixed}
          goalProgress={goalProgress}
          milestoneProgress={milestoneProgress}
          onAddMilestone={onAddMilestone}
          onAddTask={onAddTask}
          onUpdateTask={onUpdateTask}
          onRemoveTask={onRemoveTask}
          onRemoveMilestone={onRemoveMilestone}
          onMilestoneCharacterChange={onMilestoneCharacterChange}
          onMilestoneRoutineToggle={onMilestoneRoutineToggle}
        />
      )}
    </>
  );
}

function RoutineView({
  goal,
  color,
  onToggle,
  onConfigChange,
}: {
  goal: { id: string; title: string; routineConfig?: RoutineConfig };
  color: string;
  onToggle: (date: string, currentlyDone: boolean) => void;
  onConfigChange: (c: RoutineConfig) => void;
}) {
  const cfg = goal.routineConfig;
  const stats = getRoutineStats(goal as Parameters<typeof getRoutineStats>[0]);
  const today = format(new Date(), "yyyy-MM-dd");
  const todayDone = cfg?.completions.find((c) => c.date === today)?.completed ?? false;

  if (!cfg) return null;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">
            Status rutyny
          </h2>
          <button
            onClick={() => onToggle(today, todayDone)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium ${
              todayDone
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-neutral-900 text-white"
            }`}
          >
            {todayDone ? "Dziś zrobione ✓" : "Oznacz dzisiaj"}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <Stat label="Streak" value={`${stats?.currentStreak ?? 0} dni`} />
          <Stat label="Najdłuższy" value={`${stats?.longestStreak ?? 0} dni`} />
          <Stat label="Ten tydzień" value={`${stats?.thisWeekDone ?? 0} / ${stats?.weeklyTarget ?? 0}`} />
          <Stat label="Łącznie" value={`${stats?.totalDone ?? 0}×`} />
        </div>

        <Heatmap
          completions={cfg.completions}
          color={color}
          weeks={12}
          onToggle={onToggle}
        />
      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-5">
        <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-4">
          Konfiguracja
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Częstość</label>
            <select
              value={cfg.frequency}
              onChange={(e) =>
                onConfigChange({
                  ...cfg,
                  frequency: e.target.value as RoutineConfig["frequency"],
                })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
            >
              <option value="daily">Codziennie</option>
              <option value="weekly">Razy w tygodniu</option>
              <option value="custom">Wybrane dni</option>
            </select>
          </div>
          {cfg.frequency === "weekly" ? (
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Razy / tydz</label>
              <input
                type="number"
                min={1}
                max={7}
                value={cfg.timesPerWeek ?? 1}
                onChange={(e) =>
                  onConfigChange({ ...cfg, timesPerWeek: Number(e.target.value) })
                }
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
              />
            </div>
          ) : null}
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Czas iteracji (min)</label>
            <input
              type="number"
              min={5}
              max={240}
              value={cfg.durationMinutes}
              onChange={(e) =>
                onConfigChange({ ...cfg, durationMinutes: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Typ pracy</label>
            <select
              value={cfg.workType}
              onChange={(e) =>
                onConfigChange({ ...cfg, workType: e.target.value as RoutineConfig["workType"] })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg"
            >
              <option value="physical">Fizyczne</option>
              <option value="reflective">Refleksja</option>
              <option value="social">Społeczne</option>
              <option value="creative">Kreatywne</option>
              <option value="deep">Głęboka praca</option>
              <option value="shallow">Operacyjne</option>
              <option value="admin">Admin</option>
              <option value="routine">Rutyna</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-neutral-50 rounded-lg p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </div>
  );
}

