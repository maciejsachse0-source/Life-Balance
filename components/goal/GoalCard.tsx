"use client";

import type { CSSProperties } from "react";
import Link from "next/link";
import { Target, Repeat, Layers as LayersIcon, Check } from "lucide-react";
import { addDays, format, isSameDay } from "date-fns";
import { pl } from "date-fns/locale";
import type { Goal, GoalCharacter, Milestone, Pillar, RoutineConfig } from "@/lib/types";
import { getRoutineStats, startOfIsoWeek } from "@/lib/routine";

type Props = {
  goal: Goal;
  pillar: Pillar;
};

function milestoneProgress(m: Milestone): number {
  const tasks = m.tasks ?? [];
  if (tasks.length > 0) {
    const done = tasks.filter((t) => t.status === "Done").length;
    return (done / tasks.length) * 100;
  }
  const completions = m.routineConfig?.completions ?? [];
  if (completions.length === 0) return 0;
  const done = completions.filter((c) => c.completed).length;
  return Math.min(100, (done / completions.length) * 100);
}

const DAY_SHORT_PL: Record<string, string> = {
  mon: "Pn",
  tue: "Wt",
  wed: "Śr",
  thu: "Cz",
  fri: "Pt",
  sat: "Sb",
  sun: "Nd",
};

function formatRoutineFrequency(cfg: RoutineConfig): string {
  if (cfg.frequency === "daily") return "Codziennie";
  if (cfg.frequency === "weekly") {
    const n = cfg.timesPerWeek ?? 1;
    return `${n}× w tygodniu`;
  }
  const days = cfg.customDays ?? [];
  if (days.length === 0) return "Wybrane dni";
  return days.map((d) => DAY_SHORT_PL[d] ?? d).join(" · ");
}

export function GoalCard({ goal, pillar }: Props) {
  const milestones = goal.milestones ?? [];
  const isRoutine = goal.character === "Routine";
  const color = pillar.color;

  let progress = 0;
  let routineLabel: string | null = null;
  const routineStats = isRoutine ? getRoutineStats(goal) : null;
  if (isRoutine) {
    if (routineStats && routineStats.weeklyTarget > 0) {
      progress = Math.min(100, (routineStats.thisWeekDone / routineStats.weeklyTarget) * 100);
      routineLabel = `${routineStats.thisWeekDone}/${routineStats.weeklyTarget} w tym tyg.`;
    }
  } else if (milestones.length > 0) {
    progress =
      milestones.reduce((acc, m) => acc + milestoneProgress(m), 0) / milestones.length;
  }

  const doneMilestones = milestones.filter((m) => milestoneProgress(m) >= 100).length;
  const showProjectPreview = !isRoutine && milestones.length > 0;
  const routineCfg = goal.routineConfig;
  const showRoutinePreview = isRoutine && !!routineCfg;
  const showPreview = showProjectPreview || showRoutinePreview;

  return (
    <Link
      href={`/goal/${goal.id}`}
      className="group block bg-white border border-neutral-200 rounded-lg hover:border-neutral-400 hover:shadow-md transition-[border-color,box-shadow] duration-150 overflow-hidden"
    >
      <div className="p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <CharacterIcon character={goal.character} />
          <span className="font-medium truncate">{goal.title}</span>
          <span className="ml-auto text-xs text-neutral-400">{goal.status}</span>
        </div>
        {goal.description ? (
          <p className="text-sm text-neutral-500 line-clamp-1 mb-2">{goal.description}</p>
        ) : null}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full transition-[width] duration-300"
              style={{
                width: `${progress}%`,
                background: `linear-gradient(90deg, ${color}90, ${color})`,
              }}
            />
          </div>
          <span className="text-xs font-semibold tabular-nums" style={{ color }}>
            {Math.round(progress)}%
          </span>
          {showProjectPreview ? (
            <div
              className="flex items-center gap-0.5"
              aria-label={`${doneMilestones}/${milestones.length} milestonów`}
            >
              {milestones.slice(0, 8).map((m) => {
                const done = milestoneProgress(m) >= 100;
                return (
                  <span
                    key={m.id}
                    className="block w-2 h-2 rounded-full border"
                    style={{
                      background: done ? color : "transparent",
                      borderColor: done ? color : `${color}80`,
                    }}
                  />
                );
              })}
              {milestones.length > 8 ? (
                <span className="text-[10px] text-neutral-400 ml-1">
                  +{milestones.length - 8}
                </span>
              ) : null}
            </div>
          ) : routineLabel ? (
            <span className="text-[11px] text-neutral-500">{routineLabel}</span>
          ) : null}
        </div>
      </div>

      {showPreview ? (
        <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr] transition-[grid-template-rows] duration-300 ease-out">
         <div className="overflow-hidden">
          <div className="px-3 pb-3 pt-2 border-t border-neutral-100 bg-neutral-50/40">
            {showProjectPreview ? (
            <ul className="relative pl-6 space-y-1">
              <span
                aria-hidden
                className="absolute left-1.5 top-2 bottom-2 w-px"
                style={{ background: color, opacity: 0.4 }}
              />
              {milestones.map((m) => {
                const p = milestoneProgress(m);
                const done = p >= 100;
                const tasksTotal = (m.tasks ?? []).length;
                const tasksDone = (m.tasks ?? []).filter((t) => t.status === "Done").length;
                return (
                  <li key={m.id} className="relative flex items-center gap-2">
                    <svg
                      aria-hidden
                      className="absolute -left-[18px] top-0 pointer-events-none"
                      width="20"
                      height="22"
                      viewBox="0 0 20 22"
                    >
                      <path
                        d="M 2 0 Q 2 11, 18 11"
                        stroke={color}
                        strokeOpacity="0.45"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </svg>
                    <span
                      className="flex-none w-3.5 h-3.5 rounded-full border flex items-center justify-center"
                      style={{
                        background: done ? color : "transparent",
                        borderColor: done ? color : `${color}80`,
                      }}
                      aria-label={done ? "Ukończony" : "W toku"}
                    >
                      {done ? <Check size={9} className="text-white" strokeWidth={3} /> : null}
                    </span>
                    <span
                      className={`text-xs flex-1 truncate ${
                        done ? "text-neutral-400 line-through" : "text-neutral-700"
                      }`}
                    >
                      {m.title}
                    </span>
                    {tasksTotal > 0 ? (
                      <span className="text-[10px] text-neutral-400 tabular-nums">
                        {tasksDone}/{tasksTotal}
                      </span>
                    ) : null}
                    <span className="text-[10px] text-neutral-500 tabular-nums w-7 text-right">
                      {Math.round(p)}%
                    </span>
                    <div className="w-12 h-1 rounded-full bg-neutral-200 overflow-hidden flex-none">
                      <div
                        className="h-full"
                        style={{
                          width: `${p}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            ) : null}
            {showRoutinePreview && routineCfg ? (
              <div className="space-y-2.5">
                <WeekStrip completions={routineCfg.completions} color={color} cfg={routineCfg} />
                <Legend color={color} />
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-neutral-500">
                  <span>
                    Streak{" "}
                    <span className="tabular-nums text-neutral-700">
                      {routineStats?.currentStreak ?? 0}
                    </span>
                  </span>
                  <span>
                    Najdłuższy{" "}
                    <span className="tabular-nums text-neutral-700">
                      {routineStats?.longestStreak ?? 0}
                    </span>
                  </span>
                  <span>
                    W tym tyg.{" "}
                    <span className="tabular-nums text-neutral-700">
                      {routineStats?.thisWeekDone ?? 0}/
                      {routineStats?.weeklyTarget ?? 0}
                    </span>
                  </span>
                  <span>
                    Łącznie{" "}
                    <span className="tabular-nums text-neutral-700">
                      {routineStats?.totalDone ?? 0}
                    </span>
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-neutral-400">
                  <span>{formatRoutineFrequency(routineCfg)}</span>
                  <span className="tabular-nums">
                    {routineCfg.durationMinutes} min · {routineCfg.workType}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
         </div>
        </div>
      ) : null}
    </Link>
  );
}

function CharacterIcon({ character }: { character: GoalCharacter }) {
  if (character === "Project") return <Target size={14} className="text-indigo-500" />;
  if (character === "Routine") return <Repeat size={14} className="text-emerald-500" />;
  return <LayersIcon size={14} className="text-violet-500" />;
}

const DAY_INDEX_TO_SHORT: ("mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun")[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

type CellState = "done" | "planned" | "empty";

function getCellState(
  date: Date,
  cfg: RoutineConfig,
  doneSet: Set<string>,
  dateStr: string,
): CellState {
  if (doneSet.has(dateStr)) return "done";
  if (cfg.frequency === "daily") return "planned";
  if (cfg.frequency === "custom") {
    const dow = (date.getDay() + 6) % 7; // 0 = Mon
    const dayShort = DAY_INDEX_TO_SHORT[dow];
    return cfg.customDays?.includes(dayShort) ? "planned" : "empty";
  }
  // weekly: target is N/week without specific days — treat all days as candidates
  return "planned";
}

function WeekStrip({
  completions,
  color,
  cfg,
}: {
  completions: { date: string; completed: boolean }[];
  color: string;
  cfg: RoutineConfig;
}) {
  const today = new Date();
  const monday = startOfIsoWeek(today);
  const weekEnd = addDays(monday, 6);
  const doneSet = new Set(completions.filter((c) => c.completed).map((c) => c.date));
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const labels = ["Pn", "Wt", "Śr", "Cz", "Pt", "Sb", "Nd"];

  return (
    <div>
      <div className="flex items-center justify-between mb-1 text-[10px] text-neutral-400">
        <span className="uppercase tracking-wide">Ten tydzień</span>
        <span className="tabular-nums">
          {format(monday, "d MMM", { locale: pl })} –{" "}
          {format(weekEnd, "d MMM", { locale: pl })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const isToday = isSameDay(d, today);
          const state = getCellState(d, cfg, doneSet, dateStr);
          const styles = cellStyles(state, color);
          return (
            <div key={dateStr} className="flex flex-col items-center gap-0.5">
              <span
                className={`text-[10px] ${
                  isToday ? "font-semibold text-neutral-700" : "text-neutral-400"
                }`}
              >
                {labels[i]}
              </span>
              <span
                className={`block w-full h-4 rounded-sm ${
                  isToday ? "ring-1 ring-neutral-400" : ""
                }`}
                style={styles}
                title={`${format(d, "EEEE, d MMM", { locale: pl })} — ${
                  state === "done" ? "zrobione" : state === "planned" ? "zaplanowane" : "puste"
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cellStyles(state: CellState, color: string): CSSProperties {
  if (state === "done") return { background: color };
  if (state === "planned")
    return {
      background: `${color}1f`, // ~12% alpha
      border: `1px solid ${color}66`,
    };
  return { background: "#f4f4f5" };
}

function Legend({ color }: { color: string }) {
  return (
    <div className="flex items-center gap-3 text-[10px] text-neutral-500">
      <span className="inline-flex items-center gap-1">
        <span
          className="block w-2.5 h-2.5 rounded-sm"
          style={{ background: color }}
        />
        Zrobione
      </span>
      <span className="inline-flex items-center gap-1">
        <span
          className="block w-2.5 h-2.5 rounded-sm"
          style={{ background: `${color}1f`, border: `1px solid ${color}66` }}
        />
        Zaplanowane
      </span>
      <span className="inline-flex items-center gap-1">
        <span className="block w-2.5 h-2.5 rounded-sm bg-neutral-100" />
        Puste
      </span>
    </div>
  );
}

