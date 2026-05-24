"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { Modal } from "@/components/Modal";
import { PillarIcon } from "@/components/PillarIcon";
import { StatCard, StatCardHeader, Button } from "@/components/ui";
import type { GoalCharacter, Pillar } from "@/lib/types";

const PILLAR_COLORS = [
  "#6366f1", "#ec4899", "#14b8a6", "#f59e0b",
  "#8b5cf6", "#10b981", "#ef4444", "#0891b2",
  "#d97706", "#84cc16", "#a3a3a3",
];

export function PillarsSection() {
  const pillars = useStore((s) => s.layers?.pillars ?? []);
  const addPillar = useStore((s) => s.addPillar);
  const addGoal = useStore((s) => s.addGoal);

  const [addGoalForId, setAddGoalForId] = useState<string | null>(null);

  const addingFor = pillars.find((p) => p.id === addGoalForId) ?? null;

  return (
    <>
      <StatCard>
        <StatCardHeader
          label="Moje filary"
          right={
            <Link href="/calculator" className="hover:text-neutral-900">
              Kalkulator →
            </Link>
          }
        />

        {pillars.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-neutral-500 mb-3">
              Brak filarów. Dodaj pierwszy →
            </p>
            <Button
              onClick={() =>
                addPillar({
                  name: "Nowy filar",
                  icon: "Circle",
                  color: PILLAR_COLORS[0],
                  weight: 1,
                })
              }
            >
              <Plus size={14} /> Pierwszy filar
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {pillars.map((p) => (
              <li key={p.id} className="group">
                <div
                  className="relative flex items-center gap-3 rounded-2xl pl-4 pr-2 py-2.5 transition-all border border-transparent hover:border-neutral-200/70"
                  style={{
                    backgroundColor: `${p.color}0d`,
                  }}
                >
                  <span
                    className="absolute left-1.5 top-2.5 bottom-2.5 w-[3px] rounded-full"
                    style={{ backgroundColor: p.color }}
                    aria-hidden
                  />
                  <Link
                    href={`/pillar/${p.id}`}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${p.color}26` }}
                    >
                      <PillarIcon name={p.icon} color={p.color} size={16} />
                    </span>
                    <span className="font-semibold text-neutral-900 truncate">
                      {p.name}
                    </span>
                  </Link>
                  <button
                    onClick={() => setAddGoalForId(p.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900 px-2.5 py-1.5 rounded-full bg-white/70 hover:bg-white border border-neutral-200/60 hover:border-neutral-300 transition-colors shrink-0"
                    aria-label={`Dodaj cel do ${p.name}`}
                  >
                    <Plus size={12} /> Cel
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {pillars.length > 0 ? (
          <button
            onClick={() =>
              addPillar({
                name: "Nowy filar",
                icon: "Circle",
                color: PILLAR_COLORS[pillars.length % PILLAR_COLORS.length],
                weight: 1,
              })
            }
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900"
          >
            <Plus size={12} /> Dodaj filar
          </button>
        ) : null}
      </StatCard>

      {addingFor ? (
        <AddGoalModal
          pillar={addingFor}
          onClose={() => setAddGoalForId(null)}
          onAdd={(g) => {
            const newId = addGoal({
              pillarId: addingFor.id,
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
            setAddGoalForId(null);
            if (typeof window !== "undefined")
              window.location.href = `/goal/${newId}`;
          }}
        />
      ) : null}
    </>
  );
}

function AddGoalModal({
  pillar,
  onClose,
  onAdd,
}: {
  pillar: Pillar;
  onClose: () => void;
  onAdd: (g: {
    title: string;
    character: GoalCharacter;
    deadline?: string;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [character, setCharacter] = useState<GoalCharacter>("Project");
  const [deadline, setDeadline] = useState("");

  return (
    <Modal open onClose={onClose} title={`Nowy cel — ${pillar.name}`}>
      <div className="space-y-4">
        <div>
          <label className="block stat-label mb-1.5">Tytuł</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            placeholder="Np. Skończyć tezę"
            className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400"
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
                {c === "Project"
                  ? "Projekt"
                  : c === "Routine"
                    ? "Rutyna"
                    : "Mieszany"}
              </button>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-1.5">
            {character === "Project"
              ? "Projekt ma deadline, milestones i taski."
              : character === "Routine"
                ? "Rutyna to powtarzalna aktywność — częstotliwość ustawisz dalej."
                : "Mieszany łączy projekt z rutynami w jednej hierarchii."}
          </p>
        </div>
        {character !== "Routine" ? (
          <div>
            <label className="block stat-label mb-1.5">Deadline (opcj.)</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-xl text-sm focus:outline-none focus:border-neutral-400"
            />
          </div>
        ) : null}
        <div className="flex gap-2 pt-2">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Anuluj
          </Button>
          <Button
            onClick={() =>
              onAdd({
                title: title.trim(),
                character,
                deadline: deadline || undefined,
              })
            }
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
