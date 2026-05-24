"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { resolveSlotContext } from "@/lib/slot-context";
import { minuteToTimeStr } from "@/lib/utils";
import { addDays, format, getDay } from "date-fns";
import { Check, Play, Sparkles } from "lucide-react";
import { StatCard, StatCardHeader } from "@/components/ui";
import type { DayOfWeek, Slot } from "@/lib/types";

// Day spans we draw on the 24h strip — keeps the bar visually anchored.
const STRIP_START_HOUR = 6;
const STRIP_END_HOUR = 24;
const STRIP_RANGE = (STRIP_END_HOUR - STRIP_START_HOUR) * 60;

export function DayTodayCard() {
  const state = useStore();
  const toggleCompletion = useStore((s) => s.toggleSlotCompletion);
  const pillars = state.layers.pillars;
  const physiology = state.layers.physiology;
  const lifeTaxes = state.layers.lifeTaxes;

  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const today = now;
  const dow = getDay(today) as DayOfWeek;
  const dateStr = format(today, "yyyy-MM-dd");
  const weekStartDate = format(
    addDays(today, dow === 0 ? -6 : 1 - dow),
    "yyyy-MM-dd",
  );
  const nowMin = today.getHours() * 60 + today.getMinutes();

  const slots: Slot[] = state.calendar.template.slots
    .filter((s) => s.dayOfWeek === dow)
    .sort((a, b) => a.startMinute - b.startMinute);

  const completionMap = new Map(
    state.slotCompletions
      .filter((c) => c.date === dateStr)
      .map((c) => [c.slotId, c.completed]),
  );

  const getColor = (s: Slot): string =>
    pillars.find((p) => p.id === s.pillarId)?.color ??
    (physiology.find((c) => c.id === s.pillarId) ? "#a3a3a3" : "#d4d4d4");
  const getLabel = (s: Slot): string =>
    pillars.find((p) => p.id === s.pillarId)?.name ??
    physiology.find((c) => c.id === s.pillarId)?.name ??
    lifeTaxes.find((c) => c.id === s.pillarId)?.name ??
    "—";

  const current = slots.find(
    (s) => nowMin >= s.startMinute && nowMin < s.startMinute + s.durationMinutes,
  );
  const upcoming = slots
    .filter((s) => s.startMinute >= nowMin && s.id !== current?.id)
    .slice(0, 3);

  const completedCount = slots.filter((s) => completionMap.get(s.id) === true).length;

  const nowStripPct = clamp01((nowMin - STRIP_START_HOUR * 60) / STRIP_RANGE) * 100;

  return (
    <StatCard>
      <StatCardHeader
        label="Dziś"
        right={
          <Link href="/calendar/day" className="hover:text-neutral-900">
            Cały dzień →
          </Link>
        }
      />

      {slots.length === 0 ? (
        <div className="py-4">
          <p className="text-sm text-neutral-500 leading-relaxed">
            Brak slotów na dziś. Wygeneruj domyślny tydzień w{" "}
            <Link href="/calculator" className="text-neutral-900 underline-offset-2 hover:underline">
              kalkulatorze
            </Link>{" "}
            albo dodaj sloty w{" "}
            <Link href="/calendar/week" className="text-neutral-900 underline-offset-2 hover:underline">
              kalendarzu tygodniowym
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          {/* 24h-ish strip with colored slot segments + current-time marker */}
          <div className="relative mb-4">
            <div
              className="relative h-6 rounded-full bg-neutral-100/80 overflow-hidden"
              role="img"
              aria-label="Plan dnia"
            >
              {slots.map((s) => {
                const left = clamp01(
                  (s.startMinute - STRIP_START_HOUR * 60) / STRIP_RANGE,
                );
                const width = clamp01(s.durationMinutes / STRIP_RANGE);
                const done = completionMap.get(s.id) === true;
                return (
                  <span
                    key={s.id}
                    className="absolute top-0 bottom-0 transition-opacity"
                    style={{
                      left: `${left * 100}%`,
                      width: `${width * 100}%`,
                      backgroundColor: getColor(s),
                      opacity: done ? 1 : 0.5,
                    }}
                    title={`${minuteToTimeStr(s.startMinute)} · ${getLabel(s)}`}
                  />
                );
              })}
              <span
                className="absolute top-0 bottom-0 w-px bg-neutral-900/80"
                style={{ left: `${nowStripPct}%` }}
                aria-hidden
              >
                <span className="absolute -top-1 -translate-x-1/2 w-2 h-2 rounded-full bg-neutral-900" />
              </span>
            </div>
            <div className="flex justify-between mt-1.5 text-[10px] text-neutral-400 tabular-nums">
              <span>{STRIP_START_HOUR}:00</span>
              <span className="text-neutral-700 font-medium">
                teraz {minuteToTimeStr(nowMin)}
              </span>
              <span>{STRIP_END_HOUR === 24 ? "0:00" : `${STRIP_END_HOUR}:00`}</span>
            </div>
          </div>

          {/* Current slot */}
          {current ? (
            <CurrentSlotRow
              slot={current}
              label={getLabel(current)}
              color={getColor(current)}
              context={resolveSlotContext(state, current)}
              nowMin={nowMin}
              onComplete={() =>
                toggleCompletion(current.id, weekStartDate, dateStr, true)
              }
            />
          ) : (
            <div className="rounded-2xl border border-neutral-200/70 bg-neutral-50/50 px-4 py-3 mb-4">
              <div className="text-xs text-neutral-500">
                {slots.length > 0 && nowMin < slots[0].startMinute
                  ? "Dzień jeszcze się nie zaczął — pierwszy slot za chwilę."
                  : "Pomiędzy slotami. Złap oddech."}
              </div>
            </div>
          )}

          {/* Upcoming */}
          {upcoming.length > 0 ? (
            <div>
              <div className="stat-label mb-2">Dalej</div>
              <ul className="divide-y divide-neutral-100">
                {upcoming.map((s) => (
                  <UpcomingRow
                    key={s.id}
                    slot={s}
                    label={getLabel(s)}
                    color={getColor(s)}
                    context={resolveSlotContext(state, s)}
                    done={completionMap.get(s.id) === true}
                  />
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span className="tabular-nums">
              {completedCount}/{slots.length} zrealizowane
            </span>
            <Link
              href="/calendar/week"
              className="text-neutral-700 hover:text-neutral-900"
            >
              Tydzień →
            </Link>
          </div>
        </>
      )}
    </StatCard>
  );
}

function CurrentSlotRow({
  slot,
  label,
  color,
  context,
  nowMin,
  onComplete,
}: {
  slot: Slot;
  label: string;
  color: string;
  context: ReturnType<typeof resolveSlotContext>;
  nowMin: number;
  onComplete: () => void;
}) {
  const elapsed = clamp01((nowMin - slot.startMinute) / slot.durationMinutes);
  const remaining = Math.max(0, slot.startMinute + slot.durationMinutes - nowMin);

  return (
    <div
      className="relative rounded-2xl border bg-white px-4 py-3 mb-4 overflow-hidden"
      style={{ borderColor: `${color}50` }}
    >
      <div
        className="absolute top-0 left-0 h-0.5 transition-all"
        style={{ width: `${elapsed * 100}%`, backgroundColor: color }}
      />
      <div className="flex items-start gap-3">
        <span
          className="mt-1 w-1 self-stretch rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="stat-label !text-[10px] !tracking-[0.2em]">
              Teraz
            </span>
            <span className="text-xs text-neutral-500 tabular-nums">
              {minuteToTimeStr(slot.startMinute)}–
              {minuteToTimeStr(slot.startMinute + slot.durationMinutes)}
            </span>
            <span className="text-xs text-neutral-400">
              · {remaining} min do końca
            </span>
          </div>
          <div className="flex items-baseline gap-2 min-w-0">
            <span
              className="text-lg font-semibold truncate"
              style={{ color }}
            >
              {label}
            </span>
            <span className="text-xs text-neutral-400 shrink-0">
              {slot.workType}
            </span>
          </div>
          {context.goalTitle ? (
            <div className="mt-1 flex items-center gap-1.5 text-sm text-neutral-700 min-w-0">
              {context.isSuggestion ? (
                <Sparkles size={11} className="text-amber-500 shrink-0" />
              ) : null}
              <span className="truncate">
                {context.taskTitle ?? context.goalTitle}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onComplete}
            className="p-2 rounded-full text-neutral-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            aria-label="Oznacz jako zrobione"
            title="Oznacz jako zrobione"
          >
            <Check size={16} />
          </button>
          <Link
            href={`/focus/${slot.id}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors"
          >
            <Play size={11} /> Zacznij
          </Link>
        </div>
      </div>
    </div>
  );
}

function UpcomingRow({
  slot,
  label,
  color,
  context,
  done,
}: {
  slot: Slot;
  label: string;
  color: string;
  context: ReturnType<typeof resolveSlotContext>;
  done: boolean;
}) {
  return (
    <li className="py-2 first:pt-1 flex items-center gap-3">
      <span className="text-xs text-neutral-500 tabular-nums w-12 shrink-0">
        {minuteToTimeStr(slot.startMinute)}
      </span>
      <span
        className="w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 min-w-0">
          <span
            className={`text-sm font-medium truncate ${done ? "text-neutral-400 line-through" : "text-neutral-900"}`}
          >
            {label}
          </span>
          {context.taskTitle ?? context.goalTitle ? (
            <span className="text-xs text-neutral-500 truncate min-w-0">
              · {context.taskTitle ?? context.goalTitle}
            </span>
          ) : null}
        </div>
      </div>
      <span className="text-[10px] text-neutral-400 shrink-0 tabular-nums">
        {Math.round((slot.durationMinutes / 60) * 10) / 10}h
      </span>
    </li>
  );
}

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}
