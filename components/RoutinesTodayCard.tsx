"use client";

import Link from "next/link";
import { Check, Clock, Repeat } from "lucide-react";
import { useStore } from "@/lib/store";
import { format } from "date-fns";
import { getRoutinesForToday, type RoutineForToday } from "@/lib/routines-today";
import { StatCard, StatCardHeader } from "@/components/ui";
import { uid } from "@/lib/utils";

export function RoutinesTodayCard() {
  const state = useStore();
  const toggleRoutineCompletion = useStore((s) => s.toggleRoutineCompletion);
  const updateMilestone = useStore((s) => s.updateMilestone);

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const routines = getRoutinesForToday(state, today);
  const doneCount = routines.filter((r) => r.doneToday).length;

  const toggle = (r: RoutineForToday) => {
    if (r.kind === "goal") {
      toggleRoutineCompletion(r.goalId, todayStr, !r.doneToday);
      return;
    }
    // milestone
    const existing = r.cfg.completions.find((c) => c.date === todayStr);
    const completions = existing
      ? r.cfg.completions.map((c) =>
          c.date === todayStr ? { ...c, completed: !r.doneToday } : c,
        )
      : [
          ...r.cfg.completions,
          { id: uid(), date: todayStr, completed: !r.doneToday },
        ];
    if (r.milestoneId) {
      updateMilestone(r.goalId, r.milestoneId, {
        routineConfig: { ...r.cfg, completions },
      });
    }
  };

  return (
    <StatCard>
      <StatCardHeader
        label="Rutyny dziś"
        right={
          routines.length > 0
            ? `${doneCount}/${routines.length}`
            : "nic na dziś"
        }
      />

      {routines.length === 0 ? (
        <div className="flex items-start gap-3 py-2">
          <Repeat size={16} className="text-neutral-300 mt-0.5 shrink-0" />
          <p className="text-sm text-neutral-500 leading-relaxed">
            Brak aktywnych rutyn na dziś. Dodaj cel typu{" "}
            <span className="text-neutral-700">Rutyna</span> w filarze albo
            zaznacz krok w celu mieszanym jako rutynowy.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {routines.map((r) => (
            <RoutineRow key={r.key} r={r} onToggle={() => toggle(r)} />
          ))}
        </ul>
      )}
    </StatCard>
  );
}

function RoutineRow({
  r,
  onToggle,
}: {
  r: RoutineForToday;
  onToggle: () => void;
}) {
  return (
    <li className="group py-2.5 first:pt-1">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggle}
          aria-label={
            r.doneToday ? `Cofnij — ${r.routineTitle}` : `Oznacz zrobione — ${r.routineTitle}`
          }
          className="shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all hover:scale-105"
          style={
            r.doneToday
              ? { backgroundColor: r.pillarColor, borderColor: r.pillarColor }
              : { borderColor: `${r.pillarColor}80` }
          }
        >
          {r.doneToday ? (
            <Check size={14} className="text-white" strokeWidth={3} />
          ) : null}
        </button>

        <Link
          href={`/goal/${r.goalId}`}
          className="flex-1 min-w-0 -mx-2 px-2 py-0.5 rounded-md hover:bg-neutral-50 transition-colors"
        >
          <div className="flex items-baseline gap-2">
            <span
              className={`font-medium truncate ${
                r.doneToday
                  ? "text-neutral-400 line-through"
                  : "text-neutral-900"
              }`}
            >
              {r.routineTitle}
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 shrink-0 tabular-nums">
              <Clock size={9} /> {r.durationMinutes}m
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ backgroundColor: r.pillarColor }}
            />
            <span className="truncate">
              {r.pillarName}
              {r.kind === "milestone" ? (
                <>
                  <span className="text-neutral-300"> · </span>
                  <span className="text-neutral-500">{r.goalTitle}</span>
                </>
              ) : null}
            </span>
            <span className="text-neutral-300">·</span>
            <span className="tabular-nums text-neutral-500 shrink-0">
              {r.thisWeekDone}/{r.weeklyTarget} tyg.
            </span>
          </div>
        </Link>
      </div>
    </li>
  );
}
