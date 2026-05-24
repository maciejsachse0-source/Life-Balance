"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { PillarIcon } from "@/components/PillarIcon";
import { Modal } from "@/components/Modal";
import { SideNav } from "@/components/SideNav";
import {
  AppShell,
  StatCard,
  StatCardHeader,
  StatDivider,
  Stat,
  StatGrid,
  Button,
  Column,
} from "@/components/ui";
import { InlineTextarea } from "@/components/InlineTextarea";
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
  const updatePillar = useStore((s) => s.updatePillar);
  const [showAdd, setShowAdd] = useState(false);

  if (!hydrated) return <Spinner />;

  const pillar = state.layers.pillars.find((p) => p.id === id);
  if (!pillar) {
    return (
      <AppShell>
        <StatCard>
          <p className="text-neutral-700 text-center">Filar nie znaleziony.</p>
          <div className="text-center mt-3">
            <Link href="/dashboard" className="text-sm text-neutral-500 hover:text-neutral-900">
              ← Dashboard
            </Link>
          </div>
        </StatCard>
      </AppShell>
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
    <>
      <AppShell>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-neutral-600 hover:text-neutral-900 mb-1 px-2"
        >
          <ArrowLeft size={14} /> Dashboard
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Column className="lg:col-span-5">
            {/* Hero card with pillar identity + why */}
            <StatCard>
              <div className="flex items-start gap-4">
                <div
                  className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${pillar.color}22` }}
                >
                  <PillarIcon name={pillar.icon} color={pillar.color} size={28} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="stat-label" style={{ color: pillar.color }}>
                    Filar · waga {pillar.weight}
                  </div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight">
                    {pillar.name}
                  </h1>
                </div>
              </div>

              <StatDivider />

              <WhyField
                label="Po co ten filar"
                value={pillar.mission ?? ""}
                onChange={(v) =>
                  updatePillar(pillar.id, { mission: v.trim() || undefined })
                }
                placeholder="Aby… (np. żeby utrzymać energię i ostrość umysłu na lata)"
                accent={pillar.color}
                emphasis="primary"
              />

              <StatDivider />

              <WhyField
                label="Dokąd zmierzam"
                value={pillar.vision ?? ""}
                onChange={(v) =>
                  updatePillar(pillar.id, { vision: v.trim() || undefined })
                }
                placeholder="…tak by (np. móc biegać 10km bez zadyszki i spać 8h głębokim snem)"
                accent={pillar.color}
                emphasis="secondary"
              />
            </StatCard>

            {/* Metrics */}
            <StatCard>
              <StatCardHeader label="Metryki" />
              <StatGrid cols={2}>
                <Stat
                  label="Cel tygodniowy"
                  value={(allocation?.hoursPerWeek ?? 0).toFixed(1)}
                  unit="h"
                  dotColor={pillar.color}
                />
                <Stat
                  label="Faktyczne (msc)"
                  value={(balance?.actualH ?? 0).toFixed(1)}
                  unit="h"
                />
                <Stat label="Aktywne cele" value={String(activeGoals.length)} />
                <Stat
                  label="Najbliższy deadline"
                  value={
                    upcomingDeadline?.deadline
                      ? new Date(upcomingDeadline.deadline).toLocaleDateString("pl")
                      : "—"
                  }
                />
              </StatGrid>
            </StatCard>
          </Column>

          <Column className="lg:col-span-7">
            {/* Goals */}
            <StatCard>
              <StatCardHeader
                label="Cele"
                right={
                  <button
                    onClick={() => setShowAdd(true)}
                    className="inline-flex items-center gap-1 hover:text-neutral-900"
                  >
                    <Plus size={12} /> Dodaj cel
                  </button>
                }
              />

              {goals.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-neutral-500 text-sm mb-3">Brak celów. Dodaj pierwszy →</p>
                  <Button onClick={() => setShowAdd(true)}>
                    <Plus size={14} /> Pierwszy cel
                  </Button>
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
            </StatCard>
          </Column>
        </div>
      </AppShell>

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

      <SideNav />
    </>
  );
}

function WhyField({
  label,
  value,
  onChange,
  placeholder,
  accent,
  emphasis,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accent: string;
  emphasis: "primary" | "secondary";
}) {
  return (
    <div className="py-1">
      <div className="stat-label mb-2 flex items-center">
        <span
          className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 shrink-0"
          style={{ backgroundColor: accent }}
        />
        <span>{label}</span>
      </div>
      <InlineTextarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        minRows={2}
        className={
          emphasis === "primary"
            ? "text-base sm:text-lg text-neutral-800 leading-relaxed"
            : "text-sm text-neutral-700 leading-relaxed"
        }
      />
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
          <label className="block stat-label mb-1.5">Tytuł</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Np. Skończyć tezę"
            className="w-full px-3 py-2 bg-white/70 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400"
          />
        </div>
        <div>
          <label className="block stat-label mb-1.5">Charakter</label>
          <div className="grid grid-cols-3 gap-2">
            {(["Project", "Routine", "Mixed"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCharacter(c)}
                className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                  character === c
                    ? "border-neutral-900 bg-neutral-900 text-white"
                    : "border-neutral-200 text-neutral-700 hover:border-neutral-400"
                }`}
              >
                {c === "Project" ? "Projekt" : c === "Routine" ? "Rutyna" : "Mieszany"}
              </button>
            ))}
          </div>
        </div>
        {character !== "Routine" ? (
          <div>
            <label className="block stat-label mb-1.5">Deadline (opcj.)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-white/70 border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400"
            />
          </div>
        ) : null}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Anuluj
          </Button>
          <Button
            onClick={() => onAdd({ title: title.trim(), character, deadline: deadline || undefined })}
            disabled={!title.trim()}
            className="flex-1 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Dodaj
          </Button>
        </div>
      </div>
    </Modal>
  );
}
