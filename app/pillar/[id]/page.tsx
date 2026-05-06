"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { PillarIcon } from "@/components/PillarIcon";
import { Modal } from "@/components/Modal";
import { BottomNav } from "@/components/BottomNav";
import { computeAllocation } from "@/lib/utils";
import { computePillarBalances } from "@/lib/balance";
import { ArrowLeft, Plus } from "lucide-react";
import type { GoalCharacter } from "@/lib/types";
import { GoalCard } from "@/components/goal/GoalCard";

export default function PillarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const hydrated = useHydrated();
  const state = useStore();
  const addGoal = useStore((s) => s.addGoal);
  const [showAdd, setShowAdd] = useState(false);

  if (!hydrated) return <Spinner />;

  const pillar = state.layers.pillars.find((p) => p.id === id);
  if (!pillar) {
    return (
      <main className="p-8 text-center">
        <p className="text-neutral-500">Filar nie znaleziony.</p>
        <Link href="/dashboard" className="text-indigo-600">
          ← Dashboard
        </Link>
      </main>
    );
  }

  const allocation = computeAllocation(state.layers).perPillar[id];
  const balance = computePillarBalances(state).find((b) => b.pillarId === id);
  const goals = state.goals.filter((g) => g.pillarId === id);
  const activeGoals = goals.filter((g) => g.status === "Active");
  const upcomingDeadline = goals
    .filter((g) => g.deadline)
    .sort((a, b) => (a.deadline! < b.deadline! ? -1 : 1))[0];

  return (
    <main className="pb-24">
      <header
        className="px-4 py-6 sm:px-6 text-white"
        style={{ background: `linear-gradient(135deg, ${pillar.color}, ${pillar.color}cc)` }}
      >
        <div className="max-w-5xl mx-auto">
          <Link href="/dashboard" className="inline-flex items-center gap-1 text-white/80 hover:text-white text-sm mb-3">
            <ArrowLeft size={14} /> Dashboard
          </Link>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center">
              <PillarIcon name={pillar.icon} size={32} />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{pillar.name}</h1>
              {pillar.vision ? <p className="text-white/80 mt-1">{pillar.vision}</p> : null}
              {pillar.mission ? <p className="text-white/70 text-sm mt-1">{pillar.mission}</p> : null}
            </div>
          </div>
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Cel" value={`${(allocation?.hoursPerWeek ?? 0).toFixed(1)}h/tydz`} />
          <Metric label="Faktyczne" value={`${(balance?.actualH ?? 0).toFixed(1)}h`} />
          <Metric label="Aktywne cele" value={String(activeGoals.length)} />
          <Metric
            label="Najbliższy deadline"
            value={
              upcomingDeadline?.deadline
                ? new Date(upcomingDeadline.deadline).toLocaleDateString("pl")
                : "—"
            }
          />
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 mt-6">
        <header className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-medium text-neutral-500 uppercase tracking-wide">Cele</h2>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
          >
            <Plus size={14} /> Dodaj cel
          </button>
        </header>

        {goals.length === 0 ? (
          <div className="bg-white border border-dashed border-neutral-300 rounded-xl p-6 text-center">
            <p className="text-neutral-500 text-sm mb-3">Brak celów. Dodaj pierwszy →</p>
            <button
              onClick={() => setShowAdd(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm"
            >
              <Plus size={14} /> Pierwszy cel
            </button>
          </div>
        ) : (
          <ul className="space-y-2">
            {goals.map((g) => (
              <li key={g.id}>
                <GoalCard goal={g} pillar={pillar} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddGoalModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={(g) => {
          const newId = addGoal({
            pillarId: id,
            title: g.title,
            character: g.character,
            status: "Active",
            weight: g.character !== "Routine" ? 5 : undefined,
            deadline: g.deadline,
            milestones: g.character !== "Routine" ? [] : undefined,
            routineConfig:
              g.character === "Routine"
                ? {
                    frequency: "daily",
                    durationMinutes: 30,
                    workType: "physical",
                    completions: [],
                  }
                : undefined,
          });
          setShowAdd(false);
          if (typeof window !== "undefined") window.location.href = `/goal/${newId}`;
        }}
      />

      <BottomNav />
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-neutral-200 rounded-lg p-3">
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function AddGoalModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (g: { title: string; character: GoalCharacter; deadline?: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [character, setCharacter] = useState<GoalCharacter>("Project");
  const [deadline, setDeadline] = useState("");

  return (
    <Modal open={open} onClose={onClose} title="Nowy cel">
      <div className="space-y-4">
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Tytuł</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Np. Skończyć tezę"
            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
          />
        </div>
        <div>
          <label className="block text-xs text-neutral-500 mb-1">Charakter</label>
          <div className="grid grid-cols-3 gap-2">
            {(["Project", "Routine", "Mixed"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCharacter(c)}
                className={`px-3 py-2 rounded-lg border text-sm ${
                  character === c
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-300"
                }`}
              >
                {c === "Project" ? "Projekt" : c === "Routine" ? "Rutyna" : "Mieszany"}
              </button>
            ))}
          </div>
        </div>
        {character !== "Routine" ? (
          <div>
            <label className="block text-xs text-neutral-500 mb-1">Deadline (opcj.)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
            />
          </div>
        ) : null}
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 px-4 py-2 border border-neutral-200 rounded-lg text-sm">
            Anuluj
          </button>
          <button
            onClick={() => onAdd({ title: title.trim(), character, deadline: deadline || undefined })}
            disabled={!title.trim()}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:bg-neutral-300"
          >
            Dodaj
          </button>
        </div>
      </div>
    </Modal>
  );
}
