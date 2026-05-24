"use client";

import Link from "next/link";
import { Check, Clock, Flame, Repeat, TrendingUp } from "lucide-react";
import { useStore } from "@/lib/store";
import { useHydrated } from "@/lib/hydration";
import { Spinner } from "@/components/Spinner";
import { SideNav } from "@/components/SideNav";
import { PillarIcon } from "@/components/PillarIcon";
import { startOfIsoWeek } from "@/lib/routine";
import {
  AppShell,
  StatCard,
  StatCardHeader,
  StatHero,
  Stat,
  StatGrid,
  Column,
  LinkButton,
} from "@/components/ui";
import {
  getHabitsForWeek,
  summarizeHabitsWeek,
  DAY_LABELS_PL,
  type HabitWeekDay,
  type HabitWeekItem,
} from "@/lib/habits-week";
import { addDays, format, isAfter, startOfDay } from "date-fns";
import { pl } from "date-fns/locale";
import { uid } from "@/lib/utils";

export default function HabitsPage() {
  const hydrated = useHydrated();
  const state = useStore();
  const toggleRoutineCompletion = useStore((s) => s.toggleRoutineCompletion);
  const updateMilestone = useStore((s) => s.updateMilestone);

  if (!hydrated) return <Spinner />;

  const today = new Date();
  const items = getHabitsForWeek(state, today);
  const summary = summarizeHabitsWeek(items);
  const monday = startOfIsoWeek(today);
  const sunday = addDays(monday, 6);
  const todayStart = startOfDay(today);

  const weekLabel =
    format(monday, "d MMM", { locale: pl }) +
    " — " +
    format(sunday, "d MMM yyyy", { locale: pl });

  const toggleDay = (item: HabitWeekItem, day: HabitWeekDay) => {
    if (isAfter(startOfDay(new Date(day.date)), todayStart)) return;
    const newDone = !day.done;
    if (item.kind === "goal") {
      toggleRoutineCompletion(item.goalId, day.date, newDone);
      return;
    }
    if (!item.milestoneId) return;
    const existing = item.cfg.completions.find((c) => c.date === day.date);
    const completions = existing
      ? item.cfg.completions.map((c) =>
          c.date === day.date ? { ...c, completed: newDone } : c,
        )
      : [
          ...item.cfg.completions,
          { id: uid(), date: day.date, completed: newDone },
        ];
    updateMilestone(item.goalId, item.milestoneId, {
      routineConfig: { ...item.cfg, completions },
    });
  };

  return (
    <>
      <AppShell width="wide">
        <header className="px-2 mb-2 flex items-end justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="stat-label">Habit tracker</div>
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900 mt-1 leading-tight">
              Twoje rutyny.
            </h1>
            <p className="text-sm text-neutral-600 mt-1">
              Tydzień {weekLabel} — wszystkie rutyny i rutynowe kroki celów mieszanych.
            </p>
          </div>
          <LinkButton href="/dashboard" variant="secondary" className="shrink-0">
            ← Dashboard
          </LinkButton>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <Column className="lg:col-span-4">
            <StatCard>
              <StatCardHeader
                label="Ogółem w tym tygodniu"
                right={`${summary.doneSlots}/${summary.totalSlots} pól`}
              />
              <StatHero
                value={`${summary.overallPercent}%`}
                unit={summaryUnit(summary.overallPercent)}
              />
              <StatGrid>
                <Stat
                  label="Rutyny"
                  value={summary.habitsCount.toString()}
                  unit="aktywne"
                />
                <Stat
                  label="Na celu"
                  value={summary.onTrackCount.toString()}
                  unit={`/${summary.habitsCount}`}
                />
              </StatGrid>
            </StatCard>
          </Column>

          <Column className="lg:col-span-8">
            <StatCard>
              <StatCardHeader
                label="Tydzień po dniach"
                right={
                  <span className="inline-flex items-center gap-1">
                    <Repeat size={11} />
                    <span>klik = przełącz</span>
                  </span>
                }
              />

              {items.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <DayHeader days={items[0].days} />
                  <ul className="divide-y divide-neutral-100">
                    {items.map((it) => (
                      <HabitRow
                        key={it.key}
                        item={it}
                        onToggle={(d) => toggleDay(it, d)}
                      />
                    ))}
                  </ul>
                </>
              )}
            </StatCard>
          </Column>
        </div>
      </AppShell>
      <SideNav />
    </>
  );
}

function summaryUnit(p: number): string {
  if (p >= 100) return "świetnie";
  if (p >= 75) return "na kursie";
  if (p >= 50) return "w trakcie";
  if (p >= 25) return "rozpędzaj się";
  return "start";
}

function EmptyState() {
  return (
    <div className="flex items-start gap-3 py-4">
      <Repeat size={18} className="text-neutral-300 mt-0.5 shrink-0" />
      <div className="text-sm text-neutral-500 leading-relaxed">
        <p>
          Nie masz jeszcze rutyn. Dodaj cel typu{" "}
          <span className="text-neutral-700">Rutyna</span> w filarze, albo
          oznacz krok celu <span className="text-neutral-700">Mieszanego</span> jako
          rutynowy.
        </p>
      </div>
    </div>
  );
}

function DayHeader({ days }: { days: HabitWeekDay[] }) {
  return (
    <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-3 items-center mb-2 px-1">
      <div />
      <div className="grid grid-cols-7 gap-1.5">
        {days.map((d) => (
          <div
            key={d.date}
            className={`text-[10px] uppercase tracking-wider text-center font-medium ${
              d.isToday ? "text-neutral-900" : "text-neutral-400"
            }`}
          >
            {DAY_LABELS_PL[shortFromIndex(d.dowIndex)]}
          </div>
        ))}
      </div>
      <div className="w-[88px]" />
    </div>
  );
}

function shortFromIndex(
  i: 0 | 1 | 2 | 3 | 4 | 5 | 6,
): "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun" {
  return (["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const)[i];
}

function HabitRow({
  item,
  onToggle,
}: {
  item: HabitWeekItem;
  onToggle: (d: HabitWeekDay) => void;
}) {
  const freqLabel = formatFrequency(item);
  const percentClass = percentColor(item.weeklyPercent);

  return (
    <li className="py-3.5 first:pt-2">
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 sm:gap-5 items-center">
        {/* Title block */}
        <Link
          href={`/goal/${item.goalId}`}
          className="flex items-center gap-3 min-w-0 -mx-2 px-2 py-1 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          <span
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${item.pillarColor}1f` }}
          >
            <PillarIcon name={item.pillarIcon} color={item.pillarColor} size={17} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-neutral-900 truncate">
                {item.habitTitle}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 shrink-0 tabular-nums">
                <Clock size={9} /> {item.durationMinutes}m
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: item.pillarColor }}
              />
              <span className="truncate">
                {item.pillarName}
                {item.kind === "milestone" ? (
                  <>
                    <span className="text-neutral-300"> · </span>
                    <span>{item.parentGoalTitle}</span>
                  </>
                ) : null}
                <span className="text-neutral-300"> · </span>
                <span>{freqLabel}</span>
              </span>
            </div>
          </div>
        </Link>

        {/* Day strip */}
        <div className="grid grid-cols-7 gap-1.5 sm:w-auto">
          {item.days.map((d) => (
            <DayCell
              key={d.date}
              day={d}
              color={item.pillarColor}
              onClick={() => onToggle(d)}
            />
          ))}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 sm:justify-end sm:w-[88px] shrink-0">
          <div className="text-right">
            <div className={`text-base font-bold tabular-nums ${percentClass}`}>
              {item.weeklyPercent}%
            </div>
            <div className="text-[10px] text-neutral-400 tabular-nums">
              {item.weeklyDone}/{item.weeklyTarget}
            </div>
          </div>
          {item.currentStreak > 0 ? (
            <span
              className="inline-flex items-center gap-0.5 text-[11px] text-amber-700 tabular-nums shrink-0"
              title="Aktualna seria"
            >
              <Flame size={11} />
              {item.currentStreak}
            </span>
          ) : (
            <span className="w-3 shrink-0" />
          )}
        </div>
      </div>
    </li>
  );
}

function DayCell({
  day,
  color,
  onClick,
}: {
  day: HabitWeekDay;
  color: string;
  onClick: () => void;
}) {
  const interactive = !day.isFuture;
  const base =
    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all";

  if (!day.scheduled) {
    return (
      <div
        className={`${base} text-neutral-300 bg-neutral-50 border border-dashed border-neutral-200`}
        title="Nie zaplanowane"
        aria-label="Nie zaplanowane"
      >
        ·
      </div>
    );
  }

  if (day.done) {
    return (
      <button
        onClick={onClick}
        disabled={!interactive}
        title={`${day.date} — zrobione`}
        aria-label={`${day.date} zrobione, kliknij aby cofnąć`}
        className={`${base} text-white shadow-sm hover:opacity-90 active:scale-95 ${
          day.isToday ? "ring-2 ring-offset-1 ring-neutral-900" : ""
        }`}
        style={{ backgroundColor: color }}
      >
        <Check size={14} strokeWidth={3} />
      </button>
    );
  }

  // Scheduled, not done
  if (day.isFuture) {
    return (
      <div
        className={`${base} border border-dashed`}
        style={{
          borderColor: `${color}55`,
          color: `${color}aa`,
          backgroundColor: `${color}08`,
        }}
        title={`${day.date} — przed nami`}
      >
        {format(new Date(day.date), "d")}
      </div>
    );
  }

  // Past or today, not done — clickable empty slot
  return (
    <button
      onClick={onClick}
      title={`${day.date} — oznacz jako zrobione`}
      aria-label={`${day.date} nie zrobione, kliknij aby oznaczyć`}
      className={`${base} border-2 hover:scale-105 active:scale-95 ${
        day.isToday ? "ring-2 ring-offset-1 ring-neutral-900" : ""
      }`}
      style={{
        borderColor: `${color}66`,
        color: `${color}cc`,
        backgroundColor: day.isToday ? `${color}14` : "transparent",
      }}
    >
      {format(new Date(day.date), "d")}
    </button>
  );
}

function formatFrequency(item: HabitWeekItem): string {
  const cfg = item.cfg;
  if (cfg.frequency === "daily") return "codziennie";
  if (cfg.frequency === "weekly")
    return `${cfg.timesPerWeek ?? 1}× w tygodniu`;
  const days = cfg.customDays ?? [];
  if (days.length === 0) return "wybrane dni";
  return days.map((d) => DAY_LABELS_PL[d]).join("·");
}

function percentColor(p: number): string {
  if (p >= 100) return "text-emerald-600";
  if (p >= 75) return "text-neutral-900";
  if (p >= 50) return "text-neutral-700";
  if (p >= 25) return "text-amber-600";
  return "text-red-600";
}
