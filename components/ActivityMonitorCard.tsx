"use client";

import { useStore } from "@/lib/store";
import { computeActivityStats } from "@/lib/activity";
import { StatCard, StatCardHeader, MiniBar } from "@/components/ui";

export function ActivityMonitorCard() {
  const state = useStore();
  const stats = computeActivityStats(state);

  return (
    <StatCard className="!p-5 sm:!p-6">
      <StatCardHeader label="Aktywność" right="ostatnie 7 dni" />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-5">
        <Metric
          label="Dziś"
          value={
            stats.todayScheduled > 0 ? (
              <>
                <span className="tabular-nums">{stats.todayCompleted}</span>
                <span className="text-2xl text-neutral-400 font-medium">
                  /{stats.todayScheduled}
                </span>
              </>
            ) : (
              <span className="text-neutral-400">—</span>
            )
          }
          unit={stats.todayScheduled > 0 ? "slotów" : "brak planu"}
        />

        <Metric
          label="Ten tydzień"
          value={
            stats.weekScheduledH > 0 ? (
              <span className="tabular-nums">{stats.weekPct}%</span>
            ) : (
              <span className="text-neutral-400">—</span>
            )
          }
          unit={
            stats.weekScheduledH > 0
              ? `${stats.weekCompletedH.toFixed(1)}h z ${stats.weekScheduledH.toFixed(0)}h`
              : "—"
          }
          accent={pctAccent(stats.weekPct, stats.weekScheduledH > 0)}
        />

        <Metric
          label="Seria"
          value={
            stats.streakDays > 0 ? (
              <span className="tabular-nums">{stats.streakDays}</span>
            ) : (
              <span className="text-neutral-400">0</span>
            )
          }
          unit={streakLabel(stats.streakDays)}
          accent={stats.streakDays >= 3 ? "text-emerald-700" : undefined}
        />

        <Metric
          label="Rytm"
          value={
            <MiniBar
              values={
                stats.dailyCompletions.some((v) => v > 0)
                  ? stats.dailyCompletions
                  : [0, 0, 0, 0, 0, 0, 0]
              }
              max={Math.max(2, ...stats.dailyCompletions)}
              accent="lavender"
              height={32}
              className="!gap-1.5"
            />
          }
          unit={
            stats.thoughtsThisWeek > 0
              ? `${stats.thoughtsThisWeek} ${thoughtsLabel(stats.thoughtsThisWeek)} w tym tygodniu`
              : "brak myśli w tym tygodniu"
          }
          isViz
        />
      </div>

      {!stats.hasAnyHistory ? (
        <p className="mt-4 text-xs text-neutral-500 leading-relaxed">
          Wskaźniki rozjaśnią się, gdy zaczniesz oznaczać sloty jako zrealizowane
          albo zapisywać przemyślenia.
        </p>
      ) : null}
    </StatCard>
  );
}

function Metric({
  label,
  value,
  unit,
  accent,
  isViz,
}: {
  label: string;
  value: React.ReactNode;
  unit?: React.ReactNode;
  accent?: string;
  isViz?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="stat-label mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1 min-w-0">
        {isViz ? (
          value
        ) : (
          <span
            className={`text-4xl sm:text-5xl font-bold tracking-tight leading-none truncate ${accent ?? "text-neutral-900"}`}
          >
            {value}
          </span>
        )}
      </div>
      {unit ? (
        <div className="text-xs text-neutral-500 mt-1.5 truncate">{unit}</div>
      ) : null}
    </div>
  );
}

function pctAccent(pct: number, hasData: boolean): string | undefined {
  if (!hasData) return undefined;
  if (pct >= 95 && pct <= 110) return "text-emerald-700";
  if (pct >= 75) return "text-neutral-900";
  if (pct >= 50) return "text-amber-700";
  return "text-neutral-500";
}

function streakLabel(n: number): string {
  if (n === 0) return "brak aktywnych dni";
  if (n === 1) return "dzień z rzędu";
  if (n >= 2 && n <= 4) return "dni z rzędu";
  return "dni z rzędu";
}

function thoughtsLabel(n: number): string {
  if (n === 1) return "myśl";
  const last = n % 10;
  const lastTwo = n % 100;
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return "myśli";
  return "myśli";
}
