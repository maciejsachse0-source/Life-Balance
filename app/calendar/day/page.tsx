"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { ThoughtsQuickAdd } from "@/components/ThoughtsQuickAdd";
import { addDays, format, getDay } from "date-fns";
import { pl } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check, X, Play, Sparkles } from "lucide-react";
import type { DayOfWeek, Slot } from "@/lib/types";
import { minuteToTimeStr } from "@/lib/utils";
import { suggestForSlot } from "@/lib/suggestions";

export default function DayCalendarPage() {
  const hydrated = useHydrated();
  const state = useStore();
  const slots = state.calendar.template.slots;
  const pillars = state.layers.pillars;
  const physiology = state.layers.physiology;
  const lifeTaxes = state.layers.lifeTaxes;
  const completions = state.slotCompletions;
  const toggleCompletion = state.toggleSlotCompletion;
  const [offset, setOffset] = useState(0);
  const [openSuggestions, setOpenSuggestions] = useState<string | null>(null);

  if (!hydrated) return <Spinner />;

  const day = addDays(new Date(), offset);
  const dow = getDay(day) as DayOfWeek;
  const dateStr = format(day, "yyyy-MM-dd");

  const todaySlots: Slot[] = slots
    .filter((s) => s.dayOfWeek === dow)
    .sort((a, b) => a.startMinute - b.startMinute);

  const now = new Date();
  const isToday = offset === 0;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const currentSlot = isToday
    ? todaySlots.find((s) => nowMin >= s.startMinute && nowMin < s.startMinute + s.durationMinutes)
    : null;

  const getColor = (s: Slot) =>
    pillars.find((p) => p.id === s.pillarId)?.color ??
    (physiology.find((c) => c.id === s.pillarId) ? "#a3a3a3" : "#737373");
  const getLabel = (s: Slot) =>
    pillars.find((p) => p.id === s.pillarId)?.name ??
    physiology.find((c) => c.id === s.pillarId)?.name ??
    lifeTaxes.find((c) => c.id === s.pillarId)?.name ??
    "?";

  const isCompleted = (slotId: string) =>
    completions.find((c) => c.slotId === slotId && c.date === dateStr)?.completed ?? null;

  const weekStartDate = format(addDays(day, dow === 0 ? -6 : 1 - dow), "yyyy-MM-dd");

  const mark = (slotId: string, completed: boolean) =>
    toggleCompletion(slotId, weekStartDate, dateStr, completed);

  return (
    <main className="max-w-screen-xl mx-auto px-4 py-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => setOffset((o) => o - 1)} className="p-1.5 hover:bg-neutral-100 rounded">
          <ChevronLeft size={18} />
        </button>
        <div className="text-sm font-medium">
          {isToday ? "Dziś · " : ""}
          {format(day, "EEEE, d MMMM yyyy", { locale: pl })}
        </div>
        <button onClick={() => setOffset((o) => o + 1)} className="p-1.5 hover:bg-neutral-100 rounded">
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="space-y-2">
        {todaySlots.map((s) => {
          const isCurrent = currentSlot?.id === s.id;
          const completed = isCompleted(s.id);
          const color = getColor(s);
          const elapsed = isCurrent
            ? Math.max(0, Math.min(1, (nowMin - s.startMinute) / s.durationMinutes))
            : 0;
          const suggestions = suggestForSlot(state, s);
          const main = suggestions[0];
          const alts = suggestions.slice(1, 5);
          const isOpen = openSuggestions === s.id;
          return (
            <div
              key={s.id}
              className={`relative bg-white border rounded-lg overflow-hidden transition-all ${
                isCurrent ? "border-indigo-500 ring-2 ring-indigo-200" : "border-neutral-200"
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: color }}
            >
              {isCurrent ? (
                <div
                  className="absolute top-0 left-0 h-0.5 bg-indigo-500 transition-all"
                  style={{ width: `${elapsed * 100}%` }}
                />
              ) : null}
              <div className="p-3">
                <div className="flex items-center justify-between mb-1">
                  <div className="text-xs text-neutral-500">
                    {minuteToTimeStr(s.startMinute)}–
                    {minuteToTimeStr(s.startMinute + s.durationMinutes)} ·{" "}
                    {Math.round(s.durationMinutes / 60 * 10) / 10}h · {s.workType}
                  </div>
                  {isCurrent ? (
                    <span className="text-[10px] uppercase tracking-wider text-indigo-600 font-medium">
                      Teraz
                    </span>
                  ) : null}
                </div>
                {main && completed === null ? (
                  <div className="mb-2 flex items-center gap-2 text-xs bg-neutral-50 rounded px-2 py-1">
                    <Sparkles size={12} className="text-amber-500 shrink-0" />
                    <span className="font-medium text-neutral-700 truncate">
                      Sugestia: {main.task?.title ?? main.goal.title}
                    </span>
                    {alts.length > 0 ? (
                      <button
                        onClick={() => setOpenSuggestions(isOpen ? null : s.id)}
                        className="ml-auto text-indigo-600 hover:text-indigo-700 shrink-0"
                      >
                        {isOpen ? "Zamknij" : `Inne (${alts.length})`}
                      </button>
                    ) : null}
                  </div>
                ) : null}
                {isOpen && alts.length > 0 ? (
                  <ul className="mb-2 ml-4 text-xs text-neutral-600 space-y-0.5">
                    {alts.map((a, i) => (
                      <li key={i}>
                        · {a.task?.title ?? a.goal.title}{" "}
                        <span className="text-neutral-400">({a.priority})</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold" style={{ color }}>
                    {getLabel(s)}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    {completed === true ? (
                      <span className="text-xs px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                        Zrealizowane
                      </span>
                    ) : completed === false ? (
                      <span className="text-xs px-2 py-1 bg-neutral-100 text-neutral-600 rounded">
                        Nieukończone
                      </span>
                    ) : isCurrent ? (
                      <Link
                        href={`/focus/${s.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                      >
                        <Play size={12} /> Zacznij
                      </Link>
                    ) : (
                      <>
                        <Link
                          href={`/focus/${s.id}`}
                          className="p-1.5 hover:bg-indigo-50 hover:text-indigo-700 text-neutral-400 rounded"
                          aria-label="Zacznij"
                        >
                          <Play size={14} />
                        </Link>
                        <button
                          onClick={() => mark(s.id, true)}
                          className="p-1.5 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-400 rounded"
                          aria-label="Pomiń jako zrealizowane"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={() => mark(s.id, false)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 text-neutral-400 rounded"
                          aria-label="Pomiń jako nieukończone"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {todaySlots.length === 0 ? (
          <div className="text-center text-neutral-400 py-12 text-sm">Brak slotów na ten dzień.</div>
        ) : null}
      </div>

      {/* Today thought */}
      <section className="mt-8 bg-white border border-neutral-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wide mb-2">
          Dziś przemyślałem
        </h3>
        <ThoughtsQuickAdd />
      </section>
    </main>
  );
}
