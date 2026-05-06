"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { Trash2, X, Play } from "lucide-react";
import type { Slot, WorkType, DayOfWeek } from "@/lib/types";
import { DAY_NAMES_LONG, minuteToTimeStr } from "@/lib/utils";

const WORK_TYPES: WorkType[] = [
  "deep",
  "shallow",
  "creative",
  "admin",
  "physical",
  "social",
  "reflective",
  "routine",
  "buffer",
];

const WORK_TYPE_LABELS: Record<WorkType, string> = {
  deep: "Praca głęboka",
  shallow: "Praca operacyjna",
  creative: "Kreatywna",
  admin: "Admin / emaile",
  physical: "Ciało / sport",
  social: "Relacje",
  reflective: "Refleksja",
  routine: "Rutyna fizjologii",
  buffer: "Bufor",
};

type Props = {
  slot: Slot;
  onClose: () => void;
};

export function SlotEditPanel({ slot, onClose }: Props) {
  const pillars = useStore((s) => s.layers.pillars);
  const physiology = useStore((s) => s.layers.physiology);
  const lifeTaxes = useStore((s) => s.layers.lifeTaxes);
  const goals = useStore((s) => s.goals);
  const updateSlot = useStore((s) => s.updateSlot);
  const removeSlot = useStore((s) => s.removeSlot);

  const [draft, setDraft] = useState<Slot>(slot);

  useEffect(() => setDraft(slot), [slot]);

  const allItems = [
    ...pillars.map((p) => ({ id: p.id, name: p.name, color: p.color, group: "Filary" as const })),
    ...physiology.map((c) => ({ id: c.id, name: c.name, color: "#a3a3a3", group: "Fizjologia" as const })),
    ...lifeTaxes.map((c) => ({ id: c.id, name: c.name, color: "#737373", group: "Podatki" as const })),
  ];

  const eligibleGoals = goals.filter(
    (g) => g.pillarId === draft.pillarId && g.status === "Active",
  );

  const save = () => {
    updateSlot(slot.id, draft);
    onClose();
  };

  const onDelete = () => {
    if (!confirm("Usunąć slot?")) return;
    removeSlot(slot.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-stretch justify-end bg-black/30">
      <div
        className="bg-white w-full sm:max-w-md shadow-xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-5 py-3 border-b border-neutral-200">
          <div>
            <h2 className="font-semibold">Edycja slotu</h2>
            <p className="text-xs text-neutral-500">
              {DAY_NAMES_LONG[slot.dayOfWeek]} · {minuteToTimeStr(slot.startMinute)}–
              {minuteToTimeStr(slot.startMinute + slot.durationMinutes)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700"
            aria-label="Zamknij"
          >
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Pillar / category */}
          <Field label="Filar / kategoria">
            <select
              value={draft.pillarId}
              onChange={(e) =>
                setDraft({ ...draft, pillarId: e.target.value, taskId: undefined, goalId: undefined })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              <optgroup label="Filary">
                {pillars.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Fizjologia">
                {physiology.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Podatki życiowe">
                {lifeTaxes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </Field>

          {/* Work type */}
          <Field label="Typ pracy">
            <select
              value={draft.workType}
              onChange={(e) => setDraft({ ...draft, workType: e.target.value as WorkType })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              {WORK_TYPES.map((wt) => (
                <option key={wt} value={wt}>
                  {WORK_TYPE_LABELS[wt]}
                </option>
              ))}
            </select>
          </Field>

          {/* Day */}
          <Field label="Dzień tygodnia">
            <select
              value={draft.dayOfWeek}
              onChange={(e) =>
                setDraft({ ...draft, dayOfWeek: Number(e.target.value) as DayOfWeek })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                <option key={d} value={d}>
                  {DAY_NAMES_LONG[d]}
                </option>
              ))}
            </select>
          </Field>

          {/* Start time */}
          <Field label="Start">
            <select
              value={draft.startMinute}
              onChange={(e) => setDraft({ ...draft, startMinute: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              {Array.from({ length: 48 }, (_, i) => i * 30).map((m) => (
                <option key={m} value={m}>
                  {minuteToTimeStr(m)}
                </option>
              ))}
            </select>
          </Field>

          {/* Duration */}
          <Field label="Czas trwania">
            <select
              value={draft.durationMinutes}
              onChange={(e) =>
                setDraft({ ...draft, durationMinutes: Number(e.target.value) })
              }
              className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
            >
              {[30, 60, 90, 120, 150, 180, 240].map((m) => (
                <option key={m} value={m}>
                  {m >= 60 ? `${Math.floor(m / 60)}h ${m % 60 > 0 ? `${m % 60}min` : ""}` : `${m} min`}
                </option>
              ))}
            </select>
          </Field>

          {/* Goal assignment */}
          {eligibleGoals.length > 0 ? (
            <Field label="Przypisany cel (opcj.)">
              <select
                value={draft.goalId ?? ""}
                onChange={(e) => setDraft({ ...draft, goalId: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm"
              >
                <option value="">— brak —</option>
                {eligibleGoals.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.title}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          {/* Fixed flag */}
          <Field label="">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={!!draft.isFixed}
                onChange={(e) => setDraft({ ...draft, isFixed: e.target.checked })}
                className="accent-indigo-500"
              />
              Slot stały (np. spotkanie z innymi — niewzruszony)
            </label>
          </Field>
        </div>

        <footer className="flex items-center justify-between gap-3 px-5 py-3 border-t border-neutral-200">
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <Trash2 size={14} /> Usuń
          </button>
          <div className="flex gap-2">
            <Link
              href={`/focus/${slot.id}`}
              className="inline-flex items-center gap-1 px-3 py-2 border border-indigo-300 text-indigo-700 rounded-lg text-sm hover:bg-indigo-50"
            >
              <Play size={14} /> Zacznij
            </Link>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 rounded-lg text-sm hover:border-neutral-400"
            >
              Anuluj
            </button>
            <button
              onClick={save}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              Zapisz
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label ? <label className="block text-xs text-neutral-500 mb-1">{label}</label> : null}
      {children}
    </div>
  );
}
